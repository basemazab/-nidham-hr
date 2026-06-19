import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyProfile } from "@/lib/permissions";
import {
  appStatusLabel, appStatusColor, aiScoreColor, aiScoreBg,
  RECOMMENDATION_LABELS_AR as recommendationLabel,
  RECOMMENDATION_CLASSES as recommendationClass,
} from "@/lib/recruitment";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function ApplicantDetailPage({ params }: { params: Params }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { profile } = await getMyProfile();
  const companyId = profile?.company_id ?? "";
  const { id } = await params;

  const { data: application } = await supabase
    .from("applications")
    .select("*, candidates(*), jobs(*), stage_history(*)")
    .eq("id", id)
    .eq("company_id", companyId)
    .single();

  if (!application) redirect("/dashboard/recruitment/applicants");

  const app = application as any;
  const candidate = app.candidates;
  const job = app.jobs;
  const stageHistory = (app.stage_history ?? []) as any[];
  const recommendation: string = app.ai_recommendation ?? "";

  function initial(name: string) {
    return (name ?? "?").charAt(0).toUpperCase();
  }

  return (
    <main className="flex-1 px-6 py-8 bg-gradient-to-b from-slate-50 via-white to-cyan-50/30 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="mb-4">
          <Link href="/dashboard/recruitment/applicants" className="text-sm text-slate-500 hover:text-brand-cyan-dark font-cairo">← كل المتقدمين</Link>
        </div>

        <div className="bg-white rounded-xl border border-gray-200/60 shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-cyan to-brand-cyan-dark flex items-center justify-center text-white text-xl font-bold">
                {candidate?.full_name ? initial(candidate.full_name) : "?"}
              </div>
              <div>
                <h1 className="text-2xl font-black font-cairo text-slate-800">{candidate?.full_name ?? "—"}</h1>
                <p className="text-sm text-slate-500">{candidate?.current_title ?? ""}{candidate?.current_company ? ` في ${candidate.current_company}` : ""}</p>
                <div className="flex gap-3 mt-1 text-xs text-slate-400">
                  {candidate?.email && <span>{candidate.email}</span>}
                  {candidate?.phone && <span>{candidate.phone}</span>}
                  {candidate?.location && <span>{candidate.location}</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {app.ai_score !== null && (
                <div className={"px-3 py-1.5 rounded-lg border-2 font-bold text-lg " + aiScoreBg(app.ai_score)}>
                  <span className={aiScoreColor(app.ai_score)}>{app.ai_score}%</span>
                </div>
              )}
              <div className={"px-3 py-1.5 rounded-lg text-sm font-bold " + appStatusColor(app.status)}>
                {appStatusLabel(app.status)}
              </div>
            </div>
          </div>

          {candidate?.skills && candidate.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-gray-100">
              {candidate.skills.map((s: string, i: number) => (
                <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{s}</span>
              ))}
            </div>
          )}
        </div>

        {recommendation && recommendation in recommendationLabel && (
          <div className="bg-white rounded-xl border border-gray-200/60 shadow-sm p-6 mb-6">
            <h2 className="text-lg font-bold font-cairo text-slate-800 mb-3">تحليل AI</h2>
            <div className="flex flex-wrap gap-4 mb-4">
              <div>
                <span className="text-xs text-slate-400 font-cairo">التوصية</span>
                <div className={"px-3 py-1 rounded-lg text-sm font-bold mt-0.5 " + (recommendationClass[recommendation] ?? "")}>
                  {recommendationLabel[recommendation] ?? recommendation}
                </div>
              </div>
            </div>
            {app.ai_summary && <p className="text-sm text-slate-700 mb-3 leading-relaxed">{app.ai_summary}</p>}
            <div className="grid grid-cols-2 gap-4">
              {app.ai_strengths && app.ai_strengths.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-emerald-700 mb-1 font-cairo">نقاط القوة</h3>
                  <ul className="text-xs text-slate-600 space-y-0.5 list-disc list-inside">
                    {app.ai_strengths.map((s: string, i: number) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}
              {app.ai_weaknesses && app.ai_weaknesses.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-red-700 mb-1 font-cairo">نقاط الضعف</h3>
                  <ul className="text-xs text-slate-600 space-y-0.5 list-disc list-inside">
                    {app.ai_weaknesses.map((w: string, i: number) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {stageHistory.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200/60 shadow-sm p-6 mb-6">
            <h2 className="text-lg font-bold font-cairo text-slate-800 mb-3">سجل التقدم</h2>
            <div className="space-y-3">
              {stageHistory.toReversed().map((h: any) => (
                <div key={h.id} className="flex items-start gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-brand-cyan mt-1.5 shrink-0" />
                  <div>
                    <p className="font-bold text-slate-700 font-cairo">
                      {h.from_stage ? `${appStatusLabel(h.from_stage)} ← ` : ""}{appStatusLabel(h.to_stage)}
                    </p>
                    {h.notes && <p className="text-xs text-slate-400 mt-0.5">{h.notes}</p>}
                    <p className="text-[10px] text-slate-300 mt-0.5">{new Date(h.created_at).toLocaleString("ar-EG")}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {job && (
          <div className="bg-white rounded-xl border border-gray-200/60 shadow-sm p-6">
            <h2 className="text-lg font-bold font-cairo text-slate-800 mb-3">الوظيفة المتقدم لها</h2>
            <p className="font-bold text-slate-700">{job.title}</p>
            {job.department && <p className="text-xs text-slate-400">{job.department}</p>}
            <Link href={"/dashboard/recruitment/jobs/" + job.id} className="text-brand-cyan-dark text-xs font-bold hover:underline mt-2 inline-block font-cairo">
              عرض تفاصيل الوظيفة ←
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
