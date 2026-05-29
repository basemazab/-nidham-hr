import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyProfile } from "@/lib/permissions";
import { formatDate } from "@/lib/format";
import { OffboardingChecklistClient } from "./checklist-client";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

type Employee = {
  id: string;
  full_name: string;
  department: string | null;
  job_title: string | null;
  termination_date: string | null;
  termination_reason: string | null;
  hire_date: string | null;
  avatar_url: string | null;
  status: string;
};

export default async function OffboardingChecklistPage({
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
        "id, full_name, department, job_title, termination_date, termination_reason, hire_date, avatar_url, status",
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

  return (
    <main className="flex-1 px-4 md:px-6 py-6 bg-gradient-to-b from-slate-50 via-white to-rose-50/30 min-h-screen">
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
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center text-white text-xl font-black font-cairo shrink-0">
              {employee.full_name?.charAt(0) ?? "?"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="inline-block px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold mb-1 font-cairo">
                🚪 إنهاء خدمة
              </div>
              <h1 className="text-2xl font-black font-cairo text-slate-800 truncate">
                {employee.full_name}
              </h1>
              <p className="text-sm text-slate-500 font-cairo">
                {employee.job_title ?? "—"} · {employee.department ?? "—"}
              </p>
            </div>
            <div className="text-right shrink-0">
              {employee.termination_date && (
                <>
                  <div className="text-[10px] text-slate-500 font-cairo">
                    تاريخ الإنهاء
                  </div>
                  <div className="text-sm font-bold text-slate-800 font-cairo">
                    {formatDate(employee.termination_date)}
                  </div>
                </>
              )}
              {employee.termination_reason && (
                <div className="text-[10px] text-rose-600 font-cairo mt-1">
                  {employee.termination_reason}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Checklist — client component */}
        <OffboardingChecklistClient employeeId={employee.id} />
      </div>
    </main>
  );
}
