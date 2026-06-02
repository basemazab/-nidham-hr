import type { SupabaseClient } from "@supabase/supabase-js";
import { err, ok, type ActionResult } from "@/lib/result";

export type CreateLoanParams = {
  employeeId: string;
  amount: number;
  monthlyInstallment: number;
  reason: string | null;
  status: string;
};

export async function createLoan(
  supabase: SupabaseClient,
  companyId: string,
  userId: string,
  params: CreateLoanParams,
): Promise<ActionResult> {
  const { employeeId, amount, monthlyInstallment, reason, status } = params;

  if (!employeeId) return err("اختار الموظف الأول");
  if (amount <= 0) return err("قيمة السلفة لازم تكون أكبر من صفر");
  if (monthlyInstallment <= 0) return err("القسط الشهري لازم يكون أكبر من صفر");
  if (monthlyInstallment > amount) return err("القسط الشهري ما يصحش يكون أكبر من قيمة السلفة");
  if (!["pending", "approved", "active"].includes(status)) return err("حالة غير صحيحة");

  const { data: emp } = await supabase
    .from("employees")
    .select("id, company_id")
    .eq("id", employeeId)
    .eq("company_id", companyId)
    .maybeSingle<{ id: string; company_id: string }>();
  if (!emp) return err("الموظف ده مش موجود");

  const { error } = await supabase.from("employee_loans").insert({
    company_id: companyId,
    employee_id: employeeId,
    amount,
    monthly_installment: monthlyInstallment,
    remaining_amount: amount,
    reason,
    status,
    approved_at: status !== "pending" ? new Date().toISOString() : null,
    approved_by: status !== "pending" ? userId : null,
    created_by: userId,
  });

  if (error) return err(error.message);
  return ok(undefined);
}

export async function approveLoan(
  supabase: SupabaseClient,
  companyId: string,
  userId: string,
  loanId: string,
): Promise<ActionResult> {
  if (!loanId) return err("رقم السلفة مفقود");

  const { error } = await supabase
    .from("employee_loans")
    .update({
      status: "active",
      approved_at: new Date().toISOString(),
      approved_by: userId,
    })
    .eq("id", loanId)
    .eq("company_id", companyId)
    .eq("status", "pending");

  if (error) return err(error.message);
  return ok(undefined);
}

export type RecordPaymentParams = {
  loanId: string;
  amount: number;
  paidAt: string | null;
  notes: string | null;
};

export async function recordPayment(
  supabase: SupabaseClient,
  companyId: string,
  userId: string,
  params: RecordPaymentParams,
): Promise<ActionResult> {
  const { loanId, amount, paidAt, notes } = params;

  if (!loanId) return err("رقم السلفة مفقود");
  if (amount <= 0) return err("قيمة الدفعة مطلوبة");

  const { data: loan } = await supabase
    .from("employee_loans")
    .select("id, remaining_amount, status")
    .eq("id", loanId)
    .eq("company_id", companyId)
    .maybeSingle<{ id: string; remaining_amount: number; status: string }>();

  if (!loan) return err("السلفة دي مش موجودة");
  if (loan.status === "cancelled") return err("مش تقدر تسجل دفعة على سلفة ملغية");
  if (amount > Number(loan.remaining_amount)) {
    return err(`قيمة الدفعة أكبر من الرصيد المتبقي (${Number(loan.remaining_amount).toLocaleString("ar-EG")} ج)`);
  }

  const { error } = await supabase.from("employee_loan_payments").insert({
    loan_id: loanId,
    amount,
    paid_at: paidAt ?? new Date().toISOString().split("T")[0],
    notes,
    created_by: userId,
  });

  if (error) return err(error.message);
  return ok(undefined);
}

export async function cancelLoan(
  supabase: SupabaseClient,
  companyId: string,
  loanId: string,
): Promise<ActionResult> {
  if (!loanId) return err("رقم السلفة مفقود");

  const { count: paymentCount } = await supabase
    .from("employee_loan_payments")
    .select("id", { count: "exact", head: true })
    .eq("loan_id", loanId);

  if ((paymentCount ?? 0) > 0) {
    return err("مش تقدر تلغي سلفة فيها دفعات. عدّل القيم أو ادفع المتبقي.");
  }

  const { error } = await supabase
    .from("employee_loans")
    .update({ status: "cancelled" })
    .eq("id", loanId)
    .eq("company_id", companyId)
    .neq("status", "paid");

  if (error) return err(error.message);
  return ok(undefined);
}
