"use client";

import { useCallback, useEffect, useState } from "react";
import { toggleChecklistItem, getChecklistProgress } from "../actions";

type GoalPhase = "learn" | "contribute" | "accelerate";

type Goal = {
  key: string;
  label: string;
};

const PHASES: {
  key: GoalPhase;
  label: string;
  period: string;
  icon: string;
  color: string;
  lightBg: string;
  border: string;
  days: [number, number];
  goals: Goal[];
}[] = [
  {
    key: "learn",
    label: "التعلم",
    period: "الأيام 1–30",
    icon: "🌱",
    color: "text-cyan-700",
    lightBg: "bg-cyan-50",
    border: "border-cyan-200",
    days: [1, 30],
    goals: [
      { key: "goal_learn_orientation", label: "إنهاء التعريف بالشركة" },
      { key: "goal_learn_team", label: "التعرف على فريق العمل" },
      { key: "goal_learn_product", label: "فهم المنتج/الخدمة" },
      { key: "goal_learn_training", label: "إنهاء تدريب القسم" },
      { key: "goal_learn_setup", label: "تجهيز مكان العمل" },
    ],
  },
  {
    key: "contribute",
    label: "المساهمة",
    period: "الأيام 31–60",
    icon: "🚀",
    color: "text-emerald-700",
    lightBg: "bg-emerald-50",
    border: "border-emerald-200",
    days: [31, 60],
    goals: [
      { key: "goal_contrib_first_task", label: "إنجاز أول مهمة مستقلة" },
      { key: "goal_contrib_workflow", label: "فهم سير العمل والإجراءات" },
      { key: "goal_contrib_project", label: "المشاركة في مشروع الفريق" },
      { key: "goal_contrib_feedback", label: "تلقي تقييم 60 يوم" },
    ],
  },
  {
    key: "accelerate",
    label: "التسريع",
    period: "الأيام 61–90",
    icon: "⚡",
    color: "text-violet-700",
    lightBg: "bg-violet-50",
    border: "border-violet-200",
    days: [61, 90],
    goals: [
      { key: "goal_accel_lead", label: "قيادة مهمة بشكل مستقل" },
      { key: "goal_accel_improve", label: "تحسين إجراء أو عملية" },
      { key: "goal_accel_results", label: "تحقيق نتائج قابلة للقياس" },
      { key: "goal_accel_summary", label: "إعداد ملخص 90 يوم" },
    ],
  },
];

const STORAGE_KEY = (employeeId: string) => `goals_${employeeId}`;

