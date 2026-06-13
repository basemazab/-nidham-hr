// ============================================================================
// بانية السيرة الذاتية — ATS-optimized CV structuring + scoring
// ============================================================================
// Two AI passes (both via the resilient fallback chain):
//   1) structureAndEnhanceCV — take raw text (pasted CV / extracted file /
//      rough notes) → return clean structured CvData with ATS-friendly,
//      metric-driven bullets. Keeps the source language.
//   2) reviewCvAts — score the CV 0-100 against ATS best-practices + the
//      target role, with concrete fixes and missing keywords.

import { z } from "zod";
import { generateObject } from "ai";
import { callWithFallback, pickAgentModelLargeContext } from "@/lib/ai-models";

export const cvDataSchema = z.object({
  full_name: z.string().describe("الاسم الكامل"),
  headline: z.string().describe("المسمى المهني تحت الاسم، مثل: محاسب أول | خبرة 6 سنين"),
  email: z.string().describe("الإيميل — سلسلة فاضية لو مش متاح"),
  phone: z.string().describe("رقم الموبايل — سلسلة فاضية لو مش متاح"),
  location: z.string().describe("المدينة/الدولة — سلسلة فاضية لو مش متاح"),
  links: z.array(z.string()).describe("روابط (LinkedIn، Portfolio، GitHub) — حرفيًا كما هي"),
  summary: z
    .string()
    .describe("ملخص مهني قوي 2-3 جمل موجّه للوظيفة المستهدفة، بكلمات مفتاحية ATS"),
  experience: z
    .array(
      z.object({
        role: z.string().describe("المسمى الوظيفي"),
        company: z.string().describe("الشركة"),
        location: z.string().describe("المكان — فاضي لو مش متاح"),
        period: z.string().describe("الفترة، مثل: 2021 – الآن"),
        bullets: z
          .array(z.string())
          .describe(
            "إنجازات بصيغة ATS: تبدأ بفعل قوي + رقم/نتيجة قابلة للقياس متى أمكن (مثل: 'قلّلت وقت إقفال المرتبات 40% عبر أتمتة...'). موجزة وواقعية — متخترعش أرقام مش في المصدر؛ لو مفيش رقم صُغ الإنجاز بوضوح بدون تلفيق.",
          ),
      }),
    )
    .describe("الخبرات العملية من الأحدث للأقدم"),
  education: z
    .array(
      z.object({
        degree: z.string(),
        institution: z.string(),
        period: z.string(),
        details: z.string().describe("تقدير/تخصص/مشروع تخرج — فاضي لو مفيش"),
      }),
    )
    .describe("المؤهلات الدراسية"),
  skills: z.array(z.string()).describe("المهارات — كلمات مفتاحية مفردة مناسبة للـ ATS"),
  languages: z.array(z.string()).describe("اللغات + المستوى، مثل: 'إنجليزي — ممتاز'"),
  certifications: z.array(z.string()).describe("الشهادات والدورات — فاضي لو مفيش"),
});

export type CvData = z.infer<typeof cvDataSchema>;

export const atsReviewSchema = z.object({
  score: z.number().min(0).max(100).describe("درجة توافق ATS من 0 لـ 100"),
  verdict: z.string().describe("جملة واحدة بالعربي تلخّص حالة السيرة"),
  strengths: z.array(z.string()).describe("نقاط القوة في السيرة من منظور ATS"),
  issues: z
    .array(z.string())
    .describe("المشاكل اللي بتقلل درجة ATS (تنسيق، نقص كلمات مفتاحية، bullets ضعيفة...)"),
  missing_keywords: z
    .array(z.string())
    .describe("كلمات مفتاحية مهمة للوظيفة المستهدفة وناقصة في السيرة — يُفضّل إضافتها"),
  fixes: z.array(z.string()).describe("خطوات عملية محددة لرفع الدرجة"),
});

export type AtsReview = z.infer<typeof atsReviewSchema>;

const ATS_RULES = `قواعد توافق الـ ATS (أنظمة فرز السير الذاتية):
- تنسيق عمود واحد، بدون جداول/أعمدة/صور/أيقونات تكسر القراءة الآلية.
- عناوين أقسام قياسية (الخبرة، التعليم، المهارات، اللغات).
- كل إنجاز يبدأ بفعل قوي + نتيجة قابلة للقياس متى أمكن.
- كلمات مفتاحية مطابقة للمسمى الوظيفي المستهدف (المهارات والأدوات بأسمائها الصريحة).
- تواريخ واضحة، إيميل وموبايل صحيحين، بدون اختصارات غامضة.
- ملخص مهني قوي في الأعلى موجّه للوظيفة.`;

export async function structureAndEnhanceCV(input: {
  rawText: string;
  targetRole?: string;
}): Promise<CvData> {
  const prompt = `إنت خبير كتابة سير ذاتية متوافقة مع أنظمة الـ ATS. حوّل النص الخام ده لسيرة ذاتية منظّمة ومحسّنة:

${ATS_RULES}

${input.targetRole ? `الوظيفة المستهدفة: ${input.targetRole}\n` : ""}
المطلوب:
- استخرج كل المعلومات من النص ورتّبها في الحقول المنظمة.
- أعِد صياغة الإنجازات بصيغة ATS قوية (فعل + نتيجة)، وحسّن الملخص والمهارات بكلمات مفتاحية مناسبة للوظيفة المستهدفة.
- التزم بلغة المصدر (لو النص عربي خليه عربي، لو إنجليزي خليه إنجليزي).
- ممنوع تخترع خبرات أو شركات أو أرقام مش في النص — حسّن الصياغة بس مش الحقائق.

النص الخام:
"""
${input.rawText.slice(0, 16000)}
"""`;

  return callWithFallback(
    (picked) =>
      generateObject({
        model: picked.model,
        schema: cvDataSchema,
        prompt,
        temperature: 0.3,
        maxRetries: 0,
        // Cap each provider attempt — a hung/overloaded model aborts and the
        // fallback chain moves on instead of holding the request to timeout.
        abortSignal: AbortSignal.timeout(22_000),
      }).then((r) => r.object),
    pickAgentModelLargeContext,
  );
}

export async function reviewCvAts(input: {
  cv: CvData;
  targetRole?: string;
}): Promise<AtsReview> {
  const prompt = `إنت محلّل ATS خبير. قيّم السيرة الذاتية دي من منظور أنظمة فرز السير، واطلع بدرجة وتوصيات.

${ATS_RULES}

${input.targetRole ? `الوظيفة المستهدفة: ${input.targetRole}` : "مفيش وظيفة مستهدفة محددة — قيّم عموميًا."}

السيرة (JSON):
${JSON.stringify(input.cv).slice(0, 12000)}

قيّم بصدق: الدرجة، نقاط القوة، المشاكل، الكلمات المفتاحية الناقصة للوظيفة المستهدفة، وخطوات عملية لرفع الدرجة.`;

  return callWithFallback(
    (picked) =>
      generateObject({
        model: picked.model,
        schema: atsReviewSchema,
        prompt,
        temperature: 0.2,
        maxRetries: 0,
        abortSignal: AbortSignal.timeout(18_000),
      }).then((r) => r.object),
    pickAgentModelLargeContext,
  );
}

export const EMPTY_CV: CvData = {
  full_name: "",
  headline: "",
  email: "",
  phone: "",
  location: "",
  links: [],
  summary: "",
  experience: [],
  education: [],
  skills: [],
  languages: [],
  certifications: [],
};
