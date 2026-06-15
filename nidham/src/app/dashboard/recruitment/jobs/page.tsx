import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyProfile } from "@/lib/permissions";
import { jobStatusLabel, jobStatusColor, jobTypeLabel, type JobRow } from "@/lib/recruitment";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ status?: string; department?: string; q?: string }>;

export default async function JobsPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { profile } = await getMyProfile();
  const companyId = profile?.company_id ?? "";
  const params = await searchParams;

  let query = supabase.from("jobs").select("id, title, department, job_type, status, location, salary_min, salary_max, applications_count, posted_at, created_at, slug, is_public").eq("company_id", companyId).order("created_at", { ascending: false });

  if (params.status && params.status !== "all") query = query.eq("status", params.status);
  if (params.department) query = query.eq("department", params.department);

  const { data: rawJobs } = await query;
  const jobsList = (rawJobs ?? []) as Partial<JobRow>[];

  const { data: deps } = await supabase.from("jobs").select("department").eq("company_id", companyId).not("department", "is", null).order("department");
  const departments = [...new Set((deps ?? []).map((d: { department: string | null }) => d.department).filter(Boolean))] as string[];

  return (
    <main className="flex-1 px-6 py-8 bg-gradient-to-b from-slate-50 via-white to-cyan-50/30 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/dashboard/recruitment" className="text-sm text-slate-500 hover:text-brand-cyan-dark font-cairo">← الرجوع</Link>
            <h1 className="text-3xl font-black font-cairo text-slate-800 mt-1">الوظائف</h1>
          </div>
          <Link href="/dashboard/recruitment/jobs/new" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-l from-brand-cyan to-brand-cyan-dark text-white font-bold text-sm shadow-md hover:shadow-lg transition-all font-cairo">
            <span>+</span> وظيفة جديدة
          </Link>
        </div>

        <form method="get" className="bg-white rounded-xl border border-gray-200/60 shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-3">
            <select name="status" defaultValue={params.status ?? "all"} className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20 outline-none font-cairo">
              <option value="all">كل الحالات</option>
              <option value="open">نشطة</option>
              <option value="draft">مسودة</option>
              <option value="closed">مغلقة</option>
              <option value="filled">تم التعيين</option>
            </select>
            <select name="department" defaultValue={params.department ?? ""} className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20 outline-none font-cairo">
              <option value="">كل الأقسام</option>
                    {departments.map((d: string) => <option key={d} value={d!}>{d}</option>)}
            </select>
            <button type="submit" className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm font-cairo transition">تصفية</button>
          </div>
        </form>

        <div className="bg-white rounded-xl border border-gray-200/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-slate-50/50 text-right">
                  <th className="py-3 px-4 font-bold text-slate-600 font-cairo">المسمى الوظيفي</th>
                  <th className="py-3 px-4 font-bold text-slate-600 font-cairo">القسم</th>
                  <th className="py-3 px-4 font-bold text-slate-600 font-cairo">النوع</th>
                  <th className="py-3 px-4 font-bold text-slate-600 font-cairo">المتقدمين</th>
                  <th className="py-3 px-4 font-bold text-slate-600 font-cairo">الحالة</th>
                  <th className="py-3 px-4 font-bold text-slate-600 font-cairo">تاريخ النشر</th>
                  <th className="py-3 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {jobsList.length === 0 ? (
                  <tr><td colSpan={7} className="py-16 text-center text-slate-400">
                    <div className="text-4xl mb-2">📄</div>
                    <p className="font-cairo">لا توجد وظائف</p>
                    <Link href="/dashboard/recruitment/jobs/new" className="text-brand-cyan-dark font-bold text-sm mt-2 inline-block font-cairo">+ أنشئ أول وظيفة</Link>
                  </td></tr>
                ) : jobsList.map((job) => (
                  <tr key={job.id} className="border-b border-gray-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <Link href={"/dashboard/recruitment/jobs/" + job.id} className="font-bold text-slate-800 hover:text-brand-cyan-dark transition-colors">{job.title}</Link>
                      {job.is_public && <span className="mr-2 text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">عام</span>}
                      {job.location && <div className="text-xs text-slate-400 mt-0.5">{job.location}</div>}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{job.department ?? "—"}</td>
                    <td className="py-3 px-4"><span className="text-xs text-slate-500">{jobTypeLabel(job.job_type ?? "full_time")}</span></td>
                    <td className="py-3 px-4"><span className="font-bold text-slate-700">{job.applications_count ?? 0}</span></td>
                    <td className="py-3 px-4">
                      <span className={"px-2 py-0.5 rounded-full text-xs font-bold " + jobStatusColor(job.status ?? "open")}>{jobStatusLabel(job.status ?? "open")}</span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-400">
                      {job.posted_at ? new Date(job.posted_at).toLocaleDateString("ar-EG") : "—"}
                    </td>
                    <td className="py-3 px-4">
                      <Link href={"/dashboard/recruitment/jobs/" + job.id} className="text-brand-cyan-dark text-xs font-bold hover:underline font-cairo">
                        عرض ←
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
