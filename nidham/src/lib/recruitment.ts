export const JOB_TYPES = [
  { value: "full_time", label: "دوام كامل" },
  { value: "part_time", label: "دوام جزئي" },
  { value: "contract", label: "عقد" },
  { value: "internship", label: "تدريب" },
  { value: "remote", label: "عن بعد" },
] as const;

export const JOB_LEVELS = [
  { value: "intern", label: "متدرب" },
  { value: "entry", label: "مبتدئ" },
  { value: "mid", label: "متوسط" },
  { value: "senior", label: "كبير" },
  { value: "lead", label: "قائد فريق" },
  { value: "manager", label: "مدير" },
  { value: "dir", label: "مدير عام" },
] as const;

export const JOB_STATUSES = [
  { value: "draft", label: "مسودة", color: "text-gray-500 bg-gray-100" },
  { value: "open", label: "نشطة", color: "text-emerald-700 bg-emerald-50" },
  { value: "closed", label: "مغلقة", color: "text-red-700 bg-red-50" },
  { value: "filled", label: "تم التعيين", color: "text-blue-700 bg-blue-50" },
  { value: "cancelled", label: "ملغاة", color: "text-gray-500 bg-gray-100" },
] as const;

export const APP_STATUSES = [
  { value: "new", label: "جديد", color: "text-blue-700 bg-blue-50" },
  { value: "reviewing", label: "قيد المراجعة", color: "text-amber-700 bg-amber-50" },
  { value: "shortlisted", label: "مقبول مبدئياً", color: "text-cyan-700 bg-cyan-50" },
  { value: "interview", label: "مقابلة", color: "text-purple-700 bg-purple-50" },
  { value: "offer", label: "عرض عمل", color: "text-emerald-700 bg-emerald-50" },
  { value: "hired", label: "تم التعيين", color: "text-green-700 bg-green-100" },
  { value: "rejected", label: "مرفوض", color: "text-red-700 bg-red-50" },
  { value: "withdrawn", label: "منسحب", color: "text-gray-500 bg-gray-100" },
] as const;

export const DEFAULT_PIPELINE_STAGES = [
  { name: "جديد", ordinal: 0, color: "#3b82f6" },
  { name: "فحص أولي", ordinal: 1, color: "#f59e0b" },
  { name: "مقابلة", ordinal: 2, color: "#8b5cf6" },
  { name: "عرض عمل", ordinal: 3, color: "#10b981" },
  { name: "تم التعيين", ordinal: 4, color: "#059669" },
];

export type JobType = (typeof JOB_TYPES)[number]["value"];
export type JobLevel = (typeof JOB_LEVELS)[number]["value"];
export type JobStatus = (typeof JOB_STATUSES)[number]["value"];
export type AppStatus = (typeof APP_STATUSES)[number]["value"];

export type JobRow = {
  id: string;
  company_id: string;
  title: string;
  department: string | null;
  description: string | null;
  requirements: string | null;
  responsibilities: string | null;
  benefits: string | null;
  job_type: JobType;
  level: JobLevel | null;
  location: string | null;
  remote_ok: boolean;
  salary_min: number | null;
  salary_max: number | null;
  is_salary_visible: boolean;
  experience_years_min: number;
  status: JobStatus;
  posted_at: string;
  closes_at: string | null;
  slug: string | null;
  is_public: boolean;
  views_count: number;
  applications_count: number;
  created_by: string | null;
  created_at: string;
};

export type CandidateRow = {
  id: string;
  company_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  headline: string | null;
  summary: string | null;
  current_title: string | null;
  current_company: string | null;
  years_experience: number | null;
  location: string | null;
  skills: string[] | null;
  avatar: string | null;
  expected_salary: number | null;
  tags: string[] | null;
  notes: string | null;
  created_at: string;
};

export type ApplicationRow = {
  id: string;
  company_id: string;
  job_id: string;
  candidate_id: string;
  cv_text: string | null;
  cv_pdf_url: string | null;
  cover_letter: string | null;
  source: string;
  ai_score: number | null;
  ai_recommendation: string | null;
  ai_summary: string | null;
  ai_strengths: string[] | null;
  ai_weaknesses: string[] | null;
  ai_interview_questions: string[] | null;
  ai_extracted_skills: string[] | null;
  ai_match_details: Record<string, number> | null;
  ai_analyzed_at: string | null;
  ai_error: string | null;
  status: AppStatus;
  hr_notes: string | null;
  rating: number | null;
  assigned_to: string | null;
  interview_at: string | null;
  applied_at: string;
  reviewed_at: string | null;
  last_activity_at: string;
};

