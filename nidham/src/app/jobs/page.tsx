import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { jobTypeLabel, jobLevelLabel, formatSalary, JOB_TYPES, JOB_LEVELS } from "@/lib/recruitment";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "الوظائف | نِظام HR",
};

type SearchParams = Promise<{ q?: string; job_type?: string; level?: string; location?: string }>;
type Props = { searchParams: SearchParams };

type PublicJob = {
  id: string;
  title: string;
  department: string | null;
  company_id: string;
  job_type: string;
  level: string | null;
  location: string | null;
  remote_ok: boolean;
  salary_min: number | null;
  salary_max: number | null;
  is_salary_visible: boolean;
  experience_years_min: number | null;
  slug: string | null;
  posted_at: string | null;
  description: string | null;
};

type Company = { id: string; name: string };

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "منذ لحظات";
  if (mins < 60) return `منذ ${mins} دقيقة`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `منذ ${hrs} ساعة`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "أمس";
  if (days < 30) return `منذ ${days} يوم`;
  const months = Math.floor(days / 30);
  if (months < 12) return `منذ ${months} شهر`;
  return `منذ ${Math.floor(months / 12)} سنة`;
}

export default async function PublicJobsPage({ searchParams }: Props) {
  const { q, job_type, level, location } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("public_jobs")
    .select("id, title, department, company_id, job_type, level, location, remote_ok, salary_min, salary_max, is_salary_visible, experience_years_min, slug, posted_at, description")
    .order("posted_at", { ascending: false });

  if (job_type) query = query.eq("job_type", job_type);
  if (level) query = query.eq("level", level);
  if (location) query = query.ilike("location", `%${location}%`);

  const { data: jobsData } = await query;
  const jobs = (jobsData ?? []) as PublicJob[];

  const filtered = q
    ? jobs.filter((j) => j.title.toLowerCase().includes(q.toLowerCase()) || (j.description ?? "").toLowerCase().includes(q.toLowerCase()))
    : jobs;

  const companyIds = [...new Set(filtered.map((j) => j.company_id))];
  const companyMap = new Map<string, string>();
  if (companyIds.length > 0) {
    const { data: companies } = await supabase.from("companies").select("id, name").in("id", companyIds).returns<Company[]>();
    for (const c of companies ?? []) companyMap.set(c.id, c.name);
  }

  const { data: locationRows } = await supabase.from("public_jobs").select("location").not("location", "is", null);
  const allLocations = [...new Set((locationRows ?? []).map((r) => r.location))] as string[];

  return (
    <div className="bg-gradient-to-b from-slate-50 via-white to-cyan-50/30 min-h-[calc(100vh-65px)]">
      <section className="bg-gradient-to-l from-brand-navy via-brand-navy-light to-brand-navy text-white py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-black font-cairo mb-3">وظائف في نِظام</h1>
          <p className="text-cyan-100 font-cairo text-lg max-w-xl mx-auto">اكتشف فرصتك القادمة</p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 -mt-6 mb-8">
        <form method="GET" className="bg-white rounded-2xl shadow-lg border border-slate-100 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              name="q"
              defaultValue={q ?? ""}
              placeholder="ابحث عن وظيفة..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 font-cairo text-sm focus:outline-none focus:ring-2 focus:ring-brand-cyan/40"
            />
            <select
              name="job_type"
              defaultValue={job_type ?? ""}
              className="px-4 py-2.5 rounded-xl border border-slate-200 font-cairo text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/40"
            >
              <option value="">كل الأنواع</option>
              {JOB_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <select
              name="level"
              defaultValue={level ?? ""}
              className="px-4 py-2.5 rounded-xl border border-slate-200 font-cairo text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/40"
            >
              <option value="">كل المستويات</option>
              {JOB_LEVELS.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-cyan-dark text-white font-bold font-cairo text-sm hover:shadow-lg transition"
            >
              بحث
            </button>
          </div>
        </form>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-12">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="text-xl font-black font-cairo text-slate-800">
            {filtered.length > 0 ? "الوظائف المتاحة" : "لا توجد نتائج"}
            <span className="text-sm font-normal text-slate-400 mr-2">({filtered.length})</span>
          </h2>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-16 text-center">
            <div className="text-5xl mb-3">📭</div>
            <h3 className="text-lg font-bold font-cairo text-slate-700 mb-2">مفيش وظائف مطابقة</h3>
            <p className="text-slate-500 font-cairo text-sm">جرب تغيير فلتر البحث أو ارجع تاني قريب.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((j) => {
              const company = companyMap.get(j.company_id) ?? "—";
              const salary = j.is_salary_visible ? formatSalary(j.salary_min, j.salary_max) : null;
              return (
                <Link
                  key={j.id}
                  href={`/jobs/${j.slug}`}
                  className="block bg-white rounded-2xl border border-slate-200 p-5 hover:border-brand-cyan/40 hover:shadow-lg hover:-translate-y-0.5 transition-all group"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <h3 className="text-base font-bold font-cairo text-slate-800 group-hover:text-brand-cyan-dark transition leading-tight line-clamp-2">
                        {j.title}
                      </h3>
                      <p className="text-sm text-slate-500 font-cairo mt-1">{company}</p>
                    </div>
                    <span className="shrink-0 text-[10px] text-slate-400 font-cairo">{timeAgo(j.posted_at)}</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-3 text-xs font-cairo">
                    {j.location && <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-700">{j.location}</span>}
                    <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-700">{jobTypeLabel(j.job_type as any)}</span>
                    {j.level && <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-700">{jobLevelLabel(j.level as any)}</span>}
                    {salary && <span className="px-2 py-1 rounded-md bg-amber-50 text-amber-800">{salary}</span>}
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 text-left">
                    <span className="text-xs font-bold text-brand-cyan-dark group-hover:underline">تقديم ←</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
