// Recruitment domain types + AI screening prompt builder.
//
// The AI route uses generateObject from the `ai` SDK with the schema below
// to force Gemini to return a strictly-typed JSON payload. No regex parsing,
// no markdown fences to strip — the SDK handles the contract.

import { z } from "zod";

// ----------------------------------------------------------------------------
// Domain types
// ----------------------------------------------------------------------------

export type ApplicationStatus =
  | "new"
  | "reviewing"
  | "shortlisted"
  | "interview"
  | "offer"
  | "hired"
  | "rejected"
  | "withdrawn";

export type AiRecommendation = "strong_yes" | "yes" | "maybe" | "no";

export const STATUS_LABELS_AR: Record<ApplicationStatus, string> = {
  new: "جديد",
  reviewing: "تحت المراجعة",
  shortlisted: "مرشح للقائمة القصيرة",
  interview: "مقابلة",
  offer: "عرض عمل",
  hired: "تم التعيين",
  rejected: "مرفوض",
  withdrawn: "انسحب",
};

export const STATUS_CLASSES: Record<ApplicationStatus, string> = {
  new: "bg-blue-50 text-blue-700 border-blue-200",
  reviewing: "bg-amber-50 text-amber-700 border-amber-200",
  shortlisted: "bg-purple-50 text-purple-700 border-purple-200",
  interview: "bg-cyan-50 text-cyan-700 border-cyan-200",
  offer: "bg-indigo-50 text-indigo-700 border-indigo-200",
  hired: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  withdrawn: "bg-slate-100 text-slate-600 border-slate-200",
};

export const RECOMMENDATION_LABELS_AR: Record<AiRecommendation, string> = {
  strong_yes: "مرشح قوي",
  yes: "مرشح جيد",
  maybe: "ممكن",
  no: "غير مناسب",
};

export const RECOMMENDATION_CLASSES: Record<AiRecommendation, string> = {
  strong_yes: "bg-emerald-100 text-emerald-800 border-emerald-300",
  yes: "bg-cyan-100 text-cyan-800 border-cyan-300",
  maybe: "bg-amber-100 text-amber-800 border-amber-300",
  no: "bg-red-100 text-red-800 border-red-300",
};

// ----------------------------------------------------------------------------
// AI screening contract
// ----------------------------------------------------------------------------

export const screeningSchema = z.object({
  score: z
    .number()
    .int()
    .min(0)
    .max(100)
    .describe("Match score 0-100"),
  recommendation: z
    .enum(["strong_yes", "yes", "maybe", "no"])
    .describe("Hire recommendation"),
  summary: z
    .string()
    .min(10)
    .max(500)
    .describe("2-3 sentence overall assessment in Egyptian Arabic"),
  strengths: z
    .array(z.string())
    .min(0)
    .max(6)
    .describe("Strengths in Arabic — short phrases"),
  weaknesses: z
    .array(z.string())
    .min(0)
    .max(6)
    .describe("Gaps in Arabic — short phrases"),
  interview_questions: z
    .array(z.string())
    .min(1)
    .max(6)
    .describe("Tailored interview questions in Arabic"),
  extracted_skills: z
    .array(z.string())
    .min(0)
    .max(20)
    .describe("Skills detected in CV — short tokens (e.g., 'Excel', 'SAP', 'تواصل')"),
});

export type ScreeningResult = z.infer<typeof screeningSchema>;

// ----------------------------------------------------------------------------
// Prompt builder
// ----------------------------------------------------------------------------

export type JobForScreening = {
  title: string;
  department?: string | null;
  description?: string | null;
  requirements?: string | null;
  responsibilities?: string | null;
  experience_years_min?: number | null;
  location?: string | null;
  job_type?: string | null;
};

export type CandidateForScreening = {
  full_name: string;
  current_title?: string | null;
  years_experience?: number | null;
  location?: string | null;
};

