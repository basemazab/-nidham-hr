"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, requireHR } from "@/lib/permissions";
import { bustDashboardCache } from "@/lib/cache";
import { asText, asNumber } from "@/lib/form-helpers";
import {
  createEmployee as serviceCreate,
  updateEmployee as serviceUpdate,
  setEmployeeStatus as serviceSetStatus,
  terminateEmployee as serviceTerminate,
  deleteEmployee as serviceDelete,
  deleteAllEmployees as serviceDeleteAll,
  generateEmployeeInvitation as serviceGenerateInvite,
  uploadEmployeeAvatar as serviceUploadAvatar,
  removeEmployeeAvatar as serviceRemoveAvatar,
  uploadEmployeeDocument as serviceUploadDoc,
  deleteEmployeeDocument as serviceDeleteDoc,
  previewEOSGratuity as servicePreviewEOS,
} from "@/services/employee.service";

export type { EOSBreakdown } from "@/services/employee.service";

export async function createEmployee(formData: FormData) {
  const { supabase, profile } = await requireHR();

  const fullName = asText(formData.get("full_name"));
  if (!fullName) {
    redirect("/dashboard/employees/new?error=" + encodeURIComponent("اسم الموظف مطلوب"));
  }

  const payFrequencyRaw = asText(formData.get("pay_frequency"));
  const payFrequency = payFrequencyRaw === "weekly" ? "weekly" : "monthly";

  const result = await serviceCreate(supabase, profile.company_id, {
    full_name: fullName,
    employee_code: asText(formData.get("employee_code")),
    job_title: asText(formData.get("job_title")),
    department: asText(formData.get("department")),
    reports_to: asText(formData.get("reports_to")),
    phone: asText(formData.get("phone")),
    email: asText(formData.get("email")),
    hire_date: asText(formData.get("hire_date")),
    date_of_birth: asText(formData.get("date_of_birth")),
    contract_type: asText(formData.get("contract_type")) ?? "indefinite",
    contract_start: asText(formData.get("contract_start")),
    contract_end: asText(formData.get("contract_end")),
    basic_salary: asNumber(formData.get("basic_salary")),
    housing_allowance: asNumber(formData.get("housing_allowance")),
    transport_allowance: asNumber(formData.get("transport_allowance")),
    other_allowances: asNumber(formData.get("other_allowances")),
    incentive_allowance: asNumber(formData.get("incentive_allowance")),
    pay_frequency: payFrequency,
    national_id: asText(formData.get("national_id")),
    social_insurance_number: asText(formData.get("social_insurance_number")),
    bank_name: asText(formData.get("bank_name")),
    bank_account_number: asText(formData.get("bank_account_number")),
    status: asText(formData.get("status")) ?? "active",
    notes: asText(formData.get("notes")),
  });

  if (!result.success) {
    redirect("/dashboard/employees/new?error=" + encodeURIComponent(result.error));
  }

  revalidatePath("/dashboard/employees");
  bustDashboardCache();
  redirect("/dashboard/employees");
}

export async function updateEmployee(id: string, formData: FormData) {
  const { supabase, profile } = await requireHR();

  const fullName = asText(formData.get("full_name"));
  if (!fullName) {
    redirect(`/dashboard/employees/${id}?error=` + encodeURIComponent("اسم الموظف مطلوب"));
  }

  const payFrequencyRaw = asText(formData.get("pay_frequency"));
  const payFrequency = payFrequencyRaw === "weekly" ? "weekly" : "monthly";

  const result = await serviceUpdate(supabase, profile.company_id, id, {
    full_name: fullName,
    employee_code: asText(formData.get("employee_code")),
    job_title: asText(formData.get("job_title")),
    department: asText(formData.get("department")),
    reports_to: asText(formData.get("reports_to")),
    phone: asText(formData.get("phone")),
    email: asText(formData.get("email")),
    hire_date: asText(formData.get("hire_date")),
    date_of_birth: asText(formData.get("date_of_birth")),
    contract_type: asText(formData.get("contract_type")) ?? "indefinite",
    contract_start: asText(formData.get("contract_start")),
    contract_end: asText(formData.get("contract_end")),
    basic_salary: asNumber(formData.get("basic_salary")),
    housing_allowance: asNumber(formData.get("housing_allowance")),
    transport_allowance: asNumber(formData.get("transport_allowance")),
    other_allowances: asNumber(formData.get("other_allowances")),
    incentive_allowance: asNumber(formData.get("incentive_allowance")),
    pay_frequency: payFrequency,
    national_id: asText(formData.get("national_id")),
    social_insurance_number: asText(formData.get("social_insurance_number")),
    bank_name: asText(formData.get("bank_name")),
    bank_account_number: asText(formData.get("bank_account_number")),
    status: asText(formData.get("status")) ?? "active",
    notes: asText(formData.get("notes")),
  });

  if (!result.success) {
    redirect(`/dashboard/employees/${id}?error=` + encodeURIComponent(result.error));
  }

  revalidatePath("/dashboard/employees");
  bustDashboardCache();
  revalidatePath(`/dashboard/employees/${id}`);
  redirect("/dashboard/employees?updated=1");
}

export async function setEmployeeStatus(employeeId: string, status: string) {
  const { supabase, profile } = await requireHR();

  const result = await serviceSetStatus(supabase, profile.company_id, employeeId, status);
  if (!result.success) {
    redirect(`/dashboard/employees/${employeeId}?error=` + encodeURIComponent(result.error));
  }

  revalidatePath("/dashboard/employees");
  revalidatePath(`/dashboard/employees/${employeeId}`);
  bustDashboardCache();
  redirect(`/dashboard/employees/${employeeId}?status_updated=1`);
}

