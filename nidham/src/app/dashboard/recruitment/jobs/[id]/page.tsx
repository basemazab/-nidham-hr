import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyProfile } from "@/lib/permissions";
import { jobStatusLabel, jobStatusColor, jobTypeLabel, jobLevelLabel, formatSalary, appStatusLabel, type JobRow, type PipelineStage, type ApplicationWithCandidate } from "@/lib/recruitment";
import { KanbanBoard } from "@/components/recruitment/kanban-board";
import { moveApplicationStage, updateJob } from "../../actions";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ tab?: string; saved?: string; error?: string }>;

export default async function JobDetailPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { profile } = await getMyProfile();
  const companyId = profile?.company_id ?? "";
  const { id } = await params;
  const sp = await searchParams;
  const tab = sp.tab ?? "applicants";

  const { data: job } = await supabase.from("jobs").select("*").eq("id", id).eq("company_id", companyId).single<JobRow>();
  if (!job) redirect("/dashboard/recruitment?error=" + encodeURIComponent("الوظيفة مش موجودة"));

  const { data: stages } = await supabase.from("pipeline_stages").select("*").eq("job_id", id).order("ordinal", { ascending: true }).returns<PipelineStage[]>();
  const pipelineStages = stages ?? [];

  const { data: applications } = await supabase
    .from("applications")
    .select("*, candidates!inner(full_name, email, phone, current_title, current_company, location, avatar, skills)")
    .eq("company_id", companyId)
    .eq("job_id", id)
    .order("applied_at", { ascending: false })
    .returns<ApplicationWithCandidate[]>();

  const appsByStage: Record<string, ApplicationWithCandidate[]> = {};
  for (const app of applications ?? []) {
    const stage = app.status;
    if (!appsByStage[stage]) appsByStage[stage] = [];
    appsByStage[stage].push(app);
  }

  async function handleMoveApplication(appId: string, toStage: string, fromStage: string, notes?: string) {
    "use server";
    const formData = new FormData();
    formData.set("app_id", appId);
    formData.set("to_stage", toStage);
    formData.set("from_stage", fromStage);
    if (notes) formData.set("notes", notes);
    return moveApplicationStage(formData);
  }

  return (
    <main className="flex-1 px-6 py-8 bg-gradient-to-b from-slate-50 via-white to-cyan-50/30 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="mb-4">
          <Link href="/dashboard/recruitment/jobs" className="text-sm text-slate-500 hover:text-brand-cyan-dark font-cairo">← كل الوظائف</Link>
        </div>

        {sp.saved && <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3 mb-4 text-sm font-bold font-cairo">✅ تم الحفظ</div>}
        {sp.error && <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-3 mb-4 text-sm font-bold font-cairo">خطأ: {sp.error}</div>}

        <div className="bg-white rounded-xl border border-gray-200/60 shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-black font-cairo text-slate-800">{job.title}</h1>
                <span className={"px-2.5 py-0.5 rounded-full text-xs font-bold " + jobStatusColor(job.status)}>{jobStatusLabel(job.status)}</span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                {job.department && <span>🏢 {job.department}</span>}
                <span>📋 {jobTypeLabel(job.job_type)}</span>
                {job.level && <span>📊 {jobLevelLabel(job.level)}</span>}
                {job.location && <span>📍 {job.location}{job.remote_ok ? " (عن بعد)" : ""}</span>}
                {(job.salary_min || job.salary_max) && job.is_salary_visible && <span>💰 {formatSalary(job.salary_min, job.salary_max)}</span>}
              </div>
            </div>
            <div className="flex gap-2">
              {job.slug && job.is_public && (
                <Link href={"/jobs/" + job.slug} target="_blank" className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-sm hover:bg-emerald-100 transition font-cairo">
                  عرض الصفحة العامة ↗
                </Link>
              )}
            </div>
          </div>
          <div className="flex gap-6 mt-4 pt-4 border-t border-gray-100">
            <div className="text-center"><div className="text-xl font-black text-slate-800">{(applications ?? []).length}</div><div className="text-[10px] text-slate-400 font-cairo">متقدم</div></div>
            <div className="text-center"><div className="text-xl font-black text-slate-800">{appsByStage["hired"]?.length ?? 0}</div><div className="text-[10px] text-slate-400 font-cairo">تم التعيين</div></div>
            <div className="text-center"><div className="text-xl font-black text-slate-800">{appsByStage["interview"]?.length ?? 0}</div><div className="text-[10px] text-slate-400 font-cairo">مقابلة</div></div>
            <div className="text-center"><div className="text-xl font-black text-slate-800">{appsByStage["rejected"]?.length ?? 0}</div><div className="text-[10px] text-slate-400 font-cairo">مرفوض</div></div>
          </div>
        </div>

        <div className="flex gap-1 mb-6">
          <div className={"px-5 py-2.5 rounded-xl font-bold text-sm cursor-pointer font-cairo " + (tab === "applicants" ? "bg-brand-cyan text-white shadow-sm" : "bg-white text-slate-600 border border-gray-200 hover:bg-slate-50")}>
            <Link href={"/dashboard/recruitment/jobs/" + id + "?tab=applicants"}>المتقدمين</Link>
          </div>
          <div className={"px-5 py-2.5 rounded-xl font-bold text-sm cursor-pointer font-cairo " + (tab === "settings" ? "bg-brand-cyan text-white shadow-sm" : "bg-white text-slate-600 border border-gray-200 hover:bg-slate-50")}>
            <Link href={"/dashboard/recruitment/jobs/" + id + "?tab=settings"}>الإعدادات</Link>
          </div>
        </div>

        {tab === "applicants" && (
          <KanbanBoard
            stages={pipelineStages}
            applicationsByStage={appsByStage}
            jobId={id}
            onMove={handleMoveApplication}
          />
        )}

        {tab === "settings" && (
          <div className="bg-white rounded-xl border border-gray-200/60 shadow-sm p-6">
            <h2 className="text-lg font-bold font-cairo text-slate-800 mb-4">تعديل الوظيفة</h2>
            <form action={updateJob} className="space-y-4 max-w-2xl">
              <input type="hidden" name="id" value={id} />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 font-cairo">المسمى الوظيفي</label>
                  <input name="title" defaultValue={job.title} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20 outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 font-cairo">القسم</label>
                  <input name="department" defaultValue={job.department ?? ""} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 font-cairo">نوع الوظيفة</label>
                  <select name="job_type" defaultValue={job.job_type} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20 outline-none font-cairo">
                    <option value="full_time">دوام كامل</option>
                    <option value="part_time">دوام جزئي</option>
                    <option value="contract">عقد</option>
                    <option value="internship">تدريب</option>
                    <option value="remote">عن بعد</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 font-cairo">المستوى</label>
                  <select name="level" defaultValue={job.level ?? "mid"} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20 outline-none font-cairo">
                    <option value="intern">متدرب</option><option value="entry">مبتدئ</option>
                    <option value="mid">متوسط</option><option value="senior">كبير</option>
                    <option value="lead">قائد فريق</option><option value="manager">مدير</option>
                    <option value="dir">مدير عام</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 font-cairo">الموقع</label>
                  <input name="location" defaultValue={job.location ?? ""} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20 outline-none" />
                </div>
                <div className="flex items-end gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="remote_ok" defaultChecked={job.remote_ok} className="w-4 h-4 rounded border-gray-300 text-brand-cyan focus:ring-brand-cyan/20" />
                    <span className="text-sm text-slate-600 font-cairo">عن بعد</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="is_public" defaultChecked={job.is_public} className="w-4 h-4 rounded border-gray-300 text-brand-cyan focus:ring-brand-cyan/20" />
                    <span className="text-sm text-slate-600 font-cairo">عامة</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="is_salary_visible" defaultChecked={job.is_salary_visible} className="w-4 h-4 rounded border-gray-300 text-brand-cyan focus:ring-brand-cyan/20" />
                    <span className="text-sm text-slate-600 font-cairo">إظهار الراتب</span>
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 font-cairo">الحد الأدنى للراتب</label>
                  <input type="number" name="salary_min" defaultValue={job.salary_min ?? ""} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 font-cairo">الحد الأقصى للراتب</label>
                  <input type="number" name="salary_max" defaultValue={job.salary_max ?? ""} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 font-cairo">الوصف</label>
                <textarea name="description" rows={4} defaultValue={job.description ?? ""} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 font-cairo">المتطلبات</label>
                <textarea name="requirements" rows={4} defaultValue={job.requirements ?? ""} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 font-cairo">المسؤوليات</label>
                <textarea name="responsibilities" rows={4} defaultValue={job.responsibilities ?? ""} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20 outline-none" />
              </div>
              <div className="flex items-center gap-4">
                <label className="block text-sm font-medium text-slate-700 mb-1 font-cairo">الحالة</label>
                <select name="status" defaultValue={job.status} className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20 outline-none font-cairo">
                  <option value="draft">مسودة</option>
                  <option value="open">نشر</option>
                  <option value="closed">إغلاق</option>
                  <option value="filled">تم التعيين</option>
                  <option value="cancelled">إلغاء</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="px-6 py-2.5 rounded-xl bg-gradient-to-l from-brand-cyan to-brand-cyan-dark text-white font-bold text-sm shadow-sm hover:shadow-md transition font-cairo">
                  حفظ التغييرات
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
