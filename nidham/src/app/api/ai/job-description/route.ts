// ============================================================================
// /api/ai/job-description — generate a real, company-tailored job description
// (توصيف وظيفي) for a given role, to print + hand to the employee.
// ============================================================================

import { generateObject } from "ai";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { callWithFallback } from "@/lib/ai-models";
import { jobDescriptionSchema, buildJobDescriptionPrompt } from "@/lib/recruitment";

export const maxDuration = 60;

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, company_id")
    .eq("id", user.id)
    .single<{ role: string; company_id: string }>();
  if (!profile || (profile.role !== "admin" && profile.role !== "manager")) {
    return Response.json(
      { error: "مولّد التوصيف الوظيفي مخصص لـ HR فقط" },
      { status: 403 },
    );
  }

  const rl = checkRateLimit(`jd:${user.id}`, 30, 10 * 60_000);
  if (!rl.ok) {
    return Response.json(
      { error: `كتر شوية — جرّب بعد ${Math.ceil(rl.retryAfterSeconds / 60)} دقيقة` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } },
    );
  }

  let title = "";
  let department: string | null = null;
  try {
    const body = await req.json();
    title = String(body?.title ?? "").trim();
    const dep = String(body?.department ?? "").trim();
    department = dep || null;
  } catch {
    return Response.json({ error: "طلب غير صالح" }, { status: 400 });
  }
  if (title.length < 2) {
    return Response.json({ error: "اكتب المسمى الوظيفي" }, { status: 400 });
  }

  const { data: company } = await supabase
    .from("companies")
    .select("name, industry")
    .eq("id", profile.company_id)
    .maybeSingle<{ name: string | null; industry: string | null }>();

  const prompt = buildJobDescriptionPrompt(
    { name: company?.name ?? null, industry: company?.industry ?? null },
    title,
    department,
  );

  try {
    const jd = await callWithFallback((picked) =>
      generateObject({
        model: picked.model,
        schema: jobDescriptionSchema,
        prompt,
        temperature: 0.4,
        maxRetries: 0,
      }).then((r) => r.object),
    );
    return Response.json({ ok: true, jd });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ error: msg.slice(0, 200) }, { status: 502 });
  }
}
