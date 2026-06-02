"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireHR } from "@/lib/permissions";
import { asText, asPositiveNumberOrDefault } from "@/lib/form-helpers";
import {
  createLoan as svcCreateLoan,
  approveLoan as svcApproveLoan,
  recordPayment as svcRecordPayment,
  cancelLoan as svcCancelLoan,
} from "@/services/loans.service";

export async function createLoan(formData: FormData) {
  const { supabase, profile } = await requireHR();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const result = await svcCreateLoan(supabase, profile.company_id, user.id, {
    employeeId: asText(formData.get("employee_id")) ?? "",
    amount: asPositiveNumberOrDefault(formData.get("amount")),
    monthlyInstallment: asPositiveNumberOrDefault(formData.get("monthly_installment")),
    reason: asText(formData.get("reason")),
    status: asText(formData.get("status")) ?? "pending",
  });

  if (!result.success) {
    redirect("/dashboard/loans/new?error=" + encodeURIComponent(result.error));
  }

  revalidatePath("/dashboard/loans");
  redirect("/dashboard/loans?saved=1");
}

export async function approveLoan(formData: FormData) {
  const { supabase, profile } = await requireHR();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const loanId = asText(formData.get("loan_id"));
  if (!loanId) {
    redirect("/dashboard/loans?error=" + encodeURIComponent("رقم السلفة مفقود"));
  }

  const result = await svcApproveLoan(supabase, profile.company_id, user.id, loanId);
  if (!result.success) {
    redirect("/dashboard/loans?error=" + encodeURIComponent(result.error));
  }

  revalidatePath("/dashboard/loans");
  redirect("/dashboard/loans?approved=1");
}

export async function recordPayment(formData: FormData) {
  const { supabase, profile } = await requireHR();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const loanId = asText(formData.get("loan_id"));
  if (!loanId) {
    redirect("/dashboard/loans?error=" + encodeURIComponent("رقم السلفة مفقود"));
  }

  const result = await svcRecordPayment(supabase, profile.company_id, user.id, {
    loanId,
    amount: asPositiveNumberOrDefault(formData.get("amount")),
    paidAt: asText(formData.get("paid_at")),
    notes: asText(formData.get("notes")),
  });

  if (!result.success) {
    redirect("/dashboard/loans?error=" + encodeURIComponent(result.error));
  }

  revalidatePath("/dashboard/loans");
  redirect("/dashboard/loans?payment=1");
}

export async function cancelLoan(formData: FormData) {
  const { supabase, profile } = await requireHR();

  const loanId = asText(formData.get("loan_id"));
  if (!loanId) {
    redirect("/dashboard/loans?error=" + encodeURIComponent("رقم السلفة مفقود"));
  }

  const result = await svcCancelLoan(supabase, profile.company_id, loanId);
  if (!result.success) {
    redirect("/dashboard/loans?error=" + encodeURIComponent(result.error));
  }

  revalidatePath("/dashboard/loans");
  redirect("/dashboard/loans?cancelled=1");
}