export function ThirtySixtyNinetyPlan({
  employeeId,
  hireDate,
}: {
  employeeId: string;
  hireDate: string | null;
}) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [loaded, setLoaded] = useState(false);

  const startDate = hireDate ? new Date(hireDate) : null;
  const daysSinceStart = startDate
    ? Math.floor(
        (Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      )
    : 0;

  function getCurrentPhase(): GoalPhase | null {
    if (!startDate) return null;
    if (daysSinceStart <= 30) return "learn";
    if (daysSinceStart <= 60) return "contribute";
    return "accelerate";
  }

  const currentPhase = getCurrentPhase();

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY(employeeId));
    if (stored) {
      try {
        setChecked(JSON.parse(stored));
        setLoaded(true);
        return;
      } catch {
        // corrupt
      }
    }
    getChecklistProgress(employeeId, "onboarding").then((res) => {
      if (res.success && res.data.length > 0) {
        const map: Record<string, boolean> = {};
        for (const item of res.data) {
          if (item.item_key.startsWith("goal_")) {
            map[item.item_key] = item.checked;
          }
        }
        setChecked(map);
      }
      setLoaded(true);
    });
  }, [employeeId]);

  const persist = useCallback(
    (updated: Record<string, boolean>) => {
      localStorage.setItem(STORAGE_KEY(employeeId), JSON.stringify(updated));
    },
    [employeeId],
  );

  const handleToggle = useCallback(
    async (itemKey: string) => {
      const next = !checked[itemKey];
      const updated = { ...checked, [itemKey]: next };
      setChecked(updated);
      persist(updated);
      await toggleChecklistItem(employeeId, itemKey, next, "onboarding");
    },
    [checked, employeeId, persist],
  );

  if (!startDate) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <p className="font-cairo text-sm text-slate-500">
          مفيش تاريخ تعيين محدد — برجاء إضافة تاريخ التعيين أولاً
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Timeline Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 font-bold font-cairo text-slate-800">
          📅 خطة 30-60-90 يوم
        </h2>

        {/* Timeline dots */}
        <div className="relative mb-6 flex items-start justify-between px-2">
          {/* Background line */}
          <div className="absolute left-6 right-6 top-3 h-1 rounded-full bg-slate-200" />
          {/* Active segment */}
          <div
            className="absolute left-6 top-3 h-1 rounded-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-violet-400 transition-all"
            style={{
              width: `${Math.min(100, (daysSinceStart / 90) * 100)}%`,
            }}
          />

          {PHASES.map((phase, idx) => {
            const isCurrent = phase.key === currentPhase;
            const isCompleted = daysSinceStart > phase.days[1];
            return (
              <div key={phase.key} className="relative z-10 flex flex-col items-center">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black transition-all ${
                    isCurrent
                      ? "scale-110 bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-lg"
                      : isCompleted
                        ? "bg-emerald-400 text-white"
                        : "bg-slate-200 text-slate-400"
                  }`}
                >
                  {isCompleted ? "✓" : idx + 1}
                </div>
                <span
                  className={`mt-1.5 text-[10px] font-bold font-cairo ${
                    isCurrent ? "text-slate-800" : "text-slate-400"
                  }`}
                >
                  {phase.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Day counter */}
        <div className="text-center text-xs font-cairo text-slate-500">
          اليوم {daysSinceStart + 1} من 90
          {currentPhase && (
            <>
              {" · "}
              المرحلة الحالية:{" "}
              <span className="font-bold text-slate-700">
                {PHASES.find((p) => p.key === currentPhase)?.label}
              </span>
            </>
          )}
        </div>

        {/* Overall progress */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs font-cairo text-slate-500 mb-1">
            <span>التقدم الكلي</span>
            <span>
              {allGoals().filter((g) => checked[g.key]).length}/
              {allGoals().length}
            </span>
          </div>
          <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-violet-400 transition-all"
              style={{
                width: `${allGoals().length > 0 ? Math.round((allGoals().filter((g) => checked[g.key]).length / allGoals().length) * 100) : 0}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Phase Cards */}
      {PHASES.map((phase) => {
        const isCurrent = phase.key === currentPhase;
        const isPast = daysSinceStart > phase.days[1];
        const isFuture = !isCurrent && !isPast;
        const phaseDone = phase.goals.filter((g) => checked[g.key]).length;
        const phaseTotal = phase.goals.length;

        return (
          <div
            key={phase.key}
            className={`rounded-2xl border p-5 shadow-sm transition ${
              isCurrent
                ? "border-slate-300 bg-white"
                : isPast
                  ? "border-emerald-100 bg-emerald-50/30 opacity-70"
                  : "border-slate-200 bg-white opacity-60"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">{phase.icon}</span>
                <div>
                  <h3 className={`font-bold font-cairo ${phase.color}`}>
                    {phase.label}
                  </h3>
                  <p className="text-[10px] font-cairo text-slate-400">
                    {phase.period}
                  </p>
                </div>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold font-cairo ${
                  phaseDone === phaseTotal
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {phaseDone}/{phaseTotal}
              </span>
            </div>

            {/* Phase badge */}
            {isCurrent && (
              <div className="mb-3 inline-block rounded-full bg-cyan-100 px-3 py-0.5 text-[10px] font-bold font-cairo text-cyan-700">
                🎯 أنت هنا — ركّز على إنجاز هذه الأهداف
              </div>
            )}
            {isPast && phaseDone === phaseTotal && (
              <div className="mb-3 inline-block rounded-full bg-emerald-100 px-3 py-0.5 text-[10px] font-bold font-cairo text-emerald-700">
                ✅ تم إكمال هذه المرحلة
              </div>
            )}

            {/* Goals */}
            <div className="space-y-2">
              {phase.goals.map((goal) => {
                const isChecked = checked[goal.key] ?? false;
                return (
                  <button
                    key={goal.key}
                    type="button"
                    onClick={() => handleToggle(goal.key)}
                    disabled={isFuture}
                    className={`w-full flex items-center gap-3 rounded-xl border p-3 text-right transition ${
                      isFuture
                        ? "cursor-default border-slate-100 bg-slate-50/50"
                        : isChecked
                          ? "border-emerald-200 bg-emerald-50"
                          : "border-slate-100 bg-slate-50 hover:border-brand-cyan/30"
                    }`}
                  >
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition ${
                        isChecked
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : isFuture
                            ? "border-slate-200 bg-white"
                            : "border-slate-300 bg-white"
                      }`}
                    >
                      {isChecked && (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-4 w-4"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                    <span
                      className={`font-cairo text-sm ${
                        isChecked
                          ? "text-emerald-700 line-through"
                          : isFuture
                            ? "text-slate-400"
                            : "text-slate-700"
                      }`}
                    >
                      {goal.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {!loaded && (
        <div className="text-center text-xs font-cairo text-slate-400">
          جارٍ التحميل…
        </div>
      )}
    </div>
  );

  function allGoals() {
    return PHASES.flatMap((p) => p.goals);
  }
}
