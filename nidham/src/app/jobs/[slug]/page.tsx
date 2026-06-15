import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { jobTypeLabel, jobLevelLabel, formatSalary } from "@/lib/recruitment";
import { submitApplication } from "../../dashboard/recruitment/actions";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ applied?: string; error?: string }>;
};

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
  slug: string;
  posted_at: string | null;
  description: string | null;
  requirements: string | null;
  responsibilities: string | null;
  benefits: string | null;
};

type Company = { name: string; industry: string | null };

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: job } = await supabase
    .from("public_jobs")
    .select("title, department, location")
    .eq("slug", slug)
    .single<{ title: string; department: string | null; location: string | null }>();

  if (!job) return { title: "وظيفة — نِظام" };
  const parts = [job.title, job.department, job.location].filter(Boolean);
  return {
    title: `${parts.join(" · ")} — نِظام`,
    description: `قدم على وظيفة ${job.title} من خلال منصة نِظام`,
  };
}

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
  return `منذ ${Math.floor(days / 30)} شهر`;
}

export default async function PublicJobDetailPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { applied, error } = await searchParams;

  const supabase = await createClient();

  const { data: job } = await supabase
    .from("public_jobs")
    .select("*")
    .eq("slug", slug)
    .single<PublicJob>();

  if (!job) notFound();

  const { data: company } = await supabase
    .from("companies")
    .select("name, industry")
    .eq("id", job.company_id)
    .single<Company>();

  const salary = job.is_salary_visible ? formatSalary(job.salary_min, job.salary_max) : null;

  const tabs = [
    { key: "description", label: "الوصف", content: job.description },
    { key: "requirements", label: "المتطلبات", content: job.requirements },
    { key: "responsibilities", label: "المسؤوليات", content: job.responsibilities },
    { key: "benefits", label: "الفوائد", content: job.benefits },
  ];

  const sidebarInfo = [
    { label: "الموقع", value: job.location ?? "—" },
    { label: "نوع الوظيفة", value: jobTypeLabel(job.job_type as any) },
    { label: "المستوى", value: jobLevelLabel(job.level as any) },
    { label: "سنين الخبرة", value: job.experience_years_min ? `${job.experience_years_min}+` : "—" },
    { label: "تاريخ النشر", value: timeAgo(job.posted_at) },
  ];

  return (
    <div className="bg-gradient-to-b from-slate-50 via-white to-cyan-50/30 min-h-[calc(100vh-65px)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <nav className="mb-6 text-sm font-cairo text-slate-500">
          <Link href="/jobs" className="hover:text-brand-cyan-dark transition">الوظائف</Link>
          <span className="mx-2">/</span>
          <span className="text-slate-800 font-semibold">{job.title}</span>
        </nav>

        {applied && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-cairo text-sm">
            ✅ تم استلام طلبك بنجاح! سنتواصل معك قريباً.
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 font-cairo text-sm">
            ❌ {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-6 sm:p-8">
              <h1 className="text-2xl sm:text-3xl font-black font-cairo text-slate-800 mb-2 leading-tight">
                {job.title}
              </h1>
              <p className="text-sm sm:text-base text-slate-600 font-cairo">
                {company?.name ?? "—"}
                {company?.industry && <span className="text-slate-400"> · {company.industry}</span>}
              </p>

              <div className="flex flex-wrap gap-2 mt-4 text-xs font-cairo">
                <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">{jobTypeLabel(job.job_type as any)}</span>
                {job.level && <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">{jobLevelLabel(job.level as any)}</span>}
                {job.location && <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">{job.location}</span>}
                {job.remote_ok && <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700">عن بعد</span>}
                {salary && <span className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 font-bold">{salary}</span>}
              </div>

              <p className="mt-4 text-xs text-slate-400 font-cairo">تم النشر {timeAgo(job.posted_at)}</p>
            </div>

            {tabs.filter((t) => t.content).map((tab) => (
              <div key={tab.key} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h2 className="text-lg font-bold font-cairo text-slate-800 mb-3">{tab.label}</h2>
                <div className="text-sm sm:text-base text-slate-700 font-cairo whitespace-pre-line leading-relaxed">
                  {tab.content}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <h3 className="text-sm font-bold font-cairo text-slate-800 mb-3">معلومات سريعة</h3>
              <div className="space-y-3">
                {sidebarInfo.map((info) => (
                  <div key={info.label}>
                    <p className="text-xs text-slate-400 font-cairo">{info.label}</p>
                    <p className="text-sm font-semibold text-slate-700 font-cairo">{info.value}</p>
                  </div>
                ))}
              </div>
            </div>
            <a
              href="#apply-form"
              className="block w-full text-center px-4 py-3 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-cyan-dark text-white font-bold shadow-md hover:shadow-lg transition font-cairo"
            >
              تقدم للوظيفة
            </a>
          </div>
        </div>

        <div id="apply-form" className="mt-8 bg-white rounded-2xl shadow-md border border-slate-100 p-6 sm:p-8 max-w-2xl">
          <h2 className="text-xl font-black font-cairo text-slate-800 mb-6">تقدم للوظيفة</h2>
          <form action={submitApplication} className="space-y-4">
            <input type="hidden" name="job_slug" value={slug} />

            <div>
              <label className="block text-sm font-bold font-cairo text-slate-700 mb-1">
                الاسم <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="full_name"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-cairo text-sm focus:outline-none focus:ring-2 focus:ring-brand-cyan/40"
              />
            </div>

            <div>
              <label className="block text-sm font-bold font-cairo text-slate-700 mb-1">
                الإيميل <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-cairo text-sm focus:outline-none focus:ring-2 focus:ring-brand-cyan/40"
              />
            </div>

            <div>
              <label className="block text-sm font-bold font-cairo text-slate-700 mb-1">رقم التليفون</label>
              <input
                type="tel"
                name="phone"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-cairo text-sm focus:outline-none focus:ring-2 focus:ring-brand-cyan/40"
              />
            </div>

            <div>
              <label className="block text-sm font-bold font-cairo text-slate-700 mb-1">نص الـ CV</label>
              <textarea
                name="cv_text"
                rows={5}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-cairo text-sm focus:outline-none focus:ring-2 focus:ring-brand-cyan/40 resize-y"
              />
            </div>

            <div>
              <label className="block text-sm font-bold font-cairo text-slate-700 mb-1">رسالة التقديم</label>
              <textarea
                name="cover_letter"
                rows={4}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-cairo text-sm focus:outline-none focus:ring-2 focus:ring-brand-cyan/40 resize-y"
              />
            </div>

            <button
              type="submit"
              className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-cyan-dark text-white font-bold shadow-md hover:shadow-lg transition font-cairo"
            >
              إرسال الطلب
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