export type ApplicationWithCandidate = ApplicationRow & {
  candidates: Pick<CandidateRow, "full_name" | "email" | "phone" | "current_title" | "current_company" | "location" | "avatar" | "skills">;
};

export type JobSkill = {
  id: string;
  job_id: string;
  name: string;
  is_required: boolean;
};

export type PipelineStage = {
  id: string;
  job_id: string;
  name: string;
  ordinal: number;
  color: string;
};

export type StageHistory = {
  id: string;
  application_id: string;
  from_stage: string | null;
  to_stage: string;
  changed_by: string | null;
  notes: string | null;
  created_at: string;
};

export function jobTypeLabel(type: JobType): string {
  return JOB_TYPES.find((t) => t.value === type)?.label ?? type;
}

export function jobLevelLabel(level: JobLevel | null): string {
  if (!level) return "—";
  return JOB_LEVELS.find((l) => l.value === level)?.label ?? level;
}

export function jobStatusLabel(status: JobStatus): string {
  return JOB_STATUSES.find((s) => s.value === status)?.label ?? status;
}

export function jobStatusColor(status: JobStatus): string {
  return JOB_STATUSES.find((s) => s.value === status)?.color ?? "";
}

export function appStatusLabel(status: AppStatus): string {
  return APP_STATUSES.find((s) => s.value === status)?.label ?? status;
}

export function appStatusColor(status: AppStatus): string {
  return APP_STATUSES.find((s) => s.value === status)?.color ?? "";
}

export function formatSalary(min: number | null, max: number | null): string {
  if (min === null && max === null) return "غير محدد";
  if (min !== null && max !== null) return `${min.toLocaleString("ar-EG")} - ${max.toLocaleString("ar-EG")} ج.م`;
  if (min !== null) return `من ${min.toLocaleString("ar-EG")} ج.م`;
  return `حتى ${max!.toLocaleString("ar-EG")} ج.م`;
}

export function aiScoreColor(score: number | null): string {
  if (score === null) return "text-gray-400";
  if (score >= 70) return "text-emerald-600";
  if (score >= 40) return "text-amber-600";
  return "text-red-600";
}

export function aiScoreBg(score: number | null): string {
  if (score === null) return "border-gray-200";
  if (score >= 70) return "border-emerald-500";
  if (score >= 40) return "border-amber-500";
  return "border-red-500";
}

// ─── Types used by pre-existing AI routes ────────────────────────────────────

export type ApplicationStatus = AppStatus;
export type AiRecommendation = "strong_yes" | "yes" | "maybe" | "no";

export const STATUS_LABELS_AR: Record<string, string> = {
  new: "جديد", reviewing: "قيد المراجعة", shortlisted: "مقبول مبدئياً",
  interview: "مقابلة", offer: "عرض عمل", hired: "تم التعيين",
  rejected: "مرفوض", withdrawn: "منسحب",
};

export const STATUS_CLASSES: Record<string, string> = {
  new: "bg-blue-50 text-blue-700", reviewing: "bg-amber-50 text-amber-700",
  shortlisted: "bg-cyan-50 text-cyan-700", interview: "bg-purple-50 text-purple-700",
  offer: "bg-emerald-50 text-emerald-700", hired: "bg-green-100 text-green-700",
  rejected: "bg-red-50 text-red-700", withdrawn: "bg-gray-100 text-gray-500",
};

export const RECOMMENDATION_LABELS_AR: Record<string, string> = {
  strong_yes: "ممتاز", yes: "مناسب", maybe: "يمكن", no: "غير مناسب",
};

export const RECOMMENDATION_CLASSES: Record<string, string> = {
  strong_yes: "bg-emerald-100 text-emerald-800", yes: "bg-blue-100 text-blue-800",
  maybe: "bg-amber-100 text-amber-800", no: "bg-red-100 text-red-800",
};

export type CvAnalysisResult = {
  candidate_name: string;
  headline: string;
  summary: string;
  years_experience: number;
  education: string;
  key_skills: string[];
  recommended_job: {
    title: string;
    match_score: number;
    reasoning: string;
    fit_strengths: string[];
    fit_gaps: string[];
    is_from_company_jobs: boolean;
  };
  other_matches: { title: string; match_score: number }[];
  candidate_test: { question: string; type: string; skill_area: string }[];
  hr_questions: { question: string; purpose: string }[];
  industry_tailoring_note: string;
};

export type JobDescriptionResult = {
  job_title: string;
  reports_to: string;
  job_purpose: string;
  responsibilities: string[];
  qualifications: string[];
  kpis: string[];
  industry_note: string;
};

