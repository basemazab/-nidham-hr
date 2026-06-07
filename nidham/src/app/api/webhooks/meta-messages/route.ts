// ============================================================================
// /api/webhooks/meta-messages — receives Facebook / Instagram messages
// ============================================================================
//
// Meta calls this endpoint in TWO ways:
//
//   1. GET  /api/webhooks/meta-messages?hub.mode=subscribe&hub.verify_token=…&hub.challenge=…
//      → One-time verification during Meta App webhook setup. We respond
//        with the `hub.challenge` value IF the `hub.verify_token` matches
//        what's configured in marketing_inbox_settings for some tenant.
//
//   2. POST /api/webhooks/meta-messages
//      → Real incoming message event. Body shape:
//        {
//          "object": "page" | "instagram",
//          "entry": [{
//            "id": "<PAGE_ID>",                    // ← we map to tenant by this
//            "messaging": [{                       // for Messenger
//              "sender": { "id": "<PSID>" },
//              "recipient": { "id": "<PAGE_ID>" },
//              "timestamp": …,
//              "message": { "mid": "…", "text": "…" }
//            }]
//          }]
//        }
//
// We verify the HMAC signature, find the matching tenant by `meta_page_id`,
// upsert the conversation, store the message, then trigger an AI reply
// asynchronously (fire-and-forget so the webhook returns 200 fast).
//
// SECURITY:
//   • Meta retries up to 24h if we don't return 200 within 20s. So we
//     MUST respond fast — AI processing happens via `waitUntil` (Vercel)
//     or just async (the response goes out, the work continues).
//   • Signature verification protects against forged messages.
//   • Tenant scoping via meta_page_id ensures Pages can't cross-leak.

import { NextRequest, NextResponse, after } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  verifyMetaSignature,
  sendMetaMessage,
  fetchUserProfile,
  replyToComment,
  sendPrivateReply,
} from "@/lib/marketing-inbox/meta-client";
import {
  generateMarketingReply,
  type ConversationTurn,
} from "@/lib/marketing-inbox/ai-reply";

// Force Node runtime (we need `crypto` for HMAC and our service-role
// Supabase client). Edge runtime would block the HMAC.
export const runtime = "nodejs";
// Give the post-response AI work (generate reply + send via Graph API +
// optional fallback model) room to finish inside after().
export const maxDuration = 60;

// ── 1) GET — Meta webhook verification handshake ──
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode !== "subscribe" || !token || !challenge) {
    return new NextResponse("Bad request", { status: 400 });
  }

  // Find ANY tenant with this verify_token configured.
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("marketing_inbox_settings")
    .select("company_id")
    .eq("meta_verify_token", token)
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    // Don't reveal which tokens are valid — generic 403
    return new NextResponse("Forbidden", { status: 403 });
  }

  // التعديل السحري والنهائي: إرجاع الـ challenge كـ نص خام صافي (Plain Text)
  return new Response(challenge, {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}

// ── 2) POST — incoming message event ──
export async function POST(req: NextRequest) {
  // We need the raw body for signature verification. Reading req.json()
  // would consume the stream, so capture text first.
  const rawBody = await req.text();
  const signatureHeader = req.headers.get("x-hub-signature-256");

  // Parse JSON — Meta always sends valid JSON.
  let payload: MetaWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new NextResponse("Bad payload", { status: 400 });
  }

  // Acknowledge fast — Meta times out after 20s. The reply work (find tenant,
  // store message, generate AI reply, send via Graph API) runs in after() so
  // it executes IMMEDIATELY and RELIABLY once the 200 is sent. A bare
  // fire-and-forget promise gets frozen/deprioritized when the serverless
  // function returns, which delayed (or dropped) replies — after() keeps the
  // function alive until the work completes.
  after(async () => {
    try {
      await processEventAsync(payload, rawBody, signatureHeader);
    } catch (err) {
      console.error("[meta-webhook] async processing failed:", err);
    }
  });

  return NextResponse.json({ ok: true });
}