export async function previewEOSGratuity(
  employeeId: string,
  terminationDate: string,
): Promise<import("@/services/employee.service").EOSBreakdown | null> {
  const { supabase } = await requireHR();
  return servicePreviewEOS(supabase, employeeId, terminationDate);
}

export async function terminateEmployee(formData: FormData) {
  const { supabase, profile } = await requireAdmin();

  const employeeId = String(formData.get("employee_id") ?? "").trim();
  const terminationDate = String(formData.get("termination_date") ?? "").trim();
  const reason = String(formData.get("termination_reason") ?? "").trim();

  if (!employeeId) {
    redirect("/dashboard/employees?error=" + encodeURIComponent("الموظف غير محدد"));
  }
  if (!terminationDate) {
    redirect(`/dashboard/employees/${employeeId}?error=` + encodeURIComponent("تاريخ انتهاء الخدمة مطلوب"));
  }

  const result = await serviceTerminate(supabase, profile.company_id, employeeId, terminationDate, reason);
  if (!result.success) {
    redirect(`/dashboard/employees/${employeeId}?error=` + encodeURIComponent(result.error));
  }

  revalidatePath("/dashboard/employees");
  revalidatePath(`/dashboard/employees/${employeeId}`);
  bustDashboardCache();
  redirect(
    `/dashboard/employees/${employeeId}?terminated=` +
      encodeURIComponent(`${result.data.gratuity_amount}|${result.data.years_of_service}|${result.data.months_owed}`),
  );
}

export async function deleteEmployee(id: string) {
  const { profile, supabase } = await requireAdmin();
  const result = await serviceDelete(supabase, profile.company_id, id);
  if (!result.success) {
    redirect(`/dashboard/employees?error=${encodeURIComponent(result.error)}`);
  }
  revalidatePath("/dashboard/employees");
  bustDashboardCache();
}

export async function deleteAllEmployees(formData: FormData) {
  const { supabase, profile } = await requireAdmin();
  const phrase = String(formData.get("confirm_phrase") ?? "").trim();

  const result = await serviceDeleteAll(supabase, profile.company_id, phrase);
  if (!result.success) {
    redirect("/dashboard/employees?error=" + encodeURIComponent(result.error));
  }

  revalidatePath("/dashboard/employees");
  bustDashboardCache();
  revalidatePath("/dashboard/attendance");
  revalidatePath("/dashboard/payroll");
  redirect("/dashboard/employees?deleted_all=" + encodeURIComponent(String(result.data.count)));
}

export async function generateEmployeeInvitation(id: string) {
  const { supabase } = await requireHR();
  const result = await serviceGenerateInvite(supabase, id);
  if (!result.success) {
    redirect(`/dashboard/employees/${id}?invite_error=` + encodeURIComponent(result.error));
  }

  revalidatePath(`/dashboard/employees/${id}`);
  redirect(`/dashboard/employees/${id}?invite_generated=1`);
}

export async function uploadEmployeeAvatar(formData: FormData) {
  const { supabase, profile } = await requireHR();

  const employeeId = String(formData.get("employee_id") ?? "").trim();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    redirect(`/dashboard/employees/${employeeId}?error=` + encodeURIComponent("اختار صورة الأول"));
  }

  const result = await serviceUploadAvatar(supabase, profile.company_id, employeeId, file);
  if (!result.success) {
    redirect(`/dashboard/employees/${employeeId}?error=` + encodeURIComponent(result.error));
  }

  revalidatePath(`/dashboard/employees/${employeeId}`);
  revalidatePath("/dashboard/employees");
  redirect(`/dashboard/employees/${employeeId}?avatar_updated=1`);
}

export async function removeEmployeeAvatar(formData: FormData) {
  const { supabase, profile } = await requireHR();
  const employeeId = String(formData.get("employee_id") ?? "").trim();

  const result = await serviceRemoveAvatar(supabase, profile.company_id, employeeId);
  if (!result.success) {
    redirect(`/dashboard/employees/${employeeId}?error=` + encodeURIComponent(result.error));
  }

  revalidatePath(`/dashboard/employees/${employeeId}`);
  revalidatePath("/dashboard/employees");
  redirect(`/dashboard/employees/${employeeId}?avatar_removed=1`);
}

export async function uploadEmployeeDocument(formData: FormData) {
  const { supabase, profile } = await requireHR();

  const employeeId = String(formData.get("employee_id") ?? "").trim();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    redirect(`/dashboard/employees/${employeeId}?error=` + encodeURIComponent("اختار ملف الأول"));
  }

  const result = await serviceUploadDoc(supabase, profile.company_id, {
    employeeId,
    docType: String(formData.get("doc_type") ?? "other").trim(),
    displayName: String(formData.get("name") ?? "").trim(),
    expiresAt: String(formData.get("expires_at") ?? "").trim() || null,
    file,
  });
  if (!result.success) {
    redirect(`/dashboard/employees/${employeeId}?error=` + encodeURIComponent(result.error));
  }

  revalidatePath(`/dashboard/employees/${employeeId}`);
  redirect(`/dashboard/employees/${employeeId}?doc_uploaded=1`);
}

export async function deleteEmployeeDocument(formData: FormData) {
  const { supabase, profile } = await requireHR();
  const documentId = String(formData.get("document_id") ?? "").trim();
  const employeeId = String(formData.get("employee_id") ?? "").trim();

  const result = await serviceDeleteDoc(supabase, profile.company_id, documentId, employeeId);
  if (!result.success) {
    redirect("/dashboard/employees?error=" + encodeURIComponent(result.error));
  }

  revalidatePath(`/dashboard/employees/${employeeId}`);
  redirect(`/dashboard/employees/${employeeId}?doc_deleted=1`);
}
