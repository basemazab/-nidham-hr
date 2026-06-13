"use server";

import { revalidatePath } from "next/cache";
import { requireHR } from "@/lib/permissions";
import {
  generateInvestigation,
  generateLegalOpinion,
  type InvestigationResult,
  type LegalOpinion,
} from "@/lib/legal-advisor";

// Step 1: open a case + generate the formal investigation questions.
export async function startCase(input: {
  employeeName: string;
  employeeTitle?: string;
  caseType: string;
  description: string;
  evidence?: string;
}): Promise<
  | { ok: true; caseId: string; investigation: InvestigationResult }
  | { ok: false; error: string }
> {
  const { supabase, profile } = await requireHR();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const employeeName = input.employeeName.trim();
  const description = input.description.trim();
  if (!employeeName || description.length < 10) {
    return { ok: false, error: "اكتب اسم العامل ووصف واضح للواقعة (10 أحرف على الأقل)" };
  }

  let investigation: InvestigationResult;
  try {
    investigation = await generateInvestigation({
      employeeName,
      employeeTitle: input.employeeTitle?.trim() || null,
      caseType: input.caseType,
      description,
      evidence: input.evidence?.trim() || null,
    });
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? `تعذّر تجهيز أسئلة التحقيق — ${err.message.slice(0, 120)}`
          : "تعذّر تجهيز أسئلة التحقيق",
    };
  }

  const { data: saved, error } = await supabase
    .from("legal_cases")
    .insert({
      company_id: profile.company_id,
      employee_name: employeeName,
      employee_title: input.employeeTitle?.trim() || null,
      case_type: input.caseType,
      description,
      evidence: input.evidence?.trim() || null,
      questions: investigation.questions,
      status: "investigated",
      created_by: user?.id ?? null,
    })
    .select("id")
    .single<{ id: string }>();

  if (error || !saved) {
    return {
      ok: false,
      error: /relation .* does not exist|PGRST205|schema cache/i.test(error?.message ?? "")
        ? "طبّق migration 109 في Supabase الأول"
        : error?.message || "فشل حفظ القضية",
    };
  }

  revalidatePath("/dashboard/legal-advisor");
  return { ok: true, caseId: saved.id, investigation };
}

// Step 2: record the employee's answers + produce the legal opinion.
export async function opineOnCase(input: {
  caseId: string;
  answers: { question: string; answer: string }[];
}): Promise<{ ok: true; opinion: LegalOpinion } | { ok: false; error: string }> {
  const { supabase, profile } = await requireHR();

  const { data: c } = await supabase
    .from("legal_cases")
    .select("employee_name, employee_title, case_type, description, evidence")
    .eq("id", input.caseId)
    .eq("company_id", profile.company_id)
    .maybeSingle<{
      employee_name: string;
      employee_title: string | null;
      case_type: string;
      description: string;
      evidence: string | null;
    }>();
  if (!c) return { ok: false, error: "القضية غير موجودة" };

  const { data: company } = await supabase
    .from("companies")
    .select("name")
    .eq("id", profile.company_id)
    .maybeSingle<{ name: string | null }>();

  let opinion: LegalOpinion;
  try {
    opinion = await generateLegalOpinion({
      employeeName: c.employee_name,
      employeeTitle: c.employee_title,
      companyName: company?.name || "الشركة",
      caseType: c.case_type,
      description: c.description,
      evidence: c.evidence,
      answers: input.answers,
    });
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? `تعذّر كتابة الرأي القانوني — ${err.message.slice(0, 120)}`
          : "تعذّر كتابة الرأي القانوني",
    };
  }

  await supabase
    .from("legal_cases")
    .update({
      answers: input.answers,
      opinion,
      status: "opined",
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.caseId)
    .eq("company_id", profile.company_id);

  revalidatePath("/dashboard/legal-advisor");
  return { ok: true, opinion };
}