// ── Types — minimal subset of Meta's payload shape ──
type MetaWebhookPayload = {
  object: "page" | "instagram";
  entry: Array<{
    id: string; // page id (Messenger) or IG account id (Instagram)
    time?: number;
    messaging?: Array<{
      sender: { id: string };
      recipient: { id: string };
      timestamp: number;
      message?: {
        mid: string;
        text?: string;
        is_echo?: boolean;
        quick_reply?: { payload?: string }; // tapped Flow button
        attachments?: Array<{ type: string; payload?: { url?: string } }>;
      };
    }>;
    // Page "feed" (FB comments) + IG "comments" events arrive here.
    changes?: Array<{
      field: string; // "feed" (FB) | "comments" (IG)
      value: {
        item?: string; // "comment"
        verb?: string; // "add" | "edited" | "remove"
        comment_id?: string; // FB
        id?: string; // IG comment id
        post_id?: string;
        parent_id?: string;
        message?: string; // FB comment text
        text?: string; // IG comment text
        from?: { id?: string; name?: string; username?: string };
        media?: { id?: string };
      };
    }>;
  }>;
};

// ── Async processor — runs after the 200 response is sent ──
async function processEventAsync(
  payload: MetaWebhookPayload,
  rawBody: string,
  signatureHeader: string | null,
): Promise<void> {
  const supabase = createServiceClient();

  for (const entry of payload.entry || []) {
    const pageId = entry.id;
    const channel = payload.object === "instagram" ? "instagram" : "messenger";

    // Find tenant by page_id
    const { data: settings } = await supabase
      .from("marketing_inbox_settings")
      .select(
        "company_id, meta_page_token, meta_app_secret, ai_enabled, ai_system_prompt, ai_business_context, ai_handoff_keywords, auto_push_to_crm, channel_messenger, channel_instagram, auto_reply_comments, comment_public_reply, comment_private_reply, comment_public_text",
      )
      .eq("meta_page_id", pageId)
      .maybeSingle();

    // No tenant owns this Page ID → drop the event. We must NEVER fall back
    // to another company's settings: that would cross-leak their page token,
    // AI business context, and CRM leads. Resolve strictly by meta_page_id.
    if (!settings) {
      continue;
    }

    // Verify signature — MANDATORY. A page with no app_secret configured
    // can't be authenticated, so we drop the event rather than trust an
    // unsigned payload (which would let anyone forge inbound messages).
    if (!settings.meta_app_secret) {
      console.warn(
        "[meta-webhook] no app_secret for page",
        pageId,
        "— dropping unverifiable event",
      );
      continue;
    }
    const valid = verifyMetaSignature({
      rawBody,
      signatureHeader,
      appSecret: settings.meta_app_secret,
    });
    if (!valid) {
      console.warn("[meta-webhook] signature mismatch for page", pageId);
      continue;
    }

    // Keyword auto-reply rules for this tenant — fetched once per entry. They
    // run BEFORE the AI and independently of the AI toggle (deterministic).
    const { data: ruleRows } = await supabase
      .from("marketing_auto_reply_rules")
      .select("keywords, response, match_type, apply_dm, apply_comment")
      .eq("company_id", settings.company_id)
      .eq("active", true)
      .order("priority", { ascending: false });
    const ruleList: AutoReplyRule[] = ruleRows || [];

    // Active button-menu flows for this tenant (trigger keywords only — node
    // bodies are fetched on demand when a flow starts / navigates).
    const { data: flowRows } = await supabase
      .from("marketing_flows")
      .select("id, trigger_keywords")
      .eq("company_id", settings.company_id)
      .eq("active", true);
    const flowList: FlowRow[] = flowRows || [];

    // Process each message in the entry
    for (const event of entry.messaging || []) {
      if (!event.message?.text || event.message.is_echo) continue;

      const senderId = event.sender.id;
      const messageText = event.message.text;
      const metaMessageId = event.message.mid;

      // Upsert conversation
      const conversationId = await upsertConversation({
        supabase,
        companyId: settings.company_id,
        channel,
        externalUserId: senderId,
        pageToken: settings.meta_page_token,
      });

      if (!conversationId) continue;

      // Insert the inbound message (ignore duplicates via unique constraint)
      const { error: insertErr } = await supabase
        .from("marketing_inbox_messages")
        .insert({
          conversation_id: conversationId,
          direction: "inbound",
          sender: "user",
          body: messageText,
          meta_message_id: metaMessageId,
        });

      if (insertErr) {
        if (insertErr.code !== "23505") {
          console.error("[meta-webhook] insert message failed:", insertErr);
        }
        continue;
      }

      const channelEnabled =
        (channel === "messenger" && settings.channel_messenger) ||
        (channel === "instagram" && settings.channel_instagram);

      // 0) Flow builder. A tapped button (quick_reply payload "FLOW:f:n")
      //    navigates to that node; otherwise a trigger keyword starts a flow.
      //    Either way we send the node + its buttons and skip rules/AI.
      if (channelEnabled && settings.meta_page_token) {
        const qr = event.message.quick_reply?.payload;
        if (qr && qr.startsWith("FLOW:")) {
          await runFlowNavigate({
            supabase,
            payload: qr,
            companyId: settings.company_id,
            channel,
            pageToken: settings.meta_page_token,
            recipientId: senderId,
            conversationId,
          });
          continue;
        }
        const startFlowId = findFlowByKeyword(flowList, messageText);
        if (startFlowId) {
          await runFlowStart({
            supabase,
            flowId: startFlowId,
            channel,
            pageToken: settings.meta_page_token,
            recipientId: senderId,
            conversationId,
          });
          continue;
        }
      }

      // 1) Keyword rules run FIRST and work even when AI is off (ManyChat-style,
      //    deterministic). First matching rule wins → send + skip AI.
      const ruleReply =
        channelEnabled && settings.meta_page_token
          ? findRuleResponse(ruleList, messageText, "dm")
          : null;
      if (ruleReply && settings.meta_page_token) {
        const send = await sendMetaMessage({
          channel,
          pageToken: settings.meta_page_token,
          recipientId: senderId,
          text: ruleReply,
        });
        await supabase.from("marketing_inbox_messages").insert({
          conversation_id: conversationId,
          direction: "outbound",
          sender: "ai",
          body: ruleReply,
          meta_message_id: send.ok ? send.messageId : null,
          sent_at: send.ok ? new Date().toISOString() : null,
          delivery_error: send.ok ? null : send.error,
        });
        await supabase
          .from("marketing_inbox_conversations")
          .update({
            ai_intent: "keyword_rule",
            status: send.ok ? "ai_replied" : "open",
            ai_last_run_at: new Date().toISOString(),
          })
          .eq("id", conversationId);
        continue;
      }

      // 2) Otherwise fall back to the AI reply — only if enabled AND channel on.
      if (settings.ai_enabled && channelEnabled && settings.meta_page_token) {
        await runAiReply({
          supabase,
          conversationId,
          companyId: settings.company_id,
          channel,
          recipientId: senderId,
          pageToken: settings.meta_page_token,
          userMessage: messageText,
          businessContext: settings.ai_business_context,
          systemPromptOverride: settings.ai_system_prompt,
          handoffKeywords: settings.ai_handoff_keywords || [],
          autoPushToCrm: settings.auto_push_to_crm,
        });
      } else if (!settings.ai_enabled) {
        await supabase
          .from("marketing_inbox_conversations")
          .update({ ai_intent: "ai_not_enabled" })
          .eq("id", conversationId);
      } else if (!channelEnabled) {
        await supabase
          .from("marketing_inbox_conversations")
          .update({ ai_intent: "channel_disabled" })
          .eq("id", conversationId);
      }
    }

    // ── Comments on page posts / ads (FB "feed") + IG "comments" ──
    if (settings.auto_reply_comments) {
      for (const change of entry.changes || []) {
        if (change.field !== "feed" && change.field !== "comments") continue;
        const v = change.value || {};
        if (v.item && v.item !== "comment") continue; // ignore likes/posts/shares
        if (v.verb && v.verb !== "add") continue; // only brand-new comments
        const commentId = v.comment_id || v.id;
        const text = (v.message ?? v.text ?? "").trim();
        const fromId = v.from?.id ?? null;
        if (!commentId || !text) continue;
        // Loop guard: never reply to the page's OWN comments (our public reply
        // is itself a comment → Meta re-fires the webhook for it).
        if (fromId && fromId === pageId) continue;
        await runCommentReply({
          supabase,
          settings,
          rules: ruleList,
          channel,
          pageId,
          commentId,
          commenterId: fromId,
          text,
        });
      }
    }
  }
}

