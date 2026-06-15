import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyProfile } from "@/lib/permissions";
import { appStatusLabel, appStatusColor, aiScoreColor } from "@/lib/recruitment";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ job_id?: string; status?: string }>;

export default async function ApplicantsPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { profile } = await getMyProfile();
  const companyId = profile?.company_id ?? "";
  const params = await searchParams;

  const { data: jobs } = await supabase.from("jobs").select("id, title").eq("company_id", companyId).order("title");
  const jobsList = jobs ?? [];

  let query = supabase.from("applications")
    .select("id, status, ai_score, applied_at, candidates(full_name, email, current_title, avatar), jobs(title)")
    .eq("company_id", companyId)
    .order("applied_at", { ascending: false });

  if (params.job_id && params.job_id !== "all") query = query.eq("job_id", params.job_id);
  if (params.status && params.status !== "all") query = query.eq("status", params.status);

  const { data: applications } = await query;

  const appsList = applications ?? [];

  function initial(name: string) {
    return name.charAt(0).toUpperCase();
  }

  return (
    <main className="flex-1 px-6 py-8 bg-gradient-to-b from-slate-50 via-white to-cyan-50/30 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link href="/dashboard/recruitment" className="text-sm text-slate-500 hover:text-brand-cyan-dark font-cairo">← الرجوع</Link>
          <h1 className="text-3xl font-black font-cairo text-slate-800 mt-1">كل المتقدمين</h1>
        </div>

        <form method="get" className="bg-white rounded-xl border border-gray-200/60 shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-3">
            <select name="job_id" defaultValue={params.job_id ?? "all"} className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20 outline-none font-cairo">
              <option value="all">كل الوظائف</option>
              {jobsList.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
            </select>
            <select name="status" defaultValue={params.status ?? "all"} className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20 outline-none font-cairo">
              <option value="all">كل الحالات</option>
              <option value="new">جديد</option>
              <option value="reviewing">قيد المراجعة</option>
              <option value="shortlisted">مقبول مبدئياً</option>
              <option value="interview">مقابلة</option>
              <option value="offer">عرض عمل</option>
              <option value="hired">تم التعيين</option>
              <option value="rejected">مرفوض</option>
              <option value="withdrawn">منسحب</option>
            </select>
            <button type="submit" className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm font-cairo transition">تصفية</button>
          </div>
        </form>

        <div className="bg-white rounded-xl border border-gray-200/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-slate-50/50 text-right">
                  <th className="py-3 px-4 font-bold text-slate-600 font-cairo">الاسم</th>
                  <th className="py-3 px-4 font-bold text-slate-600 font-cairo">الوظيفة</th>
                  <th className="py-3 px-4 font-bold text-slate-600 font-cairo">AI Score</th>
                  <th className="py-3 px-4 font-bold text-slate-600 font-cairo">الحالة</th>
                  <th className="py-3 px-4 font-bold text-slate-600 font-cairo">تاريخ التقديم</th>
                  <th className="py-3 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {appsList.length === 0 ? (
                  <tr><td colSpan={6} className="py-16 text-center text-slate-400">
                    <div className="text-4xl mb-2">👥</div>
                    <p className="font-cairo">لا يوجد متقدمين</p>
                    <Link href="/dashboard/recruitment/jobs" className="text-brand-cyan-dark font-bold text-sm mt-2 inline-block font-cairo">عرض الوظائف</Link>
                  </td></tr>
                ) : appsList.map((app: any) => (
                  <tr key={app.id} className="border-b border-gray-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-cyan/10 text-brand-cyan-dark flex items-center justify-center font-bold text-sm font-cairo shrink-0">
                          {app.candidates?.full_name ? initial(app.candidates.full_name) : "?"}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 font-cairo">{app.candidates?.full_name ?? "—"}</div>
                          <div className="text-xs text-slate-400">{app.candidates?.current_title ?? ""}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{app.jobs?.title ?? "—"}</td>
                    <td className="py-3 px-4">
                      {app.ai_score !== null ? (
                        <span className={"font-mono font-bold text-sm " + aiScoreColor(app.ai_score)}>{app.ai_score}%</span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={"px-2 py-0.5 rounded-full text-xs font-bold " + appStatusColor(app.status)}>
                        {appStatusLabel(app.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-400">
                      {new Date(app.applied_at).toLocaleDateString("ar-EG")}
                    </td>
                    <td className="py-3 px-4">
                      <Link href={"/dashboard/recruitment/applicants/" + app.id} className="text-brand-cyan-dark text-xs font-bold hover:underline font-cairo">
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
