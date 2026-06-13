// /api/cv-maker/save — PUBLIC: save a built CV + capture the email as a lead,
// return the interactive page URL. The email gate is what makes this tool a
// lead magnet. No auth; IP rate-limited.

import { randomUUID } from "crypto";
import { createPublicClient } from "@/lib/supabase/public";
import { checkRateLimit } from "@/lib/rate-limit";
import type { CvData } from "@/lib/cv-builder";

export const maxDuration = 30;

function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  return (xff?.split(",")[0] || req.headers.get("x-real-ip") || "anon").trim();
}

export async function POST(req: Request) {
  const rl = checkRateLimit(`cv-save:${clientIp(req)}`, 15, 10 * 60_000);
  if (!rl.ok) {
    return Response.json({ error: "كتر شوية — جرّب بعد شوية" }, { status: 429 });
  }

  let body: { cv?: CvData; email?: string };
  try {
    body = (await req.json()) as { cv?: CvData; email?: string };
  } catch {
    return Response.json({ error: "طلب غير صالح" }, { status: 400 });
  }
  const email = (body.email ?? "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "اكتب إيميل صحيح" }, { status: 400 });
  }
  if (!body.cv?.full_name) {
    return Response.json({ error: "السيرة ناقصة — اكتب الاسم على الأقل" }, { status: 400 });
  }

  const slugBase = (body.cv.full_name || "cv")
    .toLowerCase()
    .replace(/[؀-ۿ\s]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 36);
  const slug = `${slugBase || "cv"}-${randomUUID().slice(0, 6)}`;

  const supabase = createPublicClient();
  const { error } = await supabase.rpc("save_public_cv", {
    p_slug: slug,
    p_email: email,
    p_data: body.cv,
  });
  if (error) {
    return Response.json(
      {
        error: /function .* does not exist|PGRST|schema cache/i.test(error.message)
          ? "طبّق migration 112 في Supabase الأول"
          : "حصل خطأ بسيط — جرّب تاني",
      },
      { status: 500 },
    );
  }

  const site = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.nidhamhr.com").replace(/\/$/, "");
  return Response.json({ ok: true, slug, url: `${site}/cv/m/${slug}` });
}
