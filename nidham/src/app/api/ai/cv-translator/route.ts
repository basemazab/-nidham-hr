// ============================================================================
// /api/ai/cv-translator — Upload a CV → full translation (AR ⇄ EN) + complete
// HR analysis, ready to print.
// ============================================================================
//
// Flow (mirrors /api/ai/cv-analyzer):
//   1) Auth (HR only) + rate limit.
//   2) Get the CV text — pasted, extracted from PDF/image via Gemini
//      multimodal (Groq can't read files), or read from a .txt.
//   3) Translate + analyze in ONE generateObject call via callWithFallback
//      (Gemini-first for the long CV context).

import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject, generateText } from "ai";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { callWithFallback, pickAgentModelLargeContext } from "@/lib/ai-models";
import {
  cvTranslationSchema,
  buildCvTranslationPrompt,
} from "@/lib/cv-translator";

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
      { error: "مترجم السيرة الذاتية مخصص لـ HR فقط" },
      { status: 403 },
    );
  }

  const rl = checkRateLimit(`cv-translator:${user.id}`, 20, 10 * 60_000);
  if (!rl.ok) {
    return Response.json(
      { error: `كتر شوية على الترجمة — جرّب بعد ${Math.ceil(rl.retryAfterSeconds / 60)} دقيقة` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } },
    );
  }

  // ── Input ────────────────────────────────────────────────────────────────
  let cvText = "";
  let file: File | null = null;
  let target: "auto" | "ar" | "en" = "auto";
  try {
    const form = await req.formData();
    const t = form.get("text");
    if (typeof t === "string" && t.trim().length > 30) cvText = t.trim();
    const tg = form.get("target");
    if (tg === "ar" || tg === "en") target = tg;
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

  // ── 1) Extract CV text from the file (Gemini multimodal handles OCR) ──────
  if (!cvText && file) {
    const lower = file.name.toLowerCase();
    const isPdf = lower.endsWith(".pdf") || file.type === "application/pdf";
    const isImage =
      file.type.startsWith("image/") || /\.(png|jpe?g|webp|gif)$/.test(lower);
    const isText = lower.endsWith(".txt") || file.type.startsWith("text/");
    const isDocx =
      lower.endsWith(".docx") ||
      file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    if (isText) {
      cvText = (await file.text()).trim();
    } else if (isDocx) {
      try {
        const mammoth = (await import("mammoth")).default;
        const buf = Buffer.from(await file.arrayBuffer());
        const { value } = await mammoth.extractRawText({ buffer: buf });
        cvText = (value ?? "").trim();
      } catch {
        return Response.json(
          { error: "ما قدرناش نقرا ملف الـ Word — جرّب تحفظه PDF أو الصق النص." },
          { status: 400 },
        );
      }
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
        { error: "النوع ده مش مدعوم. ارفع PDF أو Word أو صورة أو ملف نصي، أو الصق نص الـCV." },
        { status: 400 },
      );
    }
  }

  if (cvText.length < 30) {
    return Response.json({ error: "نص السيرة الذاتية قصير أو فاضي — تأكد من الملف." }, { status: 400 });
  }
  if (cvText.length > 20000) cvText = cvText.slice(0, 20000);

  // ── 2) Translate + analyze (resilient chain; Gemini-first for long CVs) ───
  const prompt = buildCvTranslationPrompt(cvText, target);
  try {
    const result = await callWithFallback(
      (picked) =>
        generateObject({
          model: picked.model,
          schema: cvTranslationSchema,
          prompt,
          temperature: 0.2,
          maxRetries: 0,
        }).then((r) => r.object),
      pickAgentModelLargeContext,
    );
    return Response.json({ ok: true, result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ error: msg.slice(0, 200) }, { status: 502 });
  }
}
