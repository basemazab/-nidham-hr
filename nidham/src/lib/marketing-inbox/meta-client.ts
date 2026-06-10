// ============================================================================
// Meta Graph API client — send replies to Messenger / Instagram
// ============================================================================
//
// Minimal HTTP wrapper around Meta's "Send API". One method that matters:
// `sendMessage` posts a reply to a given user (PSID for Messenger,
// IG-scoped-user-id for Instagram).
//
// References:
//   https://developers.facebook.com/docs/messenger-platform/send-messages
//   https://developers.facebook.com/docs/instagram-api/guides/messaging
//
// We don't use the Meta SDK because:
//   1. Single-purpose call — adding a 100KB SDK is overkill
//   2. We need fine-grained error handling (rate limits, token expiry)
//   3. Edge runtime compatibility — pure fetch works everywhere

import crypto from "crypto";

const GRAPH_API_VERSION = "v21.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

// ── Send a message back to a user ──
export async function sendMetaMessage(input: {
  channel: "messenger" | "instagram";
  pageToken: string;       // Page Access Token (from settings)
  recipientId: string;     // PSID (Messenger) or IGSID (Instagram)
  text: string;
  // Optional tappable buttons (used by Flow builder). On tap, Meta sends a
  // message event back with message.quick_reply.payload = the payload here.
  quickReplies?: { title: string; payload: string }[];
}): Promise<
  | { ok: true; messageId: string }
  | { ok: false; error: string; outsideWindow?: boolean }