// ── Auto-reply to a single comment: public ack + private AI DM (lead) ──
type InboxSettings = {
  company_id: string;
  meta_page_token: string | null;
  ai_business_context: string | null;
  ai_system_prompt: string | null;
  auto_push_to_crm: boolean | null;
  comment_public_reply: boolean | null;
  comment_private_reply: boolean | null;
  comment_public_text: string | null;
};

// ── Keyword auto-reply rules (ManyChat-style, deterministic) ──
type AutoReplyRule = {
  keywords: string[] | null;
  response: string;
  match_type: string;
  apply_dm: boolean | null;
  apply_comment: boolean | null;
};

// First matching rule wins. Case is normalized (Arabic unaffected). `scope`
// gates DM-only vs comment-only rules.
function findRuleResponse(
  rules: AutoReplyRule[],
  text: string,
  scope: "dm" | "comment",
): string | null {
  const t = (text || "").trim().toLowerCase();
  if (!t) return null;
  for (const r of rules) {
    if (scope === "dm" && r.apply_dm === false) continue;
    if (scope === "comment" && r.apply_comment === false) continue;
    for (const kwRaw of r.keywords || []) {
      const kw = (kwRaw || "").trim().toLowerCase();
      if (!kw) continue;
      const hit = r.match_type === "exact" ? t === kw : t.includes(kw);
      if (hit) return r.response;
    }
  }
  return null;
}

