import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صحيح"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "الاسم مطلوب"),
  email: z.string().email("البريد الإلكتروني غير صحيح"),
  password: z.string().min(8, "كلمة المرور يجب أن تكون ٨ أحرف على الأقل"),
  role: z.enum(["CANDIDATE", "COMPANY"]),
});

export const jobSchema = z.object({
  title: z.string().min(3, "عنوان الوظيفة مطلوب"),
  description: z.string().min(50, "الوصف يجب أن يكون ٥٠ حرفاً على الأقل"),
  requirements: z.string().min(30, "المتطلبات يجب أن تكون ٣٠ حرفاً على الأقل"),
  benefits: z.string().optional(),
  type: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "FREELANCE", "INTERNSHIP"]),
  category: z.string().min(1, "التصنيف مطلوب"),
  level: z.enum(["ENTRY", "MID", "SENIOR", "LEAD", "MANAGER", "DIRECTOR", "EXECUTIVE"]),
  location: z.string().min(1, "الموقع مطلوب"),
  isRemote: z.boolean().default(false),
  salaryMin: z.number().positive().optional(),
  salaryMax: z.number().positive().optional(),
  salaryCurrency: z.string().default("EGP"),
  isSalaryVisible: z.boolean().default(false),
  skills: z.array(z.string()).min(1, "مهارة واحدة على الأقل"),
  expiresAt: z.string().optional(),
});

export const applicationSchema = z.object({
  jobId: z.string(),
  coverLetter: z.string().optional(),
  resumeUrl: z.string().min(1, "السيرة الذاتية مطلوبة"),
});

export const profileSchema = z.object({
  name: z.string().min(2, "الاسم مطلوب"),
  phone: z.string().optional(),
  location: z.string().optional(),
  title: z.string().optional(),
  summary: z.string().optional(),
  skills: z.array(z.string()).optional(),
  salaryExpectation: z.number().positive().optional(),
});

export const companySchema = z.object({
  name: z.string().min(2, "اسم الشركة مطلوب"),
  description: z.string().optional(),
  website: z.string().url("الرابط غير صحيح").optional().or(z.literal("")),
  size: z.enum(["STARTUP", "SMALL", "MEDIUM", "LARGE", "ENTERPRISE"]).optional(),
  industry: z.string().optional(),
  location: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type JobInput = z.infer<typeof jobSchema>;
export type ApplicationInput = z.infer<typeof applicationSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type CompanyInput = z.infer<typeof companySchema>;
