"use client";

import { useState, useOptimistic, startTransition } from "react";
import { useRouter } from "next/navigation";
import { AiScoreBadge } from "./ai-score-badge";
import { appStatusLabel, type PipelineStage, type AppStatus, type ApplicationWithCandidate } from "@/lib/recruitment";

interface Props {
  stages: PipelineStage[];
  applicationsByStage: Record<string, ApplicationWithCandidate[]>;
  jobId: string;
  onMove: (appId: string, toStage: string, fromStage: string, notes?: string) => Promise<{ ok?: boolean; error?: string }>;
}

const stageKeyMap: Record<string, string> = {
  "جديد": "new", "فحص أولي": "reviewing", "مقابلة": "interview", "عرض عمل": "offer", "تم التعيين": "hired",
  "new": "new", "reviewing": "reviewing", "shortlisted": "shortlisted", "interview": "interview", "offer": "offer", "hired": "hired", "rejected": "rejected", "withdrawn": "withdrawn",
};

const reverseStageMap: Record<string, string> = {
  new: "جديد", reviewing: "فحص أولي", shortlisted: "مقبول", interview: "مقابلة", offer: "عرض عمل", hired: "تم التعيين", rejected: "مرفوض", withdrawn: "منسحب",
};

export function KanbanBoard({ stages, applicationsByStage, jobId, onMove }: Props) {
  const router = useRouter();
  const [movingId, setMovingId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  async function handleMove(appId: string, toStage: string, currentStage: string) {
    setMovingId(appId);
    const result = await onMove(appId, stageKeyMap[toStage] ?? toStage, stageKeyMap[currentStage] ?? currentStage, notes || undefined);
    setMovingId(null);
    setNotes("");
    if (result.ok) router.refresh();
  }

  function getStageApplications(stageName: string): ApplicationWithCandidate[] {
    const key = stageKeyMap[stageName] ?? stageName;
    return applicationsByStage[key] ?? [];
  }

  const stageColors = ["from-blue-500 to-blue-600", "from-amber-500 to-amber-600", "from-purple-500 to-purple-600", "from-emerald-500 to-emerald-600", "from-green-600 to-green-700"];

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-[400px]">
      {stages.map((stage, si) => {
        const apps = getStageApplications(stage.name);
        return (
          <div key={stage.id} className="flex-shrink-0 w-72">
            <div className={"bg-gradient-to-r " + (stageColors[si] ?? "from-gray-500 to-gray-600") + " rounded-t-xl px-4 py-3"}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white font-cairo">{stage.name}</h3>
                <span className="text-[10px] text-white/80 font-bold">{apps.length}</span>
              </div>
            </div>
            <div className="bg-gray-50/80 min-h-[350px] p-3 rounded-b-xl space-y-3 border-x border-b border-gray-200/60">
              {apps.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-xs font-cairo">لا يوجد متقدمين</div>
              ) : apps.map((app) => {
                const candidate = app.candidates;
                return (
                  <div key={app.id} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-cyan to-brand-cyan-dark flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {candidate?.full_name?.[0] ?? "?"}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-slate-800 truncate">{candidate?.full_name ?? "—"}</div>
                          <div className="text-[10px] text-slate-400 truncate">{candidate?.current_title ?? ""}</div>
                        </div>
                      </div>
                      <AiScoreBadge score={app.ai_score} size={36} />
                    </div>
                    {candidate?.skills && candidate.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {candidate.skills.slice(0, 4).map((s, i) => (
                          <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{s}</span>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-1 mt-2 pt-2 border-t border-gray-100">
                      {si < stages.length - 1 && (
                        <button onClick={() => handleMove(app.id, stages[si + 1].name, stage.name)}
                          disabled={movingId === app.id}
                          className="flex-1 text-[10px] py-1.5 rounded-md bg-brand-cyan/10 text-brand-cyan-dark font-bold hover:bg-brand-cyan/20 transition disabled:opacity-50 font-cairo">
                          ← {movingId === app.id ? "..." : stages[si + 1].name}
                        </button>
                      )}
                      {si > 0 && (
                        <button onClick={() => handleMove(app.id, stages[si - 1].name, stage.name)}
                          disabled={movingId === app.id}
                          className="flex-1 text-[10px] py-1.5 rounded-md bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition disabled:opacity-50 font-cairo">
                          → رجوع
                        </button>
                      )}
                      <button onClick={() => handleMove(app.id, "rejected", stage.name)}
                        disabled={movingId === app.id}
                        className="text-[10px] py-1.5 px-2 rounded-md bg-red-50 text-red-600 font-bold hover:bg-red-100 transition disabled:opacity-50">
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