// ── Button-menu Flows (ManyChat-style) ──
type FlowRow = { id: string; trigger_keywords: string[] | null };
type FlowButton = { label?: string; next_node_id?: string | null };
type FlowNode = {
  id: string;
  flow_id: string;
  message: string;
  buttons: FlowButton[] | null;
};

function findFlowByKeyword(flows: FlowRow[], text: string): string | null {
  const t = (text || "").trim().toLowerCase();
  if (!t) return null;
  for (const f of flows) {
    for (const kwRaw of f.trigger_keywords || []) {
      const kw = (kwRaw || "").trim().toLowerCase();
      if (kw && t.includes(kw)) return f.id;
    }
  }
  return null;
}

// Send a flow node's message + its buttons (as tappable quick replies), and
// log the outbound message on the conversation.
async function sendFlowNode(args: {
  supabase: ReturnType<typeof createServiceClient>;
  node: FlowNode;
  flowId: string;
  channel: "messenger" | "instagram";
  pageToken: string;
  recipientId: string;
  conversationId: string;
}): Promise<void> {
  const buttons = (args.node.buttons || []).filter(
    (b): b is { label: string; next_node_id: string } =>
      !!b && !!b.label && !!b.next_node_id,
  );
  const quickReplies = buttons.map((b) => ({
    title: b.label,
    payload: `FLOW:${args.flowId}:${b.next_node_id}`,
  }));
  const send = await sendMetaMessage({
    channel: args.channel,
    pageToken: args.pageToken,
    recipientId: args.recipientId,
    text: args.node.message,
    quickReplies: quickReplies.length ? quickReplies : undefined,
  });
  await args.supabase.from("marketing_inbox_messages").insert({
    conversation_id: args.conversationId,
    direction: "outbound",
    sender: "ai",
    body: `[فلو] ${args.node.message}`,
    meta_message_id: send.ok ? send.messageId : null,
    sent_at: send.ok ? new Date().toISOString() : null,
    delivery_error: send.ok ? null : send.error,
  });
  await args.supabase
    .from("marketing_inbox_conversations")
    .update({ ai_intent: "flow", ai_last_run_at: new Date().toISOString() })
    .eq("id", args.conversationId);
}