export function buildScreeningPrompt(
  job: JobForScreening,
  candidate: CandidateForScreening,
  cvText: string,
): string {
  return `أنت مساعد توظيف خبير عند شركة مصرية. مهمتك إنك تقيّم سيرة ذاتية واحدة على وظيفة محددة، وترجّع تقرير منظم وموضوعي بالعربي المصري.

═══════════════════════════════════════
الوظيفة المطلوب التقييم عليها
═══════════════════════════════════════
المسمى الوظيفي: ${job.title}
${job.department ? `القسم: ${job.department}` : ""}
${job.job_type ? `نوع الدوام: ${job.job_type}` : ""}
${job.location ? `المكان: ${job.location}` : ""}
${typeof job.experience_years_min === "number" ? `الحد الأدنى للخبرة: ${job.experience_years_min} سنة` : ""}

الوصف الوظيفي:
${job.description ?? "— غير محدد"}

المتطلبات:
${job.requirements ?? "— غير محددة"}

${job.responsibilities ? `المسؤوليات:\n${job.responsibilities}` : ""}

═══════════════════════════════════════
بيانات المرشح المعروفة
═══════════════════════════════════════
الاسم: ${candidate.full_name}
${candidate.current_title ? `الوظيفة الحالية: ${candidate.current_title}` : ""}
${typeof candidate.years_experience === "number" ? `سنين الخبرة: ${candidate.years_experience}` : ""}
${candidate.location ? `المكان: ${candidate.location}` : ""}

═══════════════════════════════════════
نص السيرة الذاتية
═══════════════════════════════════════
${cvText}

═══════════════════════════════════════
قواعد التقييم
═══════════════════════════════════════
- score: من 0 لـ 100 (90+ مطابقة قوية، 70-89 جيد، 50-69 محتمل، أقل من 50 ضعيف).
- recommendation:
    • "strong_yes" لو 90+ ومافيش فجوات جوهرية
    • "yes" لو 70-89 ويستحق مقابلة
    • "maybe" لو 50-69 ومحتمل بتدريب
    • "no" لو أقل من 50 أو فيه فجوة حرجة
- summary: جملتين 3 جمل بالعربي المصري — مختصرة وصريحة (مش هلامية).
- strengths/weaknesses: عبارات قصيرة بالعربي (مثلًا "خبرة 6 سنين في نفس المجال" أو "مفيش خبرة مباشرة في SAP").
- interview_questions: أسئلة مخصصة لنقاط القوة والضعف بتاعت المرشح ده — مش أسئلة عامة.
- extracted_skills: مهارات تقنية وسوفت سكيلز ظاهرة في الـ CV — كلمات قصيرة (Excel, SAP, تواصل, قيادة فريق).
- لو الـ CV مش واضح أو فاضي، حط score منخفض وقول السبب في الـ summary.

ارجع JSON مطابق للسكيمة بالظبط. مفيش أي كلام خارج الـ JSON.`;
}

// ============================================================================
// CV Analyzer — upload a CV → recommend the best-fit job + build a candidate
// test + HR interview questions, all tailored to the COMPANY's industry.
// ============================================================================

export const cvAnalysisSchema = z.object({
  candidate_name: z
    .string()
    .describe("اسم المرشح من الـCV، أو 'غير محدد' لو مش واضح"),
  headline: z
    .string()
    .describe("سطر تعريفي قصير، مثل: 'محاسب بخبرة 5 سنين في قطاع المقاولات'"),
  years_experience: z
    .number()
    .min(0)
    .max(60)
    .describe("تقدير إجمالي سنين الخبرة"),
  education: z.string().describe("أعلى مؤهل + التخصص باختصار"),
  key_skills: z
    .array(z.string())
    .max(15)
    .describe("أهم المهارات الظاهرة في الـCV — كلمات قصيرة"),
  summary: z
    .string()
    .min(10)
    .max(600)
    .describe("ملخص المرشح في 2-3 جمل بالعربي المصري — صريح ومحدد"),
  recommended_job: z
    .object({
      title: z
        .string()
        .describe(
          "الوظيفة الأنسب — من وظائف الشركة المتاحة لو فيه تطابق، وإلا اقترح المسمى الأنسب لنشاط الشركة",
        ),
      is_from_company_jobs: z
        .boolean()
        .describe("true لو المسمى من قائمة وظائف الشركة المعطاة"),
      match_score: z.number().int().min(0).max(100),
      reasoning: z.string().describe("ليه دي الأنسب — جملتين"),
      fit_strengths: z.array(z.string()).max(6),
      fit_gaps: z.array(z.string()).max(6),
    })
    .describe("الترشيح الأساسي"),
  other_matches: z
    .array(
      z.object({
        title: z.string(),
        match_score: z.number().int().min(0).max(100),
      }),
    )
    .max(5)
    .describe("وظائف الشركة الأخرى مرتّبة بنسبة التطابق (لو فيه وظائف تانية)"),
  candidate_test: z
    .array(
      z.object({
        question: z.string().describe("سؤال اختبار يجاوب عليه المرشح نفسه"),
        skill_area: z.string().describe("بيقيس إيه (مهارة/معرفة)"),
        type: z.enum(["technical", "case_study", "behavioral"]),
      }),
    )
    .min(3)
    .max(8)
    .describe(
      "اختبار للمرشح — أسئلة يجاوب عليها، مخصصة للدور المرشّح له ولنشاط الشركة",
    ),
  hr_questions: z
    .array(
      z.object({
        question: z.string().describe("سؤال للـ HR يناقشه مع المرشح في المقابلة"),
        purpose: z.string().describe("الهدف من السؤال / تسمع إيه في الإجابة"),
      }),
    )
    .min(3)
    .max(8)
    .describe("أسئلة مقابلة للـ HR، مخصصة للدور ولنشاط الشركة"),
  industry_tailoring_note: z
    .string()
    .describe("جملة توضح إزاي خصّصت الأسئلة لطبيعة نشاط الشركة تحديدًا"),
});