> {
  // Messenger uses /me/messages, IG also uses /me/messages but with the
  // same Page token (since IG accounts are linked to a Page). The
  // recipient_id format differs but the call shape is identical.
  const url = `${GRAPH_BASE}/me/messages?access_token=${encodeURIComponent(input.pageToken)}`;

  const message: Record<string, unknown> = { text: input.text };
  if (input.quickReplies && input.quickReplies.length > 0) {
    message.quick_replies = input.quickReplies.slice(0, 13).map((q) => ({
      content_type: "text",
      title: q.title.slice(0, 20), // Meta caps quick-reply titles at 20 chars
      payload: q.payload.slice(0, 1000),
    }));
  }

  const body = {
    recipient: { id: input.recipientId },
    message,
    messaging_type: "RESPONSE", // "I'm responding to a user-initiated message" — within 24h window
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = (await res.json()) as {
      message_id?: string;
      error?: { message?: string; code?: number; error_subcode?: number };
    };

    if (!res.ok || data.error) {
      const friendly = friendlyMetaError(data.error, res.status);
      return {
        ok: false,
        error: friendly.message,
        outsideWindow: friendly.outsideWindow,
      };
    }

    return { ok: true, messageId: data.message_id || "" };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ── Send a FILE / IMAGE attachment back to a user (by public URL) ──
// Meta's Send API can't carry text + an attachment in one message, so the
// webhook sends the text reply first (sendMetaMessage) and then each file here
// as its own message. `is_reusable` lets Meta cache the upload so re-sending
// the same catalog later is instant. Same 24h-window rules as text.
export async function sendMetaAttachment(input: {
  channel: "messenger" | "instagram";
  pageToken: string;
  recipientId: string;
  url: string;
  type: "file" | "image" | "video" | "audio";
}): Promise<
  | { ok: true; messageId: string }
  | { ok: false; error: string; outsideWindow?: boolean }
> {
  const endpoint = `${GRAPH_BASE}/me/messages?access_token=${encodeURIComponent(input.pageToken)}`;

  const body = {
    recipient: { id: input.recipientId },
    message: {
      attachment: {
        type: input.type,
        payload: { url: input.url, is_reusable: true },
      },
    },
    messaging_type: "RESPONSE",
  };

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = (await res.json()) as {
      message_id?: string;
      error?: { message?: string; code?: number; error_subcode?: number };
    };

    if (!res.ok || data.error) {
      const friendly = friendlyMetaError(data.error, res.status);
      return {
        ok: false,
        error: friendly.message,
        outsideWindow: friendly.outsideWindow,
      };
    }

    return { ok: true, messageId: data.message_id || "" };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// Translate Meta's terse English error codes into clear Arabic guidance HR
// can act on. The most common one by far is the 24-hour messaging window:
// Meta only lets a business send a FREE-FORM reply within 24h of the user's
// last message (code 10 / subcode 2018278). After that you need a pre-approved
// message template — which the company must create in Meta Business Manager.
function friendlyMetaError(
  error: { message?: string; code?: number; error_subcode?: number } | undefined,
  httpStatus: number,
): { message: string; outsideWindow: boolean } {
  const code = error?.code;
  const sub = error?.error_subcode;
  const raw = (error?.message || "").toLowerCase();

  const isWindow =
    sub === 2018278 ||
    (code === 10 && raw.includes("24")) ||
    raw.includes("outside") ||
    raw.includes("window") ||
    raw.includes("message tag") ||
    raw.includes("24 hours") ||
    raw.includes("standard messaging");
  if (isWindow) {
    return {
      outsideWindow: true,
      message:
        "العميل آخر رسالة ليه بقالها أكتر من 24 ساعة — سياسة Meta بتمنع الرد المجاني بعد المدة دي. " +
        "الرد هيشتغل تلقائي لو العميل بعت رسالة جديدة. للتواصل بعد 24 ساعة لازم رسالة قالب (Template) معتمدة من Meta.",
    };
  }

  if (code === 190) {
    return {
      outsideWindow: false,
      message:
        "توكن صفحة Meta منتهي أو غير صالح — جدّد Page Access Token من إعدادات الصندوق.",
    };
  }
  // "Unsupported post request / Object does not exist or missing permissions"
  // — the classic comment-ops failure: the token lacks the COMMENT permissions
  // (pages_manage_engagement + pages_read_user_content), or the app is in
  // Development mode and the commenter has no role on the app, so Meta hides
  // the comment object entirely.
  if (
    code === 100 &&
    (raw.includes("unsupported post request") || raw.includes("does not exist"))
  ) {
    return {
      outsideWindow: false,
      message:
        "Meta رفضت الوصول للكومنت — التوكن غالبًا ناقص صلاحيات الكومنتات (pages_manage_engagement + pages_read_user_content)، " +
        "أو التطبيق وضع Development والمعلّق ملوش دور عليه. جدّد التوكن بالصلاحيتين دول من Graph API Explorer وحوّله لدائم، وجرّب بكومنت من حساب أدمن/تستر.",
    };
  }
  if (code === 200 || code === 10 || code === 803) {
    return {
      outsideWindow: false,
      message:
        "صلاحيات Meta ناقصة لإرسال الرسائل — تأكد إن الصفحة مربوطة وإن للتطبيق صلاحية pages_messaging.",
    };
  }

  return {
    outsideWindow: false,
    message: error?.message || `فشل الإرسال (HTTP ${httpStatus})`,
  };
}

// ── Public reply under a comment ──
// POST /{comment-id}/comments → posts a visible reply beneath the comment.
export async function replyToComment(input: {
  pageToken: string;
  commentId: string;
  message: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const url = `${GRAPH_BASE}/${encodeURIComponent(input.commentId)}/comments?access_token=${encodeURIComponent(input.pageToken)}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input.message }),
    });
    const data = (await res.json()) as {
      id?: string;
      error?: { message?: string; code?: number; error_subcode?: number };
    };
    if (!res.ok || data.error) {
      return { ok: false, error: friendlyMetaError(data.error, res.status).message };
    }
    return { ok: true, id: data.id || "" };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// ── Private (DM) reply to a comment ──
// POST /{comment-id}/private_replies → Meta lets a business send ONE private
// message to whoever wrote a comment. Perfect for moving a public comment into
// a tracked DM lead. (Fails if the window/permission isn't there — caller logs.)
export async function sendPrivateReply(input: {
  pageToken: string;
  commentId: string;
  message: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const url = `${GRAPH_BASE}/${encodeURIComponent(input.commentId)}/private_replies?access_token=${encodeURIComponent(input.pageToken)}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input.message }),
    });
    const data = (await res.json()) as {
      id?: string;
      error?: { message?: string; code?: number; error_subcode?: number };
    };
    if (!res.ok || data.error) {
      return { ok: false, error: friendlyMetaError(data.error, res.status).message };
    }
    return { ok: true, id: data.id || "" };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// ── Verify webhook signature ──
//
// Meta signs every webhook with HMAC-SHA256 of the body using the
// configured App Secret. We MUST verify this — otherwise anyone can
// post fake messages to our webhook and we'd process them.
//
// The signature comes in the `x-hub-signature-256` header as `sha256=HEX`.
export function verifyMetaSignature(input: {
  rawBody: string;
  signatureHeader: string | null;
  appSecret: string;
}): boolean {
  if (!input.signatureHeader || !input.appSecret) return false;

  const [algo, hex] = input.signatureHeader.split("=");
  if (algo !== "sha256" || !hex) return false;

  const expected = crypto
    .createHmac("sha256", input.appSecret)
    .update(input.rawBody, "utf8")
    .digest("hex");

  // Constant-time compare to dodge timing attacks
  if (expected.length !== hex.length) return false;
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(hex, "hex"),
    );
  } catch {
    return false;
  }
}

// ── Fetch user profile (display name + picture) ──
//
// Called lazily the first time we see a new external_user_id, so the
// inbox can show "Ahmed Ali" instead of a numeric PSID. Optional — if
// it fails (token scope insufficient), we just leave the fields null.
export async function fetchUserProfile(input: {
  channel: "messenger" | "instagram";
  pageToken: string;
  externalUserId: string;
}): Promise<{ name?: string; picture?: string } | null> {
  // For Messenger: GET /{psid}?fields=first_name,last_name,profile_pic
  // For Instagram: GET /{igsid}?fields=name,profile_pic
  const fields =
    input.channel === "messenger"
      ? "first_name,last_name,profile_pic"
      : "name,profile_pic";

  const url = `${GRAPH_BASE}/${input.externalUserId}?fields=${fields}&access_token=${encodeURIComponent(input.pageToken)}`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      first_name?: string;
      last_name?: string;
      name?: string;
      profile_pic?: string;
    };
    const name =
      data.name ||
      [data.first_name, data.last_name].filter(Boolean).join(" ") ||
      undefined;
    return {
      name,
      picture: data.profile_pic,
    };
  } catch {
    return null;
  }
}
