import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyProfile } from "@/lib/permissions";
import { formatDate } from "@/lib/format";
import { OnboardingChecklistClient } from "./checklist-client";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

type Employee = {
  id: string;
  full_name: string;
  department: string | null;
  job_title: string | null;
  hire_date: string | null;
  created_at: string | null;
  avatar_url: string | null;
  status: string;
};

export default async function OnboardingChecklistPage({
  params,
}: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { profile } = await getMyProfile();
  const callerCompanyId = profile?.company_id ?? "";

  let employee: Employee | null = null;
  try {
    const { data } = await supabase
      .from("employees")
      .select(
        "id, full_name, department, job_title, hire_date, created_at, avatar_url, status",
      )
      .eq("id", id)
      .eq("company_id", callerCompanyId)
      .single()
      .returns<Employee>();
    employee = data;
  } catch {
    // table may not exist
  }

  if (!employee) notFound();

  const daysSinceJoining = employee.created_at
    ? Math.floor(
        (Date.now() - new Date(employee.created_at).getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : 0;

  return (
    <main className="flex-1 px-4 md:px-6 py-6 bg-gradient-to-b from-slate-50 via-white to-cyan-50/30 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <Link
            href="/dashboard/onboarding"
            className="text-sm text-slate-500 hover:text-brand-cyan-dark font-cairo"
          >
            ← الرجوع للاستقبال والتسكين
          </Link>
        </div>

        {/* Employee Header */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-cyan to-brand-navy flex items-center justify-center text-white text-xl font-black font-cairo shrink-0">
              {employee.full_name?.charAt(0) ?? "?"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="inline-block px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold mb-1 font-cairo">
                🌟 استقبال موظف جديد
              </div>
              <h1 className="text-2xl font-black font-cairo text-slate-800 truncate">
                {employee.full_name}
              </h1>
              <p className="text-sm text-slate-500 font-cairo">
                {employee.job_title ?? "—"} · {employee.department ?? "—"}
              </p>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[10px] text-slate-500 font-cairo">
                تاريخ التعيين
              </div>
              <div className="text-sm font-bold text-slate-800 font-cairo">
                {employee.hire_date
                  ? formatDate(employee.hire_date)
                  : "—"}
              </div>
              <div className="text-[10px] text-cyan-600 font-cairo mt-1">
                منذ {daysSinceJoining} يوم
              </div>
            </div>
          </div>
        </div>

        {/* Checklist — client component */}
        <OnboardingChecklistClient employeeId={employee.id} />
      </div>
    </main>
  );
}
