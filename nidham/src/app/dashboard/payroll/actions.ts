"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, requireHR } from "@/lib/permissions";
import { bustDashboardCache } from "@/lib/cache";
import { asText, asNumber } from "@/lib/form-helpers";
import {
  generatePayrollPeriod as svcGenerate,
  regeneratePeriodEntries as svcRegenerate,
  updatePayrollEntry as svcUpdateEntry,
  approvePayrollPeriod as svcApprove,
  markPayrollAsPaid as svcMarkPaid,
  deletePayrollPeriod as svcDelete,
  rollbackPayrollToDraft as svcRollback,
  cancelPayrollPeriod as svcCancel,
  reopenPayrollPeriod as svcReopen,
  simulatePayrollRun as svcSimulate,
  applyBulkBonus as svcBulkBonus,
} from "@/services/payroll.service";

// ---------------------------------------------------------------------------
// Generate
// ---------------------------------------------------------------------------

export async function generatePayrollPeriod(formData: FormData) {
  const { supabase, profile } = await requireHR();

  const frequency = (asText(formData.get("frequency")) ?? "monthly") as "monthly" | "weekly";
  let startDate = asText(formData.get("start_date"));
  let endDate = asText(formData.get("end_date"));

  const yearRaw = asText(formData.get("year"));
  const monthRaw = asText(formData.get("month"));
  if (!startDate && yearRaw && monthRaw) {
    const y = parseInt(yearRaw, 10);
    const m = parseInt(monthRaw, 10);
    if (Number.isFinite(y) && Number.isFinite(m) && m >= 1 && m <= 12) {
      startDate = `${y}-${String(m).padStart(2, "0")}-01`;
      const lastDay = new Date(y, m, 0).getDate();
      endDate = `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    }
  }

  if (!startDate || !endDate) {
    redirect("/dashboard/payroll/new?error=" + encodeURIComponent("تاريخ البداية والنهاية مطلوبين"));
  }

  const workingDays = parseInt(asText(formData.get("working_days")) ?? "26", 10);

  const result = await svcGenerate(supabase, profile.company_id, { frequency, startDate, endDate, workingDays });
  if (!result.success) {
    redirect("/dashboard/payroll/new?error=" + encodeURIComponent(result.error));
  }

  revalidatePath("/dashboard/payroll");
  bustDashboardCache();
  redirect(`/dashboard/payroll/${result.data.periodId}`);
}

// ---------------------------------------------------------------------------
// Update entry
// ---------------------------------------------------------------------------

export async function updatePayrollEntry(entryId: string, formData: FormData) {
  const { supabase, profile } = await requireHR();

  const result = await svcUpdateEntry(supabase, profile.company_id, entryId, formData);
  if (!result.success) {
    redirect(`/dashboard/payroll?error=${encodeURIComponent(result.error)}`);
  }

  revalidatePath(`/dashboard/payroll/${(result.data as any).periodId}`);
  redirect(`/dashboard/payroll/${(result.data as any).periodId}`);
}

// ---------------------------------------------------------------------------
// Approve
// ---------------------------------------------------------------------------

export async function approvePayrollPeriod(periodId: string) {
  const { supabase, profile } = await requireAdmin();

  const result = await svcApprove(supabase, profile.company_id, profile.id, periodId);
  if (!result.success) {
    redirect(`/dashboard/payroll/${periodId}?error=` + encodeURIComponent(result.error));
  }

  revalidatePath(`/dashboard/payroll/${periodId}`);
}

// ---------------------------------------------------------------------------
// Mark paid
// ---------------------------------------------------------------------------

export async function markPayrollAsPaid(periodId: string) {
  const { supabase, profile } = await requireAdmin();

  const result = await svcMarkPaid(supabase, profile.company_id, periodId);
  if (!result.success) {
    redirect(`/dashboard/payroll/${periodId}?error=` + encodeURIComponent(result.error));
  }

  revalidatePath(`/dashboard/payroll/${periodId}`);
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

export async function deletePayrollPeriod(periodId: string) {
  const { supabase, profile } = await requireAdmin();
  await svcDelete(supabase, profile.company_id, periodId);
  revalidatePath("/dashboard/payroll");
  bustDashboardCache();
  redirect("/dashboard/payroll");
}

// ---------------------------------------------------------------------------
// Rollback to draft
// ---------------------------------------------------------------------------

export async function rollbackPayrollToDraft(periodId: string) {
  const { supabase, profile } = await requireAdmin();

  const result = await svcRollback(supabase, profile.company_id, periodId);
  if (!result.success) {
    redirect(`/dashboard/payroll/${periodId}?error=` + encodeURIComponent(result.error));
  }

  revalidatePath(`/dashboard/payroll/${periodId}`);
  bustDashboardCache();
}

// ---------------------------------------------------------------------------
// Simulate
// ---------------------------------------------------------------------------

export async function simulatePayrollRun(periodId: string) {
  const { supabase, profile } = await requireHR();
  return svcSimulate(supabase, profile.company_id, periodId);
}

// ---------------------------------------------------------------------------
// Regenerate
// ---------------------------------------------------------------------------

export async function regeneratePeriodEntries(formData: FormData) {
  const { supabase, profile } = await requireHR();

  const periodId = String(formData.get("period_id") ?? "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(periodId)) redirect("/dashboard/payroll");

  const result = await svcRegenerate(supabase, profile.company_id, periodId);
  if (!result.success) {
    redirect(`/dashboard/payroll/${periodId}?error=` + encodeURIComponent(result.error));
  }

  revalidatePath(`/dashboard/payroll/${periodId}`);
  revalidatePath("/dashboard/payroll");
  bustDashboardCache();
  redirect(`/dashboard/payroll/${periodId}?regenerated=${result.data.count}`);
}

// ---------------------------------------------------------------------------
// Cancel
// ---------------------------------------------------------------------------

export async function cancelPayrollPeriod(formData: FormData) {
  const { supabase, profile } = await requireAdmin();

  const periodId = String(formData.get("period_id") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  const confirm = String(formData.get("confirm") ?? "").trim();

  if (!/^[0-9a-f-]{36}$/i.test(periodId)) redirect("/dashboard/payroll");

  const result = await svcCancel(supabase, profile.company_id, profile.id, periodId, reason, confirm);
  if (!result.success) {
    redirect(`/dashboard/payroll/${periodId}?error=` + encodeURIComponent(result.error));
  }

  revalidatePath(`/dashboard/payroll/${periodId}`);
  revalidatePath("/dashboard/payroll");
  bustDashboardCache();
  redirect(`/dashboard/payroll/${periodId}?cancelled=1`);
}

// ---------------------------------------------------------------------------
// Reopen
// ---------------------------------------------------------------------------

export async function reopenPayrollPeriod(formData: FormData) {
  const { supabase, profile } = await requireAdmin();

  const periodId = String(formData.get("period_id") ?? "").trim();
  const confirm = String(formData.get("confirm") ?? "").trim();

  if (!/^[0-9a-f-]{36}$/i.test(periodId)) redirect("/dashboard/payroll");

  const result = await svcReopen(supabase, profile.company_id, profile.id, periodId, confirm);
  if (!result.success) {
    redirect(`/dashboard/payroll/${periodId}?error=` + encodeURIComponent(result.error));
  }

  revalidatePath(`/dashboard/payroll/${periodId}`);
  revalidatePath("/dashboard/payroll");
  bustDashboardCache();
  redirect(`/dashboard/payroll/${periodId}?reopened=${result.data.nextStatus}`);
}

// ---------------------------------------------------------------------------
// Bulk bonus
// ---------------------------------------------------------------------------

export async function applyBulkBonus(formData: FormData) {
  const { supabase, profile } = await requireHR();

  const periodId = String(formData.get("period_id") ?? "").trim();
  const amount = parseFloat(String(formData.get("amount_each") ?? "0"));
  const reason = String(formData.get("reason") ?? "").trim();
  const recipientsRaw = String(formData.get("recipients") ?? "").trim();

  if (!/^[0-9a-f-]{36}$/i.test(periodId)) redirect("/dashboard/payroll");
  if (!Number.isFinite(amount) || amount <= 0) {
    redirect(`/dashboard/payroll/${periodId}/bulk-bonus?error=` + encodeURIComponent("المبلغ لازم يكون أكبر من صفر"));
  }
  if (reason.length < 3) {
    redirect(`/dashboard/payroll/${periodId}/bulk-bonus?error=` + encodeURIComponent("اكتب سبب المكافأة (مثلاً: عيدية الفطر)"));
  }

  const result = await svcBulkBonus(supabase, profile.company_id, profile.id, periodId, amount, reason, recipientsRaw);
  if (!result.success) {
    redirect(`/dashboard/payroll/${periodId}/bulk-bonus?error=` + encodeURIComponent(result.error));
  }

  revalidatePath(`/dashboard/payroll/${periodId}`);
  redirect(`/dashboard/payroll/${periodId}?bulk_bonus=${(result.data as any).appliedCount}`);
}