async function runFlowStart(args: {
  supabase: ReturnType<typeof createServiceClient>;
  flowId: string;
  channel: "messenger" | "instagram";
  pageToken: string;
  recipientId: string;
  conversationId: string;
}): Promise<void> {
  const { data: nodes } = await args.supabase
    .from("marketing_flow_nodes")
    .select("id, flow_id, message, buttons")
    .eq("flow_id", args.flowId)
    .order("is_start", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(1)
    .returns<FlowNode[]>();
  const node = nodes?.[0];
  if (!node) return;
  await sendFlowNode({
    supabase: args.supabase,
    node,
    flowId: args.flowId,
    channel: args.channel,
    pageToken: args.pageToken,
    recipientId: args.recipientId,
    conversationId: args.conversationId,
  });
}

async function runFlowNavigate(args: {
  supabase: ReturnType<typeof createServiceClient>;
  payload: string;
  companyId: string;
  channel: "messenger" | "instagram";
  pageToken: string;
  recipientId: string;
  conversationId: string;
}): Promise<void> {
  const parts = args.payload.split(":");
  const flowId = parts[1];
  const nodeId = parts[2];
  if (!flowId || !nodeId) return;
  // Verify the flow belongs to this tenant (service client bypasses RLS).
  const { data: flow } = await args.supabase
    .from("marketing_flows")
    .select("id")
    .eq("id", flowId)
    .eq("company_id", args.companyId)
    .maybeSingle();
  if (!flow) return;
  const { data: node } = await args.supabase
    .from("marketing_flow_nodes")
    .select("id, flow_id, message, buttons")
    .eq("id", nodeId)
    .eq("flow_id", flowId)
    .maybeSingle<FlowNode>();
  if (!node) return;
  await sendFlowNode({
    supabase: args.supabase,
    node,
    flowId,
    channel: args.channel,
    pageToken: args.pageToken,
    recipientId: args.recipientId,
    conversationId: args.conversationId,
  });
}

async function runCommentReply(args: {
  supabase: ReturnType<typeof createServiceClient>;
  settings: InboxSettings;
  rules: AutoReplyRule[];
  channel: "messenger" | "instagram";
  pageId: string;
  commentId: string;
  commenterId: string | null;
  text: string;
}): Promise<void> {
  const { supabase, settings, commentId } = args;
  const pageToken = settings.meta_page_token;
  if (!pageToken) return;

  // Dedup: insert the comment_id (unique). On conflict we've already handled
  // it → bail so a resent webhook never double-replies.
  const { error: dupErr } = await supabase
    .from("marketing_processed_comments")
    .insert({ company_id: settings.company_id, comment_id: commentId });
  if (dupErr) return;

  // 1) Public acknowledgement (fixed, safe text — we don't let the AI speak
  //    publicly; it answers in the private DM instead).
  if (settings.comment_public_reply) {
    const publicText =
      settings.comment_public_text?.trim() ||
      "شكراً لاهتمامك! 🌟 بعتنالك رسالة خاصة فيها كل التفاصيل 📩";
    await replyToComment({ pageToken, commentId, message: publicText });
  }

  // 2) Private DM with the real (AI) answer → tracked as a lead in the inbox.
  if (settings.comment_private_reply) {
    let reply =
      "أهلاً 👋 شكراً لتعليقك! ابعتلنا استفسارك وهنفيدك حالاً. للتفاصيل: https://www.nidhamhr.com";
    let leadQuality: "hot" | "warm" | "cold" | "spam" = "warm";
    let intent = "comment";
    // A keyword rule (if it matches the comment text) wins over the AI.
    const ruleHit = findRuleResponse(args.rules, args.text, "comment");
    if (ruleHit) {
      reply = ruleHit;
      intent = "keyword_rule";
    } else {
      try {
        const ai = await generateMarketingReply({
          userMessage: args.text,
          businessContext: settings.ai_business_context || undefined,
          systemPromptOverride: settings.ai_system_prompt || undefined,
        });
        reply = ai.reply;
        leadQuality = ai.leadQuality;
        intent = ai.intent;
      } catch (err) {
        console.error(
          "[meta-webhook] comment AI failed:",
          err instanceof Error ? err.message : err,
        );
      }
    }

    const send = await sendPrivateReply({ pageToken, commentId, message: reply });
    if (!send.ok) {
      console.error(
        "[meta-webhook] comment PRIVATE reply failed:",
        send.error,
      );
    }

    // Track the commenter as a lead in the inbox (best-effort).
    if (args.commenterId) {
      const conversationId = await upsertConversation({
        supabase,
        companyId: settings.company_id,
        channel: args.channel,
        externalUserId: args.commenterId,
        pageToken,
      });
      if (conversationId) {
        await supabase.from("marketing_inbox_messages").insert({
          conversation_id: conversationId,
          direction: "outbound",
          sender: "ai",
          body: `[رد تلقائي على كومنت] ${reply}`,
          sent_at: send.ok ? new Date().toISOString() : null,
          delivery_error: send.ok ? null : send.error,
        });
        await supabase
          .from("marketing_inbox_conversations")
          .update({
            ai_intent: `comment:${intent}`,
            ai_lead_quality: leadQuality,
            ai_last_run_at: new Date().toISOString(),
          })
          .eq("id", conversationId);
        if (
          settings.auto_push_to_crm &&
          (leadQuality === "hot" || leadQuality === "warm")
        ) {
          await pushToCRM({
            supabase,
            conversationId,
            companyId: settings.company_id,
            channel: args.channel,
            externalUserId: args.commenterId,
            intent: `comment:${intent}`,
            leadQuality,
          });
        }
      }
    }
  }
}

// ── Upsert conversation + fetch user profile on first sight ──
async function upsertConversation(args: {
  supabase: ReturnType<typeof createServiceClient>;
  companyId: string;
  channel: "messenger" | "instagram";
  externalUserId: string;
  pageToken: string | null;
}): Promise<string | null> {
  const { data: existing } = await args.supabase
    .from("marketing_inbox_conversations")
    .select("id")
    .eq("company_id", args.companyId)
    .eq("channel", args.channel)
    .eq("external_user_id", args.externalUserId)
    .maybeSingle();

  if (existing) return existing.id;

  let profile: { name?: string; picture?: string } | null = null;
  if (args.pageToken) {
    profile = await fetchUserProfile({
      channel: args.channel,
      pageToken: args.pageToken,
      externalUserId: args.externalUserId,
    });
  }

  const { data: created, error } = await args.supabase
    .from("marketing_inbox_conversations")
    .insert({
      company_id: args.companyId,
      channel: args.channel,
      external_user_id: args.externalUserId,
      external_user_name: profile?.name || null,
      external_user_picture: profile?.picture || null,
      status: "open",
    })
    .select("id")
    .single();

  if (error || !created) {
    console.error("[meta-webhook] upsert conv failed:", error);
    return null;
  }
  return created.id;
}

// ── Generate AI reply + send via Meta + store outbound message ──
async function runAiReply(args: {
  supabase: ReturnType<typeof createServiceClient>;
  conversationId: string;
  companyId: string;
  channel: "messenger" | "instagram";
  recipientId: string;
  pageToken: string;
  userMessage: string;
  businessContext: string | null;
  systemPromptOverride: string | null;
  handoffKeywords: string[];
  autoPushToCrm: boolean;
}): Promise<void> {
  const lowered = args.userMessage.toLowerCase();
  const handoffHit = args.handoffKeywords.some((kw) =>
    lowered.includes(kw.toLowerCase()),
  );
  if (handoffHit) {
    await args.supabase
      .from("marketing_inbox_conversations")
      .update({ status: "open", ai_intent: "handoff_keyword" })
      .eq("id", args.conversationId);
    return;
  }

  const { data: historyRows } = await args.supabase
    .from("marketing_inbox_messages")
    .select("direction, body, sender")
    .eq("conversation_id", args.conversationId)
    .order("created_at", { ascending: true })
    .limit(10);

  const history: ConversationTurn[] = (historyRows || []).map((row) => ({
    role: row.direction === "inbound" ? ("user" as const) : ("assistant" as const),
    body: row.body,
  }));
  if (history.length && history[history.length - 1].role === "user") {
    history.pop();
  }

  let ai;
  try {
    ai = await generateMarketingReply({
      userMessage: args.userMessage,
      history,
      businessContext: args.businessContext || undefined,
      systemPromptOverride: args.systemPromptOverride || undefined,
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("[meta-webhook] AI generation failed:", errMsg);
    await args.supabase
      .from("marketing_inbox_conversations")
      .update({
        ai_intent: `ai_error: ${errMsg.slice(0, 200)}`,
        ai_last_run_at: new Date().toISOString(),
      })
      .eq("id", args.conversationId);
    return;
  }

  await args.supabase
    .from("marketing_inbox_conversations")
    .update({
      status: ai.shouldHandoff ? "open" : "ai_replied",
      ai_intent: ai.intent,
      ai_lead_quality: ai.leadQuality,
      ai_last_run_at: new Date().toISOString(),
    })
    .eq("id", args.conversationId);

  if (
    args.autoPushToCrm &&
    (ai.leadQuality === "hot" || ai.leadQuality === "warm")
  ) {
    await pushToCRM({
      supabase: args.supabase,
      conversationId: args.conversationId,
      companyId: args.companyId,
      channel: args.channel,
      externalUserId: args.recipientId,
      intent: ai.intent,
      leadQuality: ai.leadQuality,
      handoffReason: ai.handoffReason,
    });
  }

  if (ai.shouldHandoff) {
    await args.supabase.from("marketing_inbox_messages").insert({
      conversation_id: args.conversationId,
      direction: "outbound",
      sender: "ai",
      body: `[تنبيه داخلي] العميل ده محتاج تدخّل بشري. السبب: ${ai.handoffReason || "محادثة معقدة"}.`,
      delivery_error: "handoff_requested",
    });
    return;
  }

  const send = await sendMetaMessage({
    channel: args.channel,
    pageToken: args.pageToken,
    recipientId: args.recipientId,
    text: ai.reply,
  });

  await args.supabase.from("marketing_inbox_messages").insert({
    conversation_id: args.conversationId,
    direction: "outbound",
    sender: "ai",
    body: ai.reply,
    meta_message_id: send.ok ? send.messageId : null,
    sent_at: send.ok ? new Date().toISOString() : null,
    delivery_error: send.ok ? null : send.error,
  });

  // If the send FAILED (most commonly the 24h window), don't leave the
  // conversation looking "ai_replied" — the customer never got the message.
  // Flip it back to "open" so a human notices, and record why.
  if (!send.ok) {
    await args.supabase
      .from("marketing_inbox_conversations")
      .update({
        status: "open",
        ai_intent: send.outsideWindow
          ? "send_failed_24h_window"
          : "send_failed",
      })
      .eq("id", args.conversationId);
  }
}

// ── Push qualifying leads into the existing CRM (customers table) ──
async function pushToCRM(args: {
  supabase: ReturnType<typeof createServiceClient>;
  conversationId: string;
  companyId: string;
  channel: "messenger" | "instagram";
  externalUserId: string;
  intent: string;
  leadQuality: "hot" | "warm" | "cold" | "spam";
  handoffReason?: string;
}): Promise<void> {
  const { data: conv } = await args.supabase
    .from("marketing_inbox_conversations")
    .select("customer_id, external_user_name")
    .eq("id", args.conversationId)
    .single();

  if (conv?.customer_id) return;

  const customerName =
    conv?.external_user_name ||
    `${args.channel === "instagram" ? "IG" : "FB"} Lead`;

  const notes = [
    `🟢 Auto-imported from ${args.channel === "instagram" ? "Instagram" : "Messenger"} (${args.leadQuality.toUpperCase()})`,
    `Intent: ${args.intent}`,
    args.handoffReason ? `Note: ${args.handoffReason}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const { data: customer, error } = await args.supabase
    .from("customers")
    .insert({
      // The column is `full_name` (NOT NULL) — inserting `name` silently
      // failed every CRM push (DMs + comments). This is the fix.
      company_id: args.companyId,
      full_name: customerName,
      status: "lead",
      source: args.channel === "instagram" ? "instagram_dm" : "messenger_dm",
      notes,
    })
    .select("id")
    .single();

  if (error || !customer) {
    console.error("[meta-webhook] push to CRM failed:", error);
    return;
  }

  await args.supabase
    .from("marketing_inbox_conversations")
    .update({ customer_id: customer.id })
    .eq("id", args.conversationId);
}
