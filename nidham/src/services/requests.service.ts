import type { SupabaseClient } from "@supabase/supabase-js";
import { err, ok, type ActionResult } from "@/lib/result";
import { sendEmail, emailLeaveDecision, emailAdvanceDecision, emailAdvancePaid } from "@/lib/email";
import { LEAVE_TYPE_LABELS_AR, type LeaveType } from "@/lib/requests";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RequestKind = "leave" | "advance" | "permission";

const TABLE_OF: Record<RequestKind, string> = {
  leave: "leave_requests",
  advance: "advance_requests",
  permission: "permission_requests",
};

// ---------------------------------------------------------------------------
// Decide request (approve / reject)
// ---------------------------------------------------------------------------

export async function decideRequest(
  supabase: SupabaseClient,
  companyId: string,
  reviewedBy: string,
  kind: RequestKind,
  id: string,
  decision: "approved" | "rejected",
  hrNotes: string | null,
): Promise<ActionResult> {
  const { error } = await supabase
    .from(TABLE_OF[kind])
    .update({
      status: decision,
      hr_notes: hrNotes,
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewedBy,
    })
    .eq("id", id)
    .eq("company_id", companyId)
    .eq("status", "pending");

  if (error) return err(error.message);

  void notifyDecision(supabase, kind, id, decision, hrNotes);
  return ok(undefined);
}

// ---------------------------------------------------------------------------
// Mark advance as paid
// ---------------------------------------------------------------------------

export async function markAdvancePaid(
  supabase: SupabaseClient,
  companyId: string,
  id: string,
): Promise<ActionResult> {
  await supabase
    .from("advance_requests")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("company_id", companyId)
    .eq("status", "approved");

  void (async () => {
    try {
      const { data } = await supabase
        .from("advance_requests")
        .select(`amount, employees!inner(full_name, email)`)
        .eq("id", id)
        .single<{ amount: number; employees: { full_name: string; email: string | null } }>();
      if (!data?.employees?.email) return;
      await sendEmail(
        emailAdvancePaid({
          to: data.employees.email,
          employeeName: data.employees.full_name,
          amount: Number(data.amount),
        }),
      );
    } catch {
      console.warn("markAdvancePaid email failed");
    }
  })();

  return ok(undefined);
}

// ---------------------------------------------------------------------------
// Notification helper
// ---------------------------------------------------------------------------

async function notifyDecision(
  supabase: SupabaseClient,
  kind: RequestKind,
  id: string,
  decision: "approved" | "rejected",
  hrNotes: string | null,
) {
  try {
    if (kind === "leave") {
      const { data } = await supabase
        .from("leave_requests")
        .select(
          `leave_type, start_date, end_date, days_count,
           employees!inner(full_name, email, user_id)`,
        )
        .eq("id", id)
        .single<{
          leave_type: string;
          start_date: string;
          end_date: string;
          days_count: number;
          employees: { full_name: string; email: string | null; user_id: string | null };
        }>();
      if (!data) return;
      const email = resolveEmail(data.employees);
      if (!email) return;
      await sendEmail(
        emailLeaveDecision({
          to: email,
          employeeName: data.employees.full_name,
          leaveTypeAr: LEAVE_TYPE_LABELS_AR[data.leave_type as LeaveType] ?? data.leave_type,
          startDate: data.start_date,
          endDate: data.end_date,
          daysCount: Number(data.days_count),
          decision,
          hrNotes,
        }),
      );
      return;
    }

    if (kind === "advance") {
      const { data } = await supabase
        .from("advance_requests")
        .select(
          `amount, installments,
           employees!inner(full_name, email, user_id)`,
        )
        .eq("id", id)
        .single<{
          amount: number;
          installments: number;
          employees: { full_name: string; email: string | null; user_id: string | null };
        }>();
      if (!data) return;
      const email = resolveEmail(data.employees);
      if (!email) return;
      await sendEmail(
        emailAdvanceDecision({
          to: email,
          employeeName: data.employees.full_name,
          amount: Number(data.amount),
          installments: data.installments,
          decision,
          hrNotes,
        }),
      );
      return;
    }
  } catch {
    console.warn("notifyDecision failed");
  }
}

function resolveEmail(emp: { email: string | null; user_id: string | null }): string | null {
  if (emp.email && emp.email.includes("@")) return emp.email;
  if (!emp.user_id) return null;
  return null;
}
