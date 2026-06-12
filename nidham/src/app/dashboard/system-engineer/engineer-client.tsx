"use client";

import { useEffect, useRef, useState } from "react";
import { runHealthAction } from "./actions";
import type { HealthCheck } from "@/lib/system-health";

const STATUS_UI: Record<
  HealthCheck["status"],
  { icon: string; cls: string; border: string }
> = {
  ok: { icon: "✅", cls: "text-emerald-700 dark:text-emerald-300", border: "border-slate-200 dark:border-slate-800" },
  warn: { icon: "🟡", cls: "text-amber-700 dark:text-amber-300", border: "border-amber-300 dark:border-amber-800" },
  fail: { icon: "🔴", cls: "text-rose-700 dark:text-rose-300", border: "border-rose-300 dark:border-rose-800" },
};

export function EngineerClient() {
  const [checks, setChecks] = useState<HealthCheck[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ranAt, setRanAt] = useState<string | null>(null);
  const autoRan = useRef(false);

  async function run() {
    setError("");
    setLoading(true);
    try {
      const res = await runHealthAction();
      if (res.ok) {
        setChecks(res.checks);
        setRanAt(res.ranAt);
      } else {
        setError(res.error);
      }
    } catch {
      setError("مشكلة في الاتصال — جرّب تاني.");
    } finally {
      setLoading(false);
    }
  }

  // Run automatically on first open — the page IS the diagnosis.
  useEffect(() => {
    if (!autoRan.current) {
      autoRan.current = true;
      run();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fails = checks?.filter((c) => c.status === "fail").length ?? 0;
  const warns = checks?.filter((c) => c.status === "warn").length ?? 0;

  return (
    <section className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div>
          <h2 className="font-black text-lg text-slate-900 dark:text-slate-100 font-cairo">
            🩺 الفحص الشامل الحي
          </h2>
          {checks && (
            <p className="text-xs text-slate-500 font-cairo mt-0.5">
              {fails > 0
                ? `🔴 ${fails} عطل محتاج تصرف${warns ? ` + ${warns} تحذير` : ""}`
                : warns > 0
                  ? `🟡 ${warns} تحذير — والباقي سليم`
                  : "✅ كل الأنظمة شغالة"}
              {ranAt &&
                ` · آخر فحص ${new Date(ranAt).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}`}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={run}
          disabled={loading}
          className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-700 text-white font-bold font-cairo text-sm hover:bg-slate-800 disabled:opacity-50 transition"
        >
          {loading ? "🩺 بيفحص كل حاجة…" : "🔄 أعد الفحص"}
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm font-cairo">
          ⚠️ {error}
        </div>
      )}

      {loading && !checks && (
        <div className="text-center py-8 text-slate-500 font-cairo">
          <div className="text-3xl mb-2 animate-pulse">🩺</div>
          بيفحص قاعدة البيانات والـ AI وفيسبوك ولينكد إن والإيميل والكرون…
        </div>
      )}

      {checks && (
        <div className="space-y-2">
          {checks.map((c) => {
            const ui = STATUS_UI[c.status];
            return (
              <div
                key={c.key}
                className={`flex items-start gap-3 p-3 rounded-lg border ${ui.border} bg-slate-50/50 dark:bg-slate-800/30`}
              >
                <span className="text-lg shrink-0">{ui.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-bold font-cairo ${ui.cls}`}>
                    {c.label}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-300 font-cairo mt-0.5">
                    {c.detail}
                  </div>
                  {c.fix && c.status !== "ok" && (
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-100 font-cairo mt-1">
                      🔧 الحل: {c.fix}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
