// ============================================================================
// LinkedIn client — official "Share on LinkedIn" (w_member_social)
// ============================================================================
//
// The tenant brings their own LinkedIn App (Client ID + Secret, saved in
// linkedin_connections). Flow:
//   /api/linkedin/authorize  → LinkedIn consent (openid profile w_member_social)
//   /api/linkedin/callback   → exchangeCode() + fetchUserInfo() → store token
//   publishLinkedInPost()    → POST /v2/ugcPosts on the member's profile
//
// Member access tokens live ~60 days (refresh tokens are partner-only), so
// the settings page shows the expiry and a one-click reconnect.

const OAUTH_BASE = "https://www.linkedin.com/oauth/v2";
const API_BASE = "https://api.linkedin.com/v2";

export const LINKEDIN_SCOPES = "openid profile w_member_social";

export function buildAuthorizeUrl(input: {
  clientId: string;
  redirectUri: string;
  state: string;
}): string {
  const p = new URLSearchParams({
    response_type: "code",
    client_id: input.clientId,
    redirect_uri: input.redirectUri,
    state: input.state,
    scope: LINKEDIN_SCOPES,
  });
  return `${OAUTH_BASE}/authorization?${p.toString()}`;
}

export async function exchangeCode(input: {
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}): Promise<
  | { ok: true; accessToken: string; expiresAt: string }
  | { ok: false; error: string }
> {
  try {
    const res = await fetch(`${OAUTH_BASE}/accessToken`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: input.code,
        client_id: input.clientId,
        client_secret: input.clientSecret,
        redirect_uri: input.redirectUri,
      }),
    });
    const data = (await res.json()) as {
      access_token?: string;
      expires_in?: number;
      error_description?: string;
      error?: string;
    };
    if (!res.ok || !data.access_token) {
      return {
        ok: false,
        error: data.error_description || data.error || `HTTP ${res.status}`,
      };
    }
    const expiresAt = new Date(
      Date.now() + (data.expires_in ?? 60 * 24 * 3600) * 1000,
    ).toISOString();
    return { ok: true, accessToken: data.access_token, expiresAt };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function fetchUserInfo(accessToken: string): Promise<
  | { ok: true; sub: string; name: string }
  | { ok: false; error: string }
> {
  try {
    const res = await fetch(`${API_BASE}/userinfo`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = (await res.json()) as {
      sub?: string;
      name?: string;
      error?: { message?: string };
    };
    if (!res.ok || !data.sub) {
      return { ok: false, error: data.error?.message || `HTTP ${res.status}` };
    }
    return { ok: true, sub: data.sub, name: data.name || "" };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// Publish a post WITH an image on the member's profile. Three-step official
// flow: registerUpload (assets API) → PUT the binary → ugcPosts with the asset.
export async function publishLinkedInImagePost(input: {
  accessToken: string;
  memberUrn: string;
  text: string;
  imageUrl: string; // publicly fetchable PNG/JPG (e.g. our /api/og/linkedin-post)
}): Promise<
  | { ok: true; postUrn: string; postUrl: string }
  | { ok: false; error: string }
> {
  try {
    // 1) Fetch the image bytes server-side
    const imgRes = await fetch(input.imageUrl);
    if (!imgRes.ok) {
      return { ok: false, error: `image fetch failed (${imgRes.status})` };
    }
    const bytes = await imgRes.arrayBuffer();

    // 2) Register the upload
    const reg = await fetch(`${API_BASE}/assets?action=registerUpload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify({
        registerUploadRequest: {
          recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
          owner: input.memberUrn,
          serviceRelationships: [
            { relationshipType: "OWNER", identifier: "urn:li:userGeneratedContent" },
          ],
        },
      }),
    });
    const regData = (await reg.json()) as {
      value?: {
        asset?: string;
        uploadMechanism?: Record<string, { uploadUrl?: string }>;
      };
      message?: string;
    };
    const uploadUrl =
      regData.value?.uploadMechanism?.[
        "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"
      ]?.uploadUrl;
    const asset = regData.value?.asset;
    if (!reg.ok || !uploadUrl || !asset) {
      return { ok: false, error: regData.message || "registerUpload failed" };
    }

    // 3) Upload the binary
    const up = await fetch(uploadUrl, {
      method: "PUT",
      headers: { Authorization: `Bearer ${input.accessToken}` },
      body: bytes,
    });
    if (!up.ok && up.status !== 201) {
      return { ok: false, error: `image upload failed (${up.status})` };
    }

    // 4) Create the post with the uploaded asset
    const res = await fetch(`${API_BASE}/ugcPosts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify({
        author: input.memberUrn,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: { text: input.text.slice(0, 2900) },
            shareMediaCategory: "IMAGE",
            media: [{ status: "READY", media: asset }],
          },
        },
        visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
      }),
    });
    const restliId = res.headers.get("x-restli-id");
    let bodyId: string | undefined;
    try {
      const data = (await res.json()) as { id?: string; message?: string };
      bodyId = data.id;
      if (!res.ok) return { ok: false, error: data.message || `HTTP ${res.status}` };
    } catch {
      if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    }
    const urn = restliId || bodyId || "";
    return {
      ok: true,
      postUrn: urn,
      postUrl: urn
        ? `https://www.linkedin.com/feed/update/${encodeURIComponent(urn)}/`
        : "https://www.linkedin.com/feed/",
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// Publish a text post (optionally with a link card) on the member's profile.
export async function publishLinkedInPost(input: {
  accessToken: string;
  memberUrn: string; // "urn:li:person:xxxx"
  text: string;
  link?: string;
}): Promise<
  | { ok: true; postUrn: string; postUrl: string }
  | { ok: false; error: string }
> {
  const share: Record<string, unknown> = {
    shareCommentary: { text: input.text.slice(0, 2900) },
    shareMediaCategory: input.link ? "ARTICLE" : "NONE",
  };
  if (input.link) {
    share.media = [{ status: "READY", originalUrl: input.link }];
  }

  try {
    const res = await fetch(`${API_BASE}/ugcPosts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify({
        author: input.memberUrn,
        lifecycleState: "PUBLISHED",
        specificContent: { "com.linkedin.ugc.ShareContent": share },
        visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
      }),
    });

    const restliId = res.headers.get("x-restli-id");
    let bodyId: string | undefined;
    try {
      const data = (await res.json()) as { id?: string; message?: string };
      bodyId = data.id;
      if (!res.ok) {
        return { ok: false, error: data.message || `HTTP ${res.status}` };
      }
    } catch {
      if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    }

    const urn = restliId || bodyId || "";
    return {
      ok: true,
      postUrn: urn,
      postUrl: urn
        ? `https://www.linkedin.com/feed/update/${encodeURIComponent(urn)}/`
        : "https://www.linkedin.com/feed/",
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
