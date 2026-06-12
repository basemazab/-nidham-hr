// ============================================================================
// LinkedIn scheduler — publish due posts from linkedin_scheduled_posts
// ============================================================================
// Runs inside the daily cron (piggybacked on /api/cron/run-sequences so we
// don't burn another Vercel cron slot) and from /api/cron/linkedin-posts for
// manual/external triggering. Service-role client: cross-tenant by design,
// each post row carries its company_id and we look up that tenant's token.

/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  publishLinkedInPost,
  publishLinkedInImagePost,
} from "@/lib/linkedin";

const SITE = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.nidhamhr.com"
).replace(/\/$/, "");

type ScheduledPost = {
  id: string;
  company_id: string;
  post_text: string;
  link_url: string | null;
  image_title: string | null;
  image_sub: string | null;
  image_badge: string | null;
};

export async function runScheduledLinkedInPosts(
  svc: any,
): Promise<{ due: number; posted: number; failed: number }> {
  const nowIso = new Date().toISOString();

  const { data: dueRows } = await svc
    .from("linkedin_scheduled_posts")
    .select("id, company_id, post_text, link_url, image_title, image_sub, image_badge")
    .eq("status", "pending")
    .lte("scheduled_at", nowIso)
    .order("scheduled_at", { ascending: true })
    .limit(5);

  const due: ScheduledPost[] = dueRows ?? [];
  let posted = 0;
  let failed = 0;

  for (const p of due) {
    const { data: conn } = await svc
      .from("linkedin_connections")
      .select("access_token, token_expires_at, member_urn")
      .eq("company_id", p.company_id)
      .maybeSingle();

    const tokenDead =
      !conn?.access_token ||
      !conn?.member_urn ||
      (conn.token_expires_at && new Date(conn.token_expires_at) <= new Date());

    if (tokenDead) {
      await svc
        .from("linkedin_scheduled_posts")
        .update({
          status: "failed",
          error: "لينكد إن مش مربوط أو التوكن منتهي — جدّد الربط من الإعدادات",
        })
        .eq("id", p.id);
      failed++;
      continue;
    }

    // Branded image built at publish time (params stored, URL encoded here).
    let res;
    if (p.image_title) {
      const params = new URLSearchParams({ title: p.image_title });
      if (p.image_sub) params.set("sub", p.image_sub);
      if (p.image_badge) params.set("badge", p.image_badge);
      res = await publishLinkedInImagePost({
        accessToken: conn.access_token,
        memberUrn: conn.member_urn,
        text: p.post_text,
        imageUrl: `${SITE}/api/og/linkedin-post?${params.toString()}`,
      });
    } else {
      res = await publishLinkedInPost({
        accessToken: conn.access_token,
        memberUrn: conn.member_urn,
        text: p.post_text,
        link: p.link_url ?? undefined,
      });
    }

    if (res.ok) {
      await svc
        .from("linkedin_scheduled_posts")
        .update({
          status: "posted",
          posted_at: new Date().toISOString(),
          post_url: res.postUrl,
          error: null,
        })
        .eq("id", p.id);
      posted++;
    } else {
      await svc
        .from("linkedin_scheduled_posts")
        .update({ status: "failed", error: res.error.slice(0, 300) })
        .eq("id", p.id);
      failed++;
    }
  }

  return { due: due.length, posted, failed };
}
