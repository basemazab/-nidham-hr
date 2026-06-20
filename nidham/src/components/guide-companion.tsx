"use client";

// ============================================================================
// GuideCompanion — «نِظّوم», the in-system onboarding guide
// ============================================================================
//
// A friendly mascot that walks every user through the system page-by-page.
// 100% scripted from guide-content.ts — NO AI, NO network, NO keys — so it is
// instant, free, works offline, and CANNOT fail. Wrapped in an error boundary
// so even an unexpected render error degrades to nothing instead of breaking
// the page. Remembers which pages you've seen (localStorage) so it only pops
// up proactively on NEW pages, and can be muted entirely.

import React, { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getGuide, GUIDE_PAGE_COUNT, TOUR } from "@/lib/guide-content";

const SEEN_KEY = "nidham_guide_seen_v1";
const ENABLED_KEY = "nidham_guide_enabled_v1";

// localStorage helpers that never throw (SSR-safe + quota-safe).
function lsGet(key: string): string | null {
  try {
    return typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
  } catch {
    return null;
  }
}
function lsSet(key: string, value: string): void {
  try {
    if (typeof window !== "undefined") window.localStorage.setItem(key, value);
  } catch {
    /* ignore quota / privacy-mode errors */
  }
}

// ── Error boundary: the guide must never take a page down with it ──
class GuideBoundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    /* swallow — the guide is non-critical */
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function GuideCompanion() {
  return (
    <GuideBoundary>
      <GuideInner />
    </GuideBoundary>
  );
}