export type JobForScreening = {
  title: string;
  department: string | null;
  description: string | null;
  requirements: string | null;
  responsibilities: string | null;
  experience_years_min: number | null;
  location: string | null;
  job_type: string;
};

export type CandidateForScreening = {
  full_name: string;
  current_title: string | null;
  years_experience: number | null;
  location: string | null;
};

export function buildScreeningPrompt(
  job: JobForScreening,
  candidate: CandidateForScreening,
  cvText: string,
): string {
  return `أنت خبير توظيف. حلل السيرة الذاتية التالية مقابل متطلبات الوظيفة.

الوظيفة: ${job.title}
القسم: ${job.department ?? "غير محدد"}
وصف الوظيفة: ${job.description ?? ""}
المتطلبات: ${job.requirements ?? ""}
المسؤوليات: ${job.responsibilities ?? ""}
سنوات الخبرة المطلوبة: ${job.experience_years_min ?? 0}
الموقع: ${job.location ?? "غير محدد"}
النوع: ${job.job_type}

المرشح: ${candidate.full_name}
المسمى الحالي: ${candidate.current_title ?? "غير محدد"}
سنوات الخبرة: ${candidate.years_experience ?? 0}
الموقع: ${candidate.location ?? "غير محدد"}

نص السيرة الذاتية:
${cvText}

حدد درجة التطابق من 0-100 والتوصية.`;
}

import { z } from "zod";

export const screeningSchema = z.object({
  score: z.number().min(0).max(100),
  recommendation: z.enum(["strong_yes", "yes", "maybe", "no"]),
  summary: z.string(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  interview_questions: z.array(z.string()),
  extracted_skills: z.array(z.string()),
});

export type JobForCv = {
  id: string;
  title: string;
  department: string | null;
  description: string | null;
  requirements: string | null;
  job_type: string;
  location: string | null;
  salary_min: number | null;
  salary_max: number | null;
};

export const cvAnalysisSchema = z.object({
  candidate_name: z.string(),
  headline: z.string(),
  summary: z.string(),
  years_experience: z.number(),
  education: z.string(),
  key_skills: z.array(z.string()),
  recommended_job: z.object({
    title: z.string(),
    match_score: z.number().min(0).max(100),
    reasoning: z.string(),
    fit_strengths: z.array(z.string()),
    fit_gaps: z.array(z.string()),
    is_from_company_jobs: z.boolean(),
  }),
  other_matches: z.array(z.object({
    title: z.string(),
    match_score: z.number().min(0).max(100),
  })),
  candidate_test: z.array(z.object({
    question: z.string(),
    type: z.string(),
    skill_area: z.string(),
  })),
  hr_questions: z.array(z.object({
    question: z.string(),
    purpose: z.string(),
  })),
  industry_tailoring_note: z.string(),
});

export function buildCvAnalysisPrompt(
  company: { name: string | null; industry: string | null },
  jobs: JobForCv[],
  cvText: string,
): string {
  const jobsList = jobs.map((j, i) =>
    `${i + 1}. ${j.title} (${j.department ?? "عام"}) — ${j.location ?? ""} ${j.salary_min ? `${j.salary_min}-${j.salary_max ?? ""} ج.م` : ""}`
  ).join("\n");

  return `شركة: ${company.name ?? "غير معروفة"}
النشاط: ${company.industry ?? "غير محدد"}

الوظائف الشاغرة:
${jobsList}

نص السيرة الذاتية:
${cvText}

حلل السيرة وحدد أفضل وظيفة تناسب المرشح. أخرج JSON بالشكل المحدد في الـ schema.`;
}

export const jobDescriptionSchema = z.object({
  job_title: z.string(),
  reports_to: z.string(),
  job_purpose: z.string(),
  responsibilities: z.array(z.string()),
  qualifications: z.array(z.string()),
  kpis: z.array(z.string()),
  industry_note: z.string(),
});

export function buildJobDescriptionPrompt(
  company: { name: string | null; industry: string | null },
  title: string,
  department: string | null,
): string {
  return `أنت خبير موارد بشرية. اكتب توصيف وظيفي متكامل بالعربية للمسمى "${title}"${department ? ` في قسم ${department}` : ""}.
الشركة: ${company.name ?? "غير محدد"} - المجال: ${company.industry ?? "غير محدد"}

أخرج JSON بالشكل المطلوب. حقل industry_note فيه ملاحظة تخصيص التوصيف حسب نشاط الشركة.`;
}
