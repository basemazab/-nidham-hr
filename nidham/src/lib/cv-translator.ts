// ============================================================================
// CV Translator — translate a resume fully (AR ⇄ EN) + complete HR analysis
// ============================================================================
//
// One generateObject call returns BOTH:
//   • translated — the ENTIRE CV translated faithfully (structured sections so
//     the UI can render + print a clean A4 document)
//   • analysis — HR read on the candidate, always in Egyptian Arabic
//
// Used by /api/ai/cv-translator (the route handles auth/extraction/fallback).

import { z } from "zod";

export const cvTranslationSchema = z.object({
  detected_language: z
    .string()
    .describe("لغة السيرة الأصلية بالعربي، مثل: 'إنجليزي' أو 'عربي' أو 'فرنساوي'"),
  direction: z
    .enum(["rtl", "ltr"])
    .describe("اتجاه نص الترجمة الناتجة: rtl لو الترجمة بالعربي، ltr لو بالإنجليزي"),
  translated: z.object({
    name: z.string().describe("اسم المرشح مترجم/منقول صوتيًا بدقة"),
    headline: z
      .string()
      .describe("المسمى الوظيفي/السطر التعريفي مترجم — سلسلة فاضية لو مش موجود"),
    contact_lines: z
      .array(z.string())
      .describe(
        "سطور التواصل (موبايل/إيميل/عنوان/لينكدإن) — الأرقام والإيميلات والروابط تُنقل حرفيًا بدون ترجمة",
      ),
    sections: z
      .array(
        z.object({
          title: z
            .string()
            .describe("عنوان القسم مترجم (مثل: الخبرة العملية، التعليم، المهارات، الدورات)"),
          entries: z.array(
            z.object({
              heading: z
                .string()
                .describe(
                  "عنوان البند مترجم (مثل: 'محاسب أول — شركة X'). سلسلة فاضية لو القسم قائمة بسيطة زي المهارات",
                ),
              meta: z
                .string()
                .describe("الفترة/المكان (مثل: '2019 – 2023 · القاهرة'). سلسلة فاضية لو مفيش"),
              bullets: z
                .array(z.string())
                .describe(
                  "كل نقاط/سطور البند مترجمة بالكامل وبنفس التفاصيل — ممنوع التلخيص أو حذف أي سطر",
                ),
            }),
          ),
        }),
      )
      .describe("كل أقسام السيرة الذاتية مترجمة بالكامل وبنفس ترتيب الأصل — متسيبش أي قسم"),
  }),
  analysis: z.object({
    summary: z
      .string()
      .describe("ملخص المرشح في 3-4 جمل بالعربي المصري — صريح ومحدد ومفيد لقرار التوظيف"),
    years_experience: z.number().describe("تقدير إجمالي سنين الخبرة"),
    education: z.string().describe("أعلى مؤهل + التخصص باختصار"),
    seniority: z
      .string()
      .describe("مستوى المرشح: مبتدئ (Junior) / متوسط (Mid) / خبير (Senior) / قيادي"),
    key_skills: z.array(z.string()).describe("أهم المهارات الظاهرة — كلمات قصيرة"),
    languages: z
      .array(z.string())
      .describe("اللغات اللي بيعرفها + مستواه فيها لو مذكور (مثل: 'إنجليزي — ممتاز')"),
    strengths: z.array(z.string()).describe("نقاط القوة بالعربي — عبارات قصيرة"),
    gaps: z.array(z.string()).describe("نقاط الضعف/الفجوات بالعربي — كن صريح"),
    red_flags: z
      .array(z.string())
      .describe(
        "علامات إنذار للـ HR (فجوات زمنية بدون تفسير، تنقّل كتير بين الشركات، غموض في المهام...) — مصفوفة فاضية لو مفيش",
      ),
    suggested_roles: z
      .array(z.string())
      .describe("2-4 وظائف مناسبة لملف المرشح ده"),
    interview_questions: z
      .array(z.string())
      .describe("4-6 أسئلة مقابلة بالعربي مخصصة على سيرته بالذات (مش أسئلة عامة)"),
    overall_score: z
      .number()
      .min(0)
      .max(100)
      .describe("تقييم عام لقوة الملف المهني من 0 لـ 100"),
    verdict: z
      .string()
      .describe("الخلاصة للـ HR في جملة واحدة بالعربي المصري"),
  }),
});

export type CvTranslationResult = z.infer<typeof cvTranslationSchema>;

export function buildCvTranslationPrompt(
  cvText: string,
  target: "auto" | "ar" | "en",
): string {
  const targetRule =
    target === "ar"
      ? "لغة الترجمة المطلوبة: العربية الفصحى المبسطة."
      : target === "en"
        ? "لغة الترجمة المطلوبة: الإنجليزية الاحترافية."
        : "حدد لغة السيرة تلقائيًا: لو عربي ترجمها للإنجليزية الاحترافية، ولو إنجليزي (أو أي لغة تانية) ترجمها للعربية الفصحى المبسطة.";

  return `إنت مترجم سير ذاتية محترف + خبير HR مصري. معاك نص سيرة ذاتية، مطلوب منك حاجتين:

● أولًا — الترجمة الكاملة:
${targetRule}
قواعد الترجمة:
1. ترجم **كل** المحتوى بنفس التفاصيل — ممنوع التلخيص أو حذف أي سطر أو نقطة.
2. أسماء الشركات والجامعات والشهادات: ترجمها ترجمة متعارف عليها، وحط الاسم الأصلي بين قوسين لو الترجمة ممكن تلخبط.
3. المصطلحات التقنية (أسماء برامج، لغات برمجة، أدوات): سيبها بالإنجليزي زي ما هي.
4. الأرقام، التواريخ، الإيميلات، أرقام التليفون، الروابط: تُنقل حرفيًا بدون أي تغيير.
5. حافظ على ترتيب الأقسام زي الأصل بالظبط.
6. لو في حاجة مش مقروءة أو ناقصة اكتب مكانها [غير واضح] — متخترعش محتوى.

● ثانيًا — التحليل (دايمًا بالعربي المصري مهما كانت لغة الترجمة):
حلّل المرشح كخبير HR: ملخص صريح، سنين الخبرة، المستوى، المهارات، اللغات، نقاط القوة، الفجوات، علامات الإنذار (لو فيه)، وظائف مقترحة، أسئلة مقابلة مخصصة على سيرته، وتقييم عام من 100 مع خلاصة في جملة.

نص السيرة الذاتية:
"""
${cvText}
"""`;
}