function GuideInner() {
  const pathname = usePathname() || "/dashboard";
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState<string[]>([]);
  const [tourStep, setTourStep] = useState<number | null>(null);

  // Load persisted state once.
  useEffect(() => {
    setMounted(true);
    if (lsGet(ENABLED_KEY) === "0") setEnabled(false);
    const raw = lsGet(SEEN_KEY);
    if (raw) {
      try {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) setSeen(arr.filter((x) => typeof x === "string"));
      } catch {
        /* corrupt value — start fresh */
      }
    }
  }, []);

  const guide = getGuide(pathname);
  const pageKey = guide.match;
  const isNewPage = mounted && !seen.includes(pageKey);

  // Auto-pop on a page the user hasn't seen yet (only when not on a tour).
  useEffect(() => {
    if (!mounted || !enabled || tourStep !== null) return;
    if (seen.includes(pageKey)) return;
    const t = setTimeout(() => {
      setOpen(true);
      setSeen((prev) => {
        if (prev.includes(pageKey)) return prev;
        const next = [...prev, pageKey];
        lsSet(SEEN_KEY, JSON.stringify(next));
        return next;
      });
    }, 950);
    return () => clearTimeout(t);
  }, [pathname, mounted, enabled, pageKey, tourStep, seen]);

  const markSeen = useCallback((key: string) => {
    setSeen((prev) => {
      if (prev.includes(key)) return prev;
      const next = [...prev, key];
      lsSet(SEEN_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const startTour = useCallback(() => {
    setTourStep(0);
    setOpen(true);
    if (TOUR[0]) router.push(TOUR[0].route);
  }, [router]);

  const tourNext = useCallback(() => {
    setTourStep((s) => {
      if (s === null) return s;
      const next = s + 1;
      if (next >= TOUR.length) {
        return null; // finished
      }
      router.push(TOUR[next].route);
      return next;
    });
  }, [router]);

  const tourPrev = useCallback(() => {
    setTourStep((s) => {
      if (s === null || s === 0) return s;
      const prev = s - 1;
      router.push(TOUR[prev].route);
      return prev;
    });
  }, [router]);

  const endTour = useCallback(() => setTourStep(null), []);

  const mute = useCallback(() => {
    setEnabled(false);
    setOpen(false);
    setTourStep(null);
    lsSet(ENABLED_KEY, "0");
  }, []);

  const unmute = useCallback(() => {
    setEnabled(true);
    setOpen(true);
    lsSet(ENABLED_KEY, "1");
  }, []);

  // Avoid SSR/hydration mismatch — the UI depends on localStorage.
  if (!mounted) return null;

  // Muted → a tiny, unobtrusive re-enable dot.
  if (!enabled) {
    return (
      <button
        type="button"
        onClick={unmute}
        aria-label="تشغيل المرشد نِظّوم"
        className="fixed bottom-5 left-5 z-[55] w-10 h-10 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center text-lg opacity-70 hover:opacity-100 transition"
      >
        🤖
      </button>
    );
  }

  const touring = tourStep !== null;
  const tour = touring ? TOUR[tourStep] : null;

  return (
    <div className="fixed bottom-5 left-5 z-[55] font-cairo" dir="rtl">
      <AnimatePresence>
        {open && (
          <motion.div
            key="bubble"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="absolute bottom-[78px] left-0 w-[330px] max-w-[86vw] rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden"
          >
            {/* header */}
            <div className="bg-gradient-to-l from-brand-cyan to-brand-cyan-dark px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <span className="text-xl">{touring ? "🧭" : guide.icon}</span>
                <span className="font-black text-sm">
                  {touring && tour ? tour.title : guide.title}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  if (touring) endTour();
                }}
                aria-label="إغلاق"
                className="text-white/80 hover:text-white text-lg leading-none"
              >
                ×
              </button>
            </div>

            {/* body */}
            <div className="p-4">
              {touring && tour ? (
                <>
                  <p className="text-sm text-slate-700 leading-relaxed mb-4">{tour.msg}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      {tourStep + 1} / {TOUR.length}
                    </span>
                    <div className="flex items-center gap-2">
                      {tourStep > 0 && (
                        <button
                          type="button"
                          onClick={tourPrev}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
                        >
                          السابق
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={tourNext}
                        className="px-4 py-1.5 rounded-lg bg-brand-cyan-dark text-white text-xs font-bold hover:brightness-110"
                      >
                        {tourStep + 1 >= TOUR.length ? "تمام، خلصنا 🎉" : "التالي ←"}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-slate-700 leading-relaxed mb-3">{guide.what}</p>
                  <ul className="space-y-1.5 mb-3">
                    {guide.steps.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-[13px] text-slate-600 leading-relaxed">
                        <span className="shrink-0 mt-0.5 w-4 h-4 rounded-full bg-cyan-100 text-brand-cyan-dark text-[10px] font-black flex items-center justify-center">
                          {i + 1}
                        </span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                  {guide.tip && (
                    <div className="text-[12px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 leading-relaxed mb-3">
                      💡 {guide.tip}
                    </div>
                  )}

                  <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                    <span className="text-[11px] text-slate-400">
                      اكتشفت {seen.length} من {GUIDE_PAGE_COUNT} صفحة
                    </span>
                    <button
                      type="button"
                      onClick={startTour}
                      className="px-3 py-1.5 rounded-lg bg-cyan-50 text-brand-cyan-dark text-xs font-bold hover:bg-cyan-100 transition"
                    >
                      خدني في جولة 🧭
                    </button>
                  </div>
                  <div className="text-center mt-2">
                    <button
                      type="button"
                      onClick={mute}
                      className="text-[10px] text-slate-300 hover:text-slate-500"
                    >
                      كتّم نِظّوم
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* The mascot */}
      <button
        type="button"
        onClick={() => {
          if (!open) markSeen(pageKey);
          setOpen((o) => !o);
        }}
        aria-label="المرشد نِظّوم"
        className="relative block"
      >
        {/* attention pulse on an unseen page */}
        {isNewPage && !open && (
          <span className="absolute inset-0 rounded-full bg-brand-cyan/40 animate-ping" />
        )}
        <Mascot waving={isNewPage && !open} />
      </button>
    </div>
  );
}

// ── The نِظّوم mascot — a friendly cyan robot, floating + blinking ──
function Mascot({ waving }: { waving: boolean }) {
  return (
    <motion.div
      animate={{ y: [0, -5, 0] }}
      transition={{ repeat: Infinity, duration: 3.4, ease: "easeInOut" }}
      className="w-[64px] h-[64px] drop-shadow-xl"
    >
      <svg viewBox="0 0 100 100" width="64" height="64" aria-hidden="true">
        <defs>
          <linearGradient id="nz-body" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#0891b2" />
          </linearGradient>
        </defs>
        {/* antenna */}
        <line x1="50" y1="14" x2="50" y2="26" stroke="#0891b2" strokeWidth="3" strokeLinecap="round" />
        <motion.circle
          cx="50"
          cy="11"
          r="5"
          fill="#fbbf24"
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ repeat: Infinity, duration: 1.8 }}
        />
        {/* head */}
        <rect x="22" y="26" width="56" height="48" rx="16" fill="url(#nz-body)" />
        {/* face screen */}
        <rect x="30" y="34" width="40" height="30" rx="10" fill="#0e2230" />
        {/* eyes (blink) */}
        <motion.g
          animate={{ scaleY: [1, 1, 0.1, 1] }}
          transition={{ repeat: Infinity, duration: 4, times: [0, 0.9, 0.95, 1] }}
          style={{ transformOrigin: "50px 47px" }}
        >
          <circle cx="42" cy="47" r="4.5" fill="#5eead4" />
          <circle cx="58" cy="47" r="4.5" fill="#5eead4" />
        </motion.g>
        {/* smile */}
        <path d="M42 56 Q50 61 58 56" stroke="#5eead4" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        {/* arm — waves on a new page */}
        <motion.line
          x1="78"
          y1="50"
          x2="90"
          y2={waving ? 40 : 56}
          stroke="#0891b2"
          strokeWidth="4"
          strokeLinecap="round"
          animate={waving ? { x2: [90, 92, 90], y2: [40, 36, 40] } : {}}
          transition={{ repeat: Infinity, duration: 0.7 }}
        />
        {/* base */}
        <rect x="40" y="74" width="20" height="8" rx="3" fill="#0891b2" />
      </svg>
    </motion.div>
  );
}
