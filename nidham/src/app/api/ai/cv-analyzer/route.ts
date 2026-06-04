// ============================================================================
// /api/ai/cv-analyzer — Upload a CV → AI recommends the best-fit job, builds a
// candidate test, and HR interview questions, all tailored to the COMPANY's
// industry/activity.
// ============================================================================
//
// Flow:
//   1) Auth (HR only) + rate limit.
//   2) Get the CV text — either pasted, or extracted from an uploaded
//      PDF/image via Gemini multimodal (Groq can't read files, so this step
//      is Gemini-direct), or read from a .txt.
//   3) Fetch the caller's company (name + industry) and its open jobs —
//      tenant-scoped.
//   4) Analyze via callWithFallback (resilient model chain) with the
//      cvAnalysisSchema contract.

import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject, generateText } from "ai";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { callWithFallback, pickAgentModelLargeContext } from "@/lib/ai-models";
import {
  cvAnalysisSchema,
  buildCvAnalysisPrompt,
  type JobForCv,
} from "@/lib/recruitment";

export const maxDuration = 60;
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

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
      { error: "محلّل السيرة الذاتية مخصص لـ HR فقط" },
      { status: 403 },
    );
  }

  const rl = checkRateLimit(`cv-analyzer:${user.id}`, 20, 10 * 60_000);
  if (!rl.ok) {
    return Response.json(
      { error: `كتر شوية على التحليل — جرّب بعد ${Math.ceil(rl.retryAfterSeconds / 60)} دقيقة` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } },
    );
  }

  // ── Input ────────────────────────────────────────────────────────────────
  let cvText = "";
  let file: File | null = null;
  try {
    const form = await req.formData();
    const t = form.get("text");
    if (typeof t === "string" && t.trim().length > 30) cvText = t.trim();
    const f = form.get("file");
    if (f instanceof File && f.size > 0) {
      if (f.size > MAX_BYTES) {
        return Response.json({ error: "الملف كبير جدًا (الحد الأقصى 5 MB)" }, { status: 400 });
      }
      file = f;
    }
  } catch {
    return Response.json({ error: "فشل قراءة الطلب" }, { status: 400 });
  }
  if (!cvText && !file) {
    return Response.json({ error: "ارفع ملف السيرة الذاتية أو الصق نصها" }, { status: 400 });
  }

  // ── 1) Extract CV text from the file (Gemini multimodal) ──────────────────
  if (!cvText && file) {
    const lower = file.name.toLowerCase();
    const isPdf = lower.endsWith(".pdf") || file.type === "application/pdf";
    const isImage =
      file.type.startsWith("image/") || /\.(png|jpe?g|webp|gif)$/.test(lower);
    const isText = lower.endsWith(".txt") || file.type.startsWith("text/");

    if (isText) {
      cvText = (await file.text()).trim();
    } else if (isPdf || isImage) {
      if (!process.env.GEMINI_API_KEY) {
        return Response.json({ error: "AI configuration missing — GEMINI_API_KEY" }, { status: 500 });
      }
      try {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });
        const { text } = await generateText({
          model: google("gemini-2.5-flash"),
          temperature: 0,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "استخرج كل النص المكتوب في السيرة الذاتية المرفقة كما هو حرفيًا، بدون تلخيص أو تعليق.",
                },
                {
                  type: "file",
                  data: bytes,
                  mediaType: isPdf ? "application/pdf" : file.type || "image/jpeg",
                },
              ],
            },
          ],
        });
        cvText = (text ?? "").trim();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return Response.json(
          { error: `ما قدرناش نقرا الملف — جرّب PDF/صورة أوضح أو الصق النص. (${msg.slice(0, 140)})` },
          { status: 502 },
        );
      }
    } else {
      return Response.json(
        { error: "النوع ده مش مدعوم. ارفع PDF أو صورة أو ملف نصي، أو الصق نص الـCV." },
        { status: 400 },
      );
    }
  }

  if (cvText.length < 30) {
    return Response.json({ error: "نص السيرة الذاتية قصير أو فاضي — تأكد من الملف." }, { status: 400 });
  }
  if (cvText.length > 20000) cvText = cvText.slice(0, 20000);

  // ── 2) Company + open jobs (tenant-scoped) ────────────────────────────────
  const [companyRes, jobsRes] = await Promise.all([
    supabase
      .from("companies")
      .select("name, industry")
      .eq("id", profile.company_id)
      .maybeSingle<{ name: string | null; industry: string | null }>(),
    supabase
      .from("jobs")
      .select("title, department, requirements, experience_years_min, job_type")
      .eq("company_id", profile.company_id)
      .in("status", ["open", "draft"])
      .limit(25)
      .returns<JobForCv[]>(),
  ]);

  const prompt = buildCvAnalysisPrompt(
    { name: companyRes.data?.name ?? null, industry: companyRes.data?.industry ?? null },
    jobsRes.data ?? [],
    cvText,
  );

  // ── 3) Analyze (resilient chain; Gemini-first for the long CV context) ────
  try {
    const analysis = await callWithFallback(
      (picked) =>
        generateObject({
          model: picked.model,
          schema: cvAnalysisSchema,
          prompt,
          temperature: 0.3,
          maxRetries: 0,
        }).then((r) => r.object),
      pickAgentModelLargeContext,
    );
    return Response.json({ ok: true, analysis });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ error: msg.slice(0, 200) }, { status: 502 });
  }
}
