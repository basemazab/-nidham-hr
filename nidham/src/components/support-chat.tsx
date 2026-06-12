"use client";

// المساعد الفني الفوري — floating help widget on every dashboard page.
// Users solve their own problems (live diagnostics + step-by-step guides)
// instead of going back to the vendor. Escalates to a dev ticket when needed.

import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

const SUGGESTIONS = [
  "إزاي أربط صفحة الفيسبوك بالرد الآلي؟",
  "الرد الآلي مش بيرد على العملاء — فيه إيه؟",
  "إزاي أرفع الموظفين من ملف إكسل؟",
  "عايز أقفل مرتبات الشهر — أعمل إيه؟",
];

export function SupportChat() {
  const [open, setOpen] = useState(false);
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/ai/support" }),
  });
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  function send(text: string) {
    const t = text.trim();
    if (!t || busy) return;
    sendMessage({ text: t });
    setInput("");
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

            {messages.map((m) => {
              const isUser = m.role === "user";
              const text = m.parts
                .filter(
                  (p): p is { type: "text"; text: string } =>
                    p.type === "text" && typeof (p as { text?: string }).text === "string",
                )
                .map((p) => p.text)
                .join("");
              const toolRan = m.parts.some((p) => p.type.startsWith("tool-"));
              if (!text && !toolRan) return null;
              return (
                <div key={m.id} className={isUser ? "flex justify-start flex-row-reverse" : "flex justify-start"}>
                  <div
                    className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm font-cairo whitespace-pre-wrap leading-relaxed ${
                      isUser
                        ? "bg-brand-cyan-dark text-white rounded-tr-sm"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-sm"
                    }`}
                  >
                    {toolRan && !isUser && (
                      <div className="text-[10px] text-brand-cyan-dark dark:text-brand-cyan font-bold mb-1">
                        🩺 فحصت نظامك…
                      </div>
                    )}
                    {text}
                  </div>
                </div>
              );
            })}

            {busy && (
              <div className="flex">
                <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl px-3 py-2 text-sm font-cairo text-slate-500 animate-pulse">
                  بكتب…
                </div>
              </div>
            )}
            {error && (
              <div className="text-xs text-rose-600 font-cairo bg-rose-50 border border-rose-200 rounded-lg p-2">
                ⚠️ حصلت مشكلة مؤقتة — جرّب تاني.
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
