"use client";

import type { StageHistory } from "@/lib/recruitment";

const stageLabels: Record<string, string> = {
  new: "جديد", reviewing: "قيد المراجعة", shortlisted: "مقبول مبدئياً",
  interview: "مقابلة", offer: "عرض عمل", hired: "تم التعيين",
  rejected: "مرفوض", withdrawn: "منسحب",
};

const stageIcons: Record<string, string> = {
  new: "📥", reviewing: "🔍", shortlisted: "✅",
  interview: "🤝", offer: "📄", hired: "🎉",
  rejected: "❌", withdrawn: "🚫",
};

export function PipelineTimeline({ history, currentStage }: { history: StageHistory[]; currentStage: string }) {
  if (history.length === 0) return (
    <div className="text-center py-8 text-slate-400">
      <p className="font-cairo text-sm">لا يوجد تاريخ حركة بعد</p>
    </div>
  );

  return (
    <div className="space-y-0">
      {history.map((h, i) => {
        const isCurrent = h.to_stage === currentStage && i === history.length - 1;
        const fromLabel = h.from_stage ? (stageLabels[h.from_stage] ?? h.from_stage) : null;
        const toLabel = stageLabels[h.to_stage] ?? h.to_stage;
        const icon = stageIcons[h.to_stage] ?? "•";

        return (
          <div key={h.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={"w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 " +
                (isCurrent ? "border-brand-cyan bg-brand-cyan/10" : "border-gray-200 bg-white")}>
                {icon}
              </div>
              {i < history.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 my-1" />}
            </div>
            <div className={"pb-6 " + (isCurrent ? "" : "")}>
              <div className={"text-sm font-bold " + (isCurrent ? "text-brand-cyan-dark" : "text-slate-700")}>
                {toLabel}
              </div>
              {fromLabel && <div className="text-xs text-slate-400">{fromLabel} ←</div>}
              <div className="text-[10px] text-slate-400 mt-0.5">
                {new Date(h.created_at).toLocaleString("ar-EG")}
              </div>
              {h.notes && <div className="text-xs text-slate-500 mt-1 bg-slate-50 p-2 rounded-lg">{h.notes}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