export type CvAnalysisResult = z.infer<typeof cvAnalysisSchema>;

export type CompanyForCv = { name: string | null; industry: string | null };
export type JobForCv = {
  title: string;
  department?: string | null;
  requirements?: string | null;
  experience_years_min?: number | null;
  job_type?: string | null;
};

export function buildCvAnalysisPrompt(
  company: CompanyForCv,
  jobs: JobForCv[],
  cvText: string,
): string {
  const jobsBlock =
    jobs.length > 0
      ? jobs
          .map(
            (j, i) =>
              `${i + 1}) ${j.title}${j.department ? ` — ${j.department}` : ""}${
                typeof j.experience_years_min === "number"
                  ? ` (خبرة ${j.experience_years_min}+ سنة)`
                  : ""
              }${j.requirements ? `\n   المتطلبات: ${j.requirements.slice(0, 300)}` : ""}`,
          )
          .join("\n")
      : "— الشركة لسه مفيش عندها وظائف منشورة. اقترح المسمى الوظيفي الأنسب للمرشح بناءً على نشاط الشركة.";

  return `أنت خبير توظيف (HR) عند شركة مصرية. مهمتك تحليل سيرة ذاتية واحدة وترشيح أنسب وظيفة + تجهيز اختبار للمرشح وأسئلة مقابلة لـ HR — كله مخصّص لطبيعة نشاط الشركة. اكتب بالعربي المصري الواضح.

═══════════════════════════════════════
نشاط الشركة (افهم طبيعتها كويس)
═══════════════════════════════════════
اسم الشركة: ${company.name ?? "غير محدد"}
النشاط/المجال: ${company.industry ?? "غير محدد"}

استنتج طبيعة شغل الشركة من اسمها ومجالها (مثلًا: مصنع أبواب/مقاولات → أسئلة عن الإنتاج والجودة والسلامة؛ شركة برمجيات → أسئلة تقنية برمجية؛ شركة تجارية/مبيعات → أسئلة بيع وتفاوض؛ عيادة/مستشفى → أسئلة طبية وإدارية). خلّي الاختبار وأسئلة المقابلة **مرتبطة بنشاط الشركة ده تحديدًا**، مش أسئلة عامة.

═══════════════════════════════════════
وظائف الشركة المتاحة (رشّح منها)
═══════════════════════════════════════
${jobsBlock}

═══════════════════════════════════════
نص السيرة الذاتية
═══════════════════════════════════════
${cvText}

═══════════════════════════════════════
المطلوب
═══════════════════════════════════════
1) حلّل الـCV: اسم، خبرة، تعليم، مهارات، وملخص صريح.
2) recommended_job: رشّح **أنسب وظيفة من قائمة وظائف الشركة** (is_from_company_jobs=true)؛ لو مفيش تطابق كويس أو القائمة فاضية، اقترح المسمى الأنسب لنشاط الشركة (is_from_company_jobs=false). حدّد match_score والأسباب ونقاط القوة والفجوات.
3) other_matches: باقي وظائف الشركة مرتّبة بنسبة التطابق (لو فيه).
4) candidate_test: 4-6 أسئلة **يجاوب عليها المرشح** لاختبار جدارته للدور — مخصصة للدور ولنشاط الشركة (مش أسئلة عامة)، ونوّع بين technical / case_study / behavioral.
5) hr_questions: 4-6 أسئلة **للـ HR** يناقشها في المقابلة، كل سؤال معاه الهدف منه.
6) industry_tailoring_note: جملة توضح إزاي خصّصت الأسئلة لنشاط الشركة.

ارجع JSON مطابق للسكيمة بالظبط. مفيش أي كلام خارج الـ JSON.`;
}
