"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { generateTodayPulse, type PulseBriefRow } from "./actions";
import { PULSE_CATEGORY_LINKS } from "@/lib/pulse";

const SEVERITY_UI: Record<
  string,
  { label: string; chip: string; card: string; icon: string }
> = {
  critical: {
    label: "حرج — اتصرف النهاردة",
    chip: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
    card: "border-rose-300 dark:border-rose-800",
    icon: "🔴",
  },
  warning: {
    label: "تحذير — يتراقب",
    chip: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    card: "border-amber-300 dark:border-amber-800",
    icon: "🟡",
  },
  opportunity: {
    label: "فرصة — متسبهاش",
    chip: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    card: "border-emerald-300 dark:border-emerald-800",
    icon: "💰",
  },
  info: {
    label: "للعلم",
    chip: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
    card: "border-slate-200 dark:border-slate-800",
    icon: "ℹ️",
  },
};

const STAT_LABELS: Record<string, string> = {
  headcount: "الموظفين",
  present: "حاضر اليوم",
  absent: "غايب",
  late: "متأخر",
  pendingLeaves: "إجازات معلقة",
  pendingAdvances: "سلف معلقة",
  newLeads7d: "عملاء جدد (أسبوع)",
  hotLeads: "عملاء سخنين 🔥",
  openConversations: "رسائل مفتوحة",
};

export function PulseClient({
  initialBrief,
  history,
}: {
  initialBrief: PulseBriefRow | null;
  history: PulseBriefRow[];
}) {
  const [brief, setBrief] = useState<PulseBriefRow | null>(initialBrief);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const autoRan = useRef(false);

  async function run() {
    setError("");
    setLoading(true);
    try {
      const res = await generateTodayPulse();
      if (res.ok) setBrief(res.brief);
      else setError(res.error);
    } catch {
      setError("مشكلة في الاتصال — جرّب تاني.");
    } finally {
      setLoading(false);
    }
  }

  // First visit of the day → generate automatically (the "daily" experience
  // without burning a Vercel cron slot).
  useEffect(() => {
    if (!initialBrief && !autoRan.current) {
      autoRan.current = true;
      run();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={run}
          disabled={loading}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-cyan-dark text-white font-bold font-cairo text-sm shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition"
        >
          {loading ? "⚡ بيجمع نبض الشركة…" : "🔄 حدّث النبض"}
        </button>
        {brief && (
          <span className="text-xs text-slate-500 font-cairo">
            آخر تحديث:{" "}
            {new Date(brief.created_at).toLocaleString("ar-EG", {
              hour: "2-digit",
              minute: "2-digit",
              day: "numeric",
              month: "long",
            })}
          </span>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-cairo">
          ⚠ {error}
        </div>
      )}

      {loading && !brief && (
        <div className="text-center py-14 text-slate-500 font-cairo">
          <div className="text-5xl mb-3 animate-pulse">⚡</div>
          بيمسح الحضور والإجازات والمرتبات والعملاء والرسائل…
        </div>
      )}

      {brief && (
        <>
          {/* Headline + health score */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex items-center gap-6">
            <HealthRing score={brief.health_score} />
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-bold text-brand-cyan-dark dark:text-brand-cyan font-cairo mb-1">
                بريفينج {new Date(brief.brief_date + "T00:00:00").toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long" })}
              </div>
              <p className="text-base md:text-lg font-black text-slate-900 dark:text-slate-100 font-cairo leading-relaxed">
                {brief.headline}
              </p>
            </div>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
            {Object.entries(STAT_LABELS).map(([key, label]) => {
              const v = brief.stats?.[key];
              if (v === undefined || v === null) return null;
              return (
                <div
                  key={key}
                  className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center"
                >
                  <div className="text-lg font-black text-slate-900 dark:text-slate-100 tabular-nums font-cairo">
                    {Number(v).toLocaleString("ar-EG")}
                  </div>
                  <div className="text-[10px] text-slate-500 font-cairo">{label}</div>
                </div>
              );
            })}
          </div>

          {/* Items */}
          <div className="space-y-3">
            {(brief.items ?? []).map((item, i) => {
              const ui = SEVERITY_UI[item.severity] ?? SEVERITY_UI.info;
              const link = PULSE_CATEGORY_LINKS[item.category];
              return (
                <div
                  key={i}
                  className={`bg-white dark:bg-slate-900 rounded-2xl border-2 ${ui.card} p-5 shadow-sm`}
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{ui.icon}</span>
                      <h3 className="font-black text-slate-900 dark:text-slate-100 font-cairo">
                        {item.title}
                      </h3>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-cairo ${ui.chip}`}>
                      {ui.label}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 font-cairo mt-2 leading-relaxed">
                    {item.detail}
                  </p>
                  <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-100 font-cairo">
                      ✅ {item.action}
                    </div>
                    {link && (
                      <Link
                        href={link.href}
                        className="text-xs font-bold text-brand-cyan-dark dark:text-brand-cyan hover:underline font-cairo shrink-0"
                      >
                        افتح {link.label} ←
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* History strip */}
          {history.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 font-cairo mb-3">
                📈 آخر أيام
              </h3>
              <div className="flex items-end gap-2">
                {[...history].reverse().map((h) => (
                  <div key={h.id} className="flex flex-col items-center gap-1 flex-1">
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-brand-cyan to-brand-cyan-dark/70"
                      style={{ height: `${Math.max(8, h.health_score * 0.6)}px` }}
                      title={`${h.brief_date}: ${h.health_score}/100`}
                    />
                    <div className="text-[9px] text-slate-400 font-cairo tabular-nums">
                      {new Date(h.brief_date + "T00:00:00").toLocaleDateString("ar-EG", { day: "numeric", month: "numeric" })}
                    </div>
                    <div className="text-[10px] font-bold text-slate-600 dark:text-slate-300 tabular-nums">
                      {h.health_score}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function HealthRing({ score }: { score: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const filled = (score / 100) * c;
  const color =
    score >= 70 ? "#10b981" : score >= 45 ? "#f59e0b" : "#f43f5e";
  return (
    <div className="relative w-24 h-24 shrink-0">
      <svg viewBox="0 0 84 84" className="w-24 h-24 -rotate-90">
        <circle cx="42" cy="42" r={r} fill="none" stroke="#e2e8f0" strokeWidth="8" className="dark:opacity-20" />
        <circle
          cx="42"
          cy="42"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${c - filled}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-xl font-black tabular-nums" style={{ color }}>
          {score}
        </div>
        <div className="text-[9px] text-slate-400 font-cairo">صحة الشركة</div>
      </div>
    </div>
  );
}
