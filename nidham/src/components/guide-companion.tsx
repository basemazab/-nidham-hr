"use client";

// ============================================================================
// GuideCompanion — «نِظّوم», the in-system onboarding companion (now chats!)
// ============================================================================
//
// A friendly mascot that BOTH walks users through pages AND chats with them.
// 100% scripted from guide-content.ts (intent matching) — NO AI, NO network,
// NO keys — so it replies instantly, free, offline, and CANNOT fail. Wrapped
// in an error boundary so any unexpected error degrades to nothing instead of
// breaking the page.

import React, { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  getGuide,
  pageReplyText,
  respond,
  TOPIC_CHIPS,
  TOUR,
} from "@/lib/guide-content";

const SEEN_KEY = "nidham_guide_seen_v1";
const ENABLED_KEY = "nidham_guide_enabled_v1";
const NEXT_CHIP = "التالي ←";
const MORE_CHIP = "اشرحلي أكتر";

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
    /* ignore quota / privacy-mode */
  }
}

type Msg = { id: number; role: "bot" | "user"; text: string; chips?: string[]; goto?: string };
let _mid = 0;
const nextId = () => (_mid += 1);

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
  componentDidCatch() {}
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
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [tourStep, setTourStep] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
    if (lsGet(ENABLED_KEY) === "0") setEnabled(false);
    const raw = lsGet(SEEN_KEY);
    if (raw) {
      try {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) setSeen(arr.filter((x) => typeof x === "string"));
      } catch {
        /* corrupt — ignore */
      }
    }
  }, []);

  const guide = getGuide(pathname);
  const pageKey = guide.match;
  const isNewPage = mounted && !seen.includes(pageKey);

  const pushBot = useCallback(
    (m: { text: string; chips?: string[]; goto?: string }) =>
      setMessages((p) => [...p, { id: nextId(), role: "bot", ...m }]),
    [],
  );
  const pushUser = useCallback(
    (text: string) => setMessages((p) => [...p, { id: nextId(), role: "user", text }]),
    [],
  );

  const markSeen = useCallback((key: string) => {
    setSeen((prev) => {
      if (prev.includes(key)) return prev;
      const next = [...prev, key];
      lsSet(SEEN_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  // Seed a greeting the first time the chat is shown.
  const greet = useCallback(() => {
    setMessages((p) =>
      p.length
        ? p
        : [
            {
              id: nextId(),
              role: "bot",
              text: "أهلاً! أنا نِظّوم 🤖 مرشدك في النظام. اسألني عن أي حاجة، أو خد جولة سريعة.",
              chips: TOPIC_CHIPS,
            },
          ],
    );
  }, []);

  // Proactively coach on a page the user hasn't seen yet.
  useEffect(() => {
    if (!mounted || !enabled || tourStep !== null) return;
    if (seen.includes(pageKey)) return;
    const t = setTimeout(() => {
      setOpen(true);
      greet();
      pushBot({ text: pageReplyText(guide), chips: [MORE_CHIP, ...TOPIC_CHIPS.slice(0, 2)] });
      markSeen(pageKey);
    }, 950);
    return () => clearTimeout(t);
  }, [pathname, mounted, enabled, pageKey, tourStep, seen, guide, greet, pushBot, markSeen]);

  // Keep the thread scrolled to the latest message.
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, open]);

  const startTour = useCallback(() => {
    setTourStep(0);
    setOpen(true);
    const s = TOUR[0];
    if (s) {
      router.push(s.route);
      pushBot({ text: `${s.title}\n${s.msg}`, chips: TOUR.length > 1 ? [NEXT_CHIP] : [] });
    }
  }, [router, pushBot]);

  const tourNext = useCallback(() => {
    setTourStep((s) => {
      if (s === null) return s;
      const n = s + 1;
      if (n >= TOUR.length) return null;
      const stop = TOUR[n];
      router.push(stop.route);
      pushBot({ text: `${stop.title}\n${stop.msg}`, chips: n < TOUR.length - 1 ? [NEXT_CHIP] : [] });
      return n;
    });
  }, [router, pushBot]);

  const send = useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text) return;
      if (text === NEXT_CHIP) {
        tourNext();
        return;
      }
      if (text === MORE_CHIP) {
        pushBot({ text: pageReplyText(getGuide(pathname)), chips: TOPIC_CHIPS.slice(0, 3) });
        return;
      }
      pushUser(text);
      const r = respond(text);
      if (r.tour) {
        startTour();
        return;
      }
      pushBot({ text: r.text, chips: r.chips, goto: r.goto });
    },
    [pushUser, pushBot, startTour, tourNext, pathname],
  );

  const mute = useCallback(() => {
    setEnabled(false);
    setOpen(false);
    setTourStep(null);
    lsSet(ENABLED_KEY, "0");
  }, []);

  const unmute = useCallback(() => {
    setEnabled(true);
    setOpen(true);
    greet();
    lsSet(ENABLED_KEY, "1");
  }, [greet]);

  if (!mounted) return null;

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
            className="absolute bottom-[78px] left-0 w-[340px] max-w-[88vw] rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden flex flex-col"
          >
            {/* header */}
            <div className="bg-gradient-to-l from-brand-cyan to-brand-cyan-dark px-4 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 text-white">
                <span className="text-xl">🤖</span>
                <div className="leading-tight">
                  <div className="font-black text-sm">نِظّوم</div>
                  <div className="text-[10px] text-white/80">مرشدك في النظام</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="إغلاق"
                className="text-white/80 hover:text-white text-lg leading-none"
              >
                ×
              </button>
            </div>

            {/* messages */}
            <div ref={scrollRef} className="px-3 py-3 space-y-2.5 overflow-y-auto" style={{ maxHeight: "46vh" }}>
              {messages.map((m) => {
                const chips = (m.chips ?? []).filter((c) => !c.startsWith("افتح الصفحة"));
                return (
                  <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                    <div className={m.role === "user" ? "max-w-[85%]" : "max-w-[90%]"}>
                      <div
                        className={`px-3 py-2 rounded-2xl text-[13px] leading-relaxed whitespace-pre-line ${
                          m.role === "user"
                            ? "bg-brand-cyan text-white rounded-bl-sm"
                            : "bg-slate-100 text-slate-700 rounded-br-sm"
                        }`}
                      >
                        {m.text}
                      </div>
                      {m.goto && (
                        <button
                          type="button"
                          onClick={() => {
                            if (m.goto) router.push(m.goto);
                          }}
                          className="mt-1.5 px-3 py-1.5 rounded-lg bg-brand-cyan-dark text-white text-xs font-bold hover:brightness-110 transition"
                        >
                          افتح الصفحة دي ←
                        </button>
                      )}
                      {chips.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {chips.map((c, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => send(c)}
                              className="px-2.5 py-1 rounded-full bg-cyan-50 text-brand-cyan-dark border border-cyan-100 text-[11px] font-bold hover:bg-cyan-100 transition"
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
                setInput("");
              }}
              className="border-t border-slate-100 p-2 flex items-center gap-2 shrink-0"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="اكتب سؤالك لنِظّوم…"
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-[13px] outline-none focus:border-brand-cyan font-cairo bg-white text-slate-800"
              />
              <button
                type="submit"
                aria-label="إرسال"
                className="w-9 h-9 shrink-0 rounded-xl bg-brand-cyan-dark text-white flex items-center justify-center hover:brightness-110 transition"
              >
                ➤
              </button>
            </form>

            {/* footer */}
            <div className="px-3 pb-2 flex items-center justify-between shrink-0">
              <span className="text-[10px] text-slate-400">
                اكتشفت {seen.length} صفحة · بدون إنترنت
              </span>
              <button type="button" onClick={mute} className="text-[10px] text-slate-300 hover:text-slate-500">
                كتّم نِظّوم
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* mascot */}
      <button
        type="button"
        onClick={() => {
          if (!open) {
            greet();
            markSeen(pageKey);
          }
          setOpen((o) => !o);
        }}
        aria-label="المرشد نِظّوم"
        className="relative block"
      >
        {isNewPage && !open && (
          <span className="absolute inset-0 rounded-full bg-brand-cyan/40 animate-ping" />
        )}
        <Mascot waving={isNewPage && !open} />
      </button>
    </div>
  );
}

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
        <line x1="50" y1="14" x2="50" y2="26" stroke="#0891b2" strokeWidth="3" strokeLinecap="round" />
        <motion.circle
          cx="50"
          cy="11"
          r="5"
          fill="#fbbf24"
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ repeat: Infinity, duration: 1.8 }}
        />
        <rect x="22" y="26" width="56" height="48" rx="16" fill="url(#nz-body)" />
        <rect x="30" y="34" width="40" height="30" rx="10" fill="#0e2230" />
        <motion.g
          animate={{ scaleY: [1, 1, 0.1, 1] }}
          transition={{ repeat: Infinity, duration: 4, times: [0, 0.9, 0.95, 1] }}
          style={{ transformOrigin: "50px 47px" }}
        >
          <circle cx="42" cy="47" r="4.5" fill="#5eead4" />
          <circle cx="58" cy="47" r="4.5" fill="#5eead4" />
        </motion.g>
        <path d="M42 56 Q50 61 58 56" stroke="#5eead4" strokeWidth="2.5" fill="none" strokeLinecap="round" />
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
        <rect x="40" y="74" width="20" height="8" rx="3" fill="#0891b2" />
      </svg>
    </motion.div>
  );
}
