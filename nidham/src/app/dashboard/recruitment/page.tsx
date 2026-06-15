import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyProfile } from "@/lib/permissions";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export const dynamic = "force-dynamic";

type Stats = {
  activeJobs: number;
  newApplicants: number;
  interviewsThisWeek: number;
  hireRate: number;
};

type RecentApp = {
  id: string;
  status: string;
  applied_at: string;
  ai_score: number | null;
  candidates: { full_name: string; current_title: string | null };
  jobs: { title: string };
};

export default async function RecruitmentDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { profile } = await getMyProfile();
  const companyId = profile?.company_id ?? "";

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());

  const [jobsRes, appsRes, weekAppsRes, hiredRes, recentRes, appsByJobRes] = await Promise.all([
    supabase.from("jobs").select("id", { count: "exact", head: true }).eq("company_id", companyId).eq("status", "open"),
    supabase.from("applications").select("id", { count: "exact", head: true }).eq("company_id", companyId).eq("status", "new"),
    supabase.from("applications").select("id", { count: "exact", head: true }).eq("company_id", companyId).gte("applied_at", weekStart.toISOString()),
    supabase.from("applications").select("id", { count: "exact", head: true }).eq("company_id", companyId).eq("status", "hired"),
    supabase.from("applications").select("id, status, applied_at, ai_score, candidates(full_name, current_title), jobs(title)").eq("company_id", companyId).order("applied_at", { ascending: false }).limit(10),
    supabase.from("jobs").select("title, applications_count").eq("company_id", companyId).eq("status", "open").order("applications_count", { ascending: false }).limit(10),
  ]);

  const stats: Stats = {
    activeJobs: jobsRes.count ?? 0,
    newApplicants: appsRes.count ?? 0,
    interviewsThisWeek: weekAppsRes.count ?? 0,
    hireRate: (appsRes.count && appsRes.count > 0) ? Math.round(((hiredRes.count ?? 0) / appsRes.count) * 100) : 0,
  };

  const recentApps = (recentRes as { data: RecentApp[] | null })?.data ?? [];
  const appsByJob = appsByJobRes.data ?? [];

  function appStatusBadge(status: string) {
    const colors: Record<string, string> = {
      new: "bg-blue-50 text-blue-700",
      reviewing: "bg-amber-50 text-amber-700",
      shortlisted: "bg-cyan-50 text-cyan-700",
      interview: "bg-purple-50 text-purple-700",
      offer: "bg-emerald-50 text-emerald-700",
      hired: "bg-green-100 text-green-700",
      rejected: "bg-red-50 text-red-700",
    };
    const labels: Record<string, string> = {
      new: "جديد", reviewing: "مراجعة", shortlisted: "مقبول", interview: "مقابلة",
      offer: "عرض", hired: "تم", rejected: "مرفوض",
    };
    return (
      <span className={"px-2 py-0.5 rounded-full text-xs font-bold " + (colors[status] ?? "bg-gray-100 text-gray-600")}>
        {labels[status] ?? status}
      </span>
    );
  }

  function aiScoreBadge(score: number | null) {
    if (score === null) return null;
    const color = score >= 70 ? "text-emerald-600" : score >= 40 ? "text-amber-600" : "text-red-600";
    return <span className={"font-mono font-bold text-sm " + color}>{score}%</span>;
  }

  return (
    <main className="flex-1 px-6 py-8 bg-gradient-to-b from-slate-50 via-white to-cyan-50/30 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-black font-cairo text-slate-800">التوظيف الذكي</h1>
            <p className="text-sm text-slate-500 mt-1">إدارة الوظائف والمتقدمين وفحص السير الذاتية بالذكاء الاصطناعي</p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/recruitment/jobs/new" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-l from-brand-cyan to-brand-cyan-dark text-white font-bold text-sm shadow-md hover:shadow-lg transition-all font-cairo">
              <span>+</span> وظيفة جديدة
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard icon="💼" label="وظائف نشطة" value={stats.activeJobs} color="from-blue-500 to-blue-600" />
          <StatCard icon="👤" label="متقدمين جدد" value={stats.newApplicants} color="from-emerald-500 to-emerald-600" />
          <StatCard icon="📅" label="مقابلات هذا الأسبوع" value={stats.interviewsThisWeek} color="from-amber-500 to-amber-600" />
          <StatCard icon="🎯" label="نسبة التوظيف" value={stats.hireRate + "%"} color="from-purple-500 to-purple-600" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200/60 shadow-sm p-5">
            <h2 className="text-base font-bold font-cairo text-slate-800 mb-4">الوظائف النشطة</h2>
            {appsByJob.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={appsByJob.map(j => ({ name: j.title, عدد: j.applications_count ?? 0 }))} margin={{ top: 5, right: 20, bottom: 50, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13 }} />
                    <Bar dataKey="عدد" fill="#0891b2" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <div className="text-4xl mb-2">📊</div>
                <p className="font-cairo">لا توجد وظائف نشطة بعد</p>
                <Link href="/dashboard/recruitment/jobs/new" className="text-brand-cyan-dark font-bold text-sm mt-2 inline-block font-cairo">+ أنشئ أول وظيفة</Link>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200/60 shadow-sm p-5">
            <h2 className="text-base font-bold font-cairo text-slate-800 mb-4">إجراءات سريعة</h2>
            <div className="space-y-3">
              <Link href="/dashboard/recruitment/jobs/new" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group">
                <div className="w-10 h-10 rounded-lg bg-brand-cyan/10 flex items-center justify-center text-lg group-hover:bg-brand-cyan/20 transition-colors">📝</div>
                <div>
                  <div className="font-bold text-sm text-slate-700 font-cairo">نشر وظيفة جديدة</div>
                  <div className="text-xs text-slate-400">أنشئ وأعلن عن وظيفة</div>
                </div>
              </Link>
              <Link href="/dashboard/jobs/cv-analyzer" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group">
                <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-lg group-hover:bg-purple-100 transition-colors">🤖</div>
                <div>
                  <div className="font-bold text-sm text-slate-700 font-cairo">فحص CV بالـ AI</div>
                  <div className="text-xs text-slate-400">حلل سيرة ذاتية مقابل وظيفة</div>
                </div>
              </Link>
              <Link href="/dashboard/recruitment/jobs" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group">
                <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-lg group-hover:bg-amber-100 transition-colors">📄</div>
                <div>
                  <div className="font-bold text-sm text-slate-700 font-cairo">إدارة الوظائف</div>
                  <div className="text-xs text-slate-400">عرض وتعديل الوظائف</div>
                </div>
              </Link>
              <Link href="/dashboard/recruitment/applicants" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-lg group-hover:bg-emerald-100 transition-colors">👥</div>
                <div>
                  <div className="font-bold text-sm text-slate-700 font-cairo">كل المتقدمين</div>
                  <div className="text-xs text-slate-400">عرض وإدارة المتقدمين</div>
                </div>
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200/60 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold font-cairo text-slate-800">آخر المتقدمين</h2>
            <Link href="/dashboard/recruitment/applicants" className="text-sm text-brand-cyan-dark font-bold font-cairo hover:underline">عرض الكل ←</Link>
          </div>
          {recentApps.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-right">
                    <th className="py-3 px-3 font-bold text-slate-600 font-cairo">الاسم</th>
                    <th className="py-3 px-3 font-bold text-slate-600 font-cairo">الوظيفة</th>
                    <th className="py-3 px-3 font-bold text-slate-600 font-cairo">الحالة</th>
                    <th className="py-3 px-3 font-bold text-slate-600 font-cairo">AI Score</th>
                    <th className="py-3 px-3 font-bold text-slate-600 font-cairo">التاريخ</th>
                    <th className="py-3 px-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {recentApps.map((app) => (
                    <tr key={app.id} className="border-b border-gray-50 hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-800">{app.candidates?.full_name ?? "—"}</div>
                        <div className="text-xs text-slate-400">{app.candidates?.current_title ?? ""}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-600">{app.jobs?.title ?? "—"}</td>
                      <td className="py-3 px-3">{appStatusBadge(app.status)}</td>
                      <td className="py-3 px-3">{aiScoreBadge(app.ai_score)}</td>
                      <td className="py-3 px-3 text-slate-400 text-xs">{new Date(app.applied_at).toLocaleDateString("ar-EG")}</td>
                      <td className="py-3 px-3">
                        <Link href={"/dashboard/recruitment/applicants/" + app.id} className="text-brand-cyan-dark text-xs font-bold hover:underline font-cairo">عرض</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <div className="text-4xl mb-2">👥</div>
              <p className="font-cairo">لا يوجد متقدمين حتى الآن</p>
              <p className="text-xs mt-1">بعد ما تنشر وظيفة وتستقبل طلبات، هتظهر هنا</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string | number; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200/60 shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-3">
        <div className={"w-10 h-10 rounded-lg bg-gradient-to-br " + color + " flex items-center justify-center text-white text-lg shadow-sm"}>
          {icon}
        </div>
      </div>
      <div className="text-2xl font-black font-cairo text-slate-800">{value}</div>
      <div className="text-xs text-slate-500 mt-0.5 font-cairo">{label}</div>
    </div>
  );
}
