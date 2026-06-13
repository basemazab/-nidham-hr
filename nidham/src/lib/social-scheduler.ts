// ============================================================================
// Social scheduler — auto-publish DUE scheduled posts (hands-free)
// ============================================================================
// The Social Suite could SCHEDULE posts but nothing published them — the cron
// was never built. This runs from the daily cron with the SERVICE ROLE:
// finds social_posts whose scheduled_for is due, decrypts each target
// account's token, publishes via the same publishToSocialPlatform path the
// manual composer uses, and records per-target results (the RPC rolls the
// parent post status up to published / partially_failed / failed).

/* eslint-disable @typescript-eslint/no-explicit-any */

import { publishToSocialPlatform } from "@/lib/social-publishers";

function encryptionKey(): string {
  const k = process.env.META_ENCRYPTION_KEY;
  if (!k) throw new Error("META_ENCRYPTION_KEY not set");
  return k;
}

type DuePost = {
  id: string;
  body: string;
  media_urls: string[] | null;
};

export async function publishDueSocialPosts(
  svc: any,
): Promise<{ due: number; published: number; failed: number }> {
  const nowIso = new Date().toISOString();

  const { data: due } = await svc
    .from("social_posts")
    .select("id, body, media_urls")
    .eq("status", "scheduled")
    .lte("scheduled_for", nowIso)
    .order("scheduled_for", { ascending: true })
    .limit(5);

  const posts: DuePost[] = (due ?? []) as DuePost[];
  let published = 0;
  let failed = 0;
  const key = encryptionKey();

  for (const post of posts) {
    // Claim the post so a concurrent run can't double-publish it.
    await svc
      .from("social_posts")
      .update({ status: "publishing", updated_at: nowIso })
      .eq("id", post.id);

    const { data: targets } = await svc
      .from("social_post_targets")
      .select("id, account_id")
      .eq("post_id", post.id)
      .in("status", ["queued", "failed"]);

    if (!targets || targets.length === 0) {
      // No targets wired — nothing to publish; flag it so it doesn't loop.
      await svc
        .from("social_posts")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("id", post.id);
      failed++;
      continue;
    }

    for (const t of targets as { id: string; account_id: string }[]) {
      const { data: tokenRows } = await svc.rpc("decrypt_social_token", {
        p_account_id: t.account_id,
        p_encryption_key: key,
      });
      const token = (Array.isArray(tokenRows) ? tokenRows[0] : tokenRows) as
        | {
            access_token: string;
            platform_metadata: Record<string, unknown>;
            platform: any;
            external_id: string;
          }
        | null
        | undefined;

      if (!token?.access_token) {
        await svc.rpc("record_target_publish_result", {
          p_target_id: t.id,
          p_status: "failed",
          p_external_post_id: null,
          p_external_url: null,
          p_error: "تعذّر فك تشفير التوكن — أعد ربط الحساب",
        });
        failed++;
        continue;
      }

      const res = await publishToSocialPlatform({
        platform: token.platform,
        accessToken: token.access_token,
        externalId: token.external_id,
        platformMetadata: token.platform_metadata,
        body: post.body,
        mediaUrls: post.media_urls ?? [],
      });

      await svc.rpc("record_target_publish_result", {
        p_target_id: t.id,
        p_status: res.ok ? "published" : "failed",
        p_external_post_id: res.ok ? res.external_id : null,
        p_external_url: res.ok ? res.external_url : null,
        p_error: res.ok ? null : res.error,
      });

      if (res.ok) published++;
      else failed++;
    }
  }

  return { due: posts.length, published, failed };
}
