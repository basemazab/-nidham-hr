"use client";

// المساعد الفني الفوري — floating help widget on every dashboard page.
// Users solve their own problems (live diagnostics + step-by-step guides)
// instead of going back to the vendor. Escalates to a dev ticket when needed.
//
// Plain request/response on purpose (no streaming): the server walks the
// resilient 4-model fallback chain and returns one complete reply — a dead
// stream spinner is worse UX than a 3-8s full answer.

import { useEffect, useRef, useState, Component, type ReactNode } from "react";

type ChatMsg = { role: "user" | "assistant"; text: string };

const SUGGESTIONS = [
  "إزاي أربط صفحة الفيسبوك بالرد الآلي؟",
  "الرد الآلي مش بيرد على العملاء — فيه إيه؟",
  "إزاي أرفع الموظفين من ملف إكسل؟",
  "عايز أقفل مرتبات الشهر — أعمل إيه؟",
];

function SupportChatInner() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  async function runChat(history: ChatMsg[]) {
    setBusy(true);
    // Abort a hung request after 45s instead of spinning forever.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 45000);
    try {
      const res = await fetch("/api/ai/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.slice(-10).map((m) => ({ role: m.role, content: m.text })),
        }),
        signal: controller.signal,
      });
      const json = (await res.json().catch(() => null)) as {
        ok?: boolean;
        reply?: string;
        error?: string;
      } | null;
      if (res.ok && json?.ok && json.reply) {
        setMessages((cur) => [...cur, { role: "assistant", text: json.reply! }]);
      } else {
        setError(json?.error || "حصلت مشكلة مؤقتة — جرّب تاني.");
      }
    } catch (e) {
      const aborted = e instanceof Error && e.name === "AbortError";
      setError(
        aborted
          ? "المساعد أخد وقت أطول من المتوقع — جرّب تاني."
          : "مشكلة في الاتصال — جرّب تاني.",
      );
    } finally {
      clearTimeout(timer);
      setBusy(false);
    }
  }

  async function send(text: string) {
    const t = text.trim();
    if (!t || busy) return;
    setError("");
    setInput("");
    const next: ChatMsg[] = [...messages, { role: "user", text: t }];
    setMessages(next);
    await runChat(next);
  }

  // Re-run the last turn after a failure — the user message is still the last
  // item in the thread, so this adds no duplicate.
  function retry() {
    if (busy || messages.length === 0) return;
    setError("");
    void runChat(messages);
  }

  return (
    <>
      {/* Launcher */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="المساعد الفني"
        className="fixed bottom-5 left-5 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-brand-cyan to-brand-cyan-dark text-white text-2xl shadow-xl shadow-cyan-500/30 hover:scale-105 transition flex items-center justify-center print:hidden"
      >
        {open ? "✕" : "🛟"}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-24 left-5 z-50 w-[min(94vw,400px)] h-[min(70vh,560px)] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl flex flex-col overflow-hidden print:hidden">
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-l from-brand-cyan-dark to-brand-cyan text-white">
            <div className="font-black font-cairo text-sm">🛟 المساعد الفني الفوري</div>
            <div className="text-[11px] opacity-90 font-cairo">
              بيشخّص مشاكلك فعليًا ويحلهالك خطوة بخطوة
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.length === 0 && (
              <div className="space-y-2">
                <p className="text-sm text-slate-600 dark:text-slate-300 font-cairo">
                  أهلًا 👋 اسألني عن أي حاجة في النظام — مشكلة، ربط، أو طريقة
                  استخدام:
                </p>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="block w-full text-right text-xs font-cairo px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-brand-cyan transition"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={m.role === "user" ? "flex justify-start flex-row-reverse" : "flex justify-start"}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm font-cairo whitespace-pre-wrap leading-relaxed ${
                    m.role === "user"
                      ? "bg-brand-cyan-dark text-white rounded-tr-sm"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-sm"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {busy && (
              <div className="flex">
                <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl px-3 py-2 text-sm font-cairo text-slate-500 animate-pulse">
                  🩺 بفحص وبجهّز الحل…
                </div>
              </div>
            )}
            {error && (
              <div className="text-xs text-rose-600 font-cairo bg-rose-50 border border-rose-200 rounded-lg p-2 flex items-center justify-between gap-2">
                <span>⚠️ {error}</span>
                {messages.length > 0 && (
                  <button
                    type="button"
                    onClick={retry}
                    disabled={busy}
                    className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-bold whitespace-nowrap disabled:opacity-50"
                  >
                    🔄 جرّب تاني
                  </button>
                )}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="p-3 border-t border-slate-200 dark:border-slate-700 flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="اكتب مشكلتك أو سؤالك…"
              className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 text-sm font-cairo outline-none focus:border-brand-cyan"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="px-4 py-2 rounded-xl bg-brand-cyan-dark text-white font-bold text-sm font-cairo disabled:opacity-50"
            >
              ابعت
            </button>
          </form>
        </div>
      )}
    </>
  );
}

// Error boundary — the support widget must never crash the page it floats on.
class SupportBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  constructor(props: { children: ReactNode }) {
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

export function SupportChat() {
  return (
    <SupportBoundary>
      <SupportChatInner />
    </SupportBoundary>
  );
}
