"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useRef, useEffect } from "react";
import { getKBSearchSources, type KBSource } from "@/lib/ai/kb-actions";

// Two flavours of question on purpose: half about Egyptian labor law
// (which the system prompt now teaches the model), half about the
// company's actual data. Users learn that the AI handles both worlds.
const SUGGESTED_QUESTIONS: { q: string; cat: "law" | "data" | "general" }[] = [
  { q: "اكتبلي إيميل اعتذار احترافي لعميل", cat: "general" },
  { q: "كام يوم إجازة سنوية بقانون العمل المصري؟", cat: "law" },
  { q: "مين أحسن موظف عندي الشهر ده؟", cat: "data" },
  { q: "اشرحلي يعني إيه OKRs بمثال بسيط", cat: "general" },
  { q: "ازاي أحسب مكافأة نهاية الخدمة؟", cat: "law" },
  { q: "اعملي ملخص سريع للشركة", cat: "data" },
  { q: "ترجم لإنجليزي: «بنتطلع للتعاون معكم»", cat: "general" },
  { q: "ضريبة الدخل على مرتب 8000 ج كام؟", cat: "law" },
];

export function AIChat() {
  const [input, setInput] = useState("");
  const [messageSources, setMessageSources] = useState<Map<string, KBSource[]>>(new Map());
  const [attached, setAttached] = useState<File | null>(null);
  const [attachError, setAttachError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastUserQueryRef = useRef<string>("");

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/ai/chat" }),
    onFinish: async ({ message }) => {
      const query = lastUserQueryRef.current;
      if (!query) return;
      lastUserQueryRef.current = "";
      const sources = await getKBSearchSources(query);
      if (sources.length === 0) return;
      setMessageSources((prev) => {
        const next = new Map(prev);
        next.set(message.id, sources);
        return next;
      });
    },
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) {
      setAttached(null);
      return;
    }
    const okType = f.type.startsWith("image/") || f.type === "application/pdf";
    if (!okType) {
      setAttachError("الملف لازم يكون صورة أو PDF");
      setAttached(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setAttachError("الملف كبير — الحد الأقصى 5 ميجا");
      setAttached(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setAttachError("");
    setAttached(f);
  };

  const clearAttachment = () => {
    setAttached(null);
    setAttachError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !attached) || status !== "ready") return;
    lastUserQueryRef.current = input.trim();
    const files = fileInputRef.current?.files ?? undefined;
    sendMessage({
      text: input.trim() || "اقرأ الملف المرفق وحلّله.",
      files: files && files.length > 0 ? files : undefined,
    });
    setInput("");
    clearAttachment();
  };

  const handleSuggestionClick = (q: string) => {
    if (status !== "ready") return;
    lastUserQueryRef.current = q;
    sendMessage({ text: q });
  };

  const isLoading = status === "submitted" || status === "streaming";

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] md:h-[calc(100vh-160px)] bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="text-5xl mb-3">🤖</div>
            <h2 className="text-2xl font-black font-cairo text-slate-800 mb-1">
              مرحبًا، أنا نِظام AI
            </h2>
            <p className="text-sm text-slate-500 mb-6 font-cairo max-w-lg leading-relaxed">
              مساعد ذكي عام — اسألني أي حاجة (كتابة، ترجمة، أفكار، برمجة، شرح).
              وكمان خبير في قانون العمل المصري والضرايب والتأمينات، وعندي بيانات
              شركتك وموظفيك مباشرة.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-2xl w-full">
              {SUGGESTED_QUESTIONS.map(({ q, cat }, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSuggestionClick(q)}
                  className={`text-right px-4 py-3 rounded-xl border transition text-sm font-cairo text-slate-700 ${
                    cat === "law"
                      ? "border-amber-200 hover:border-amber-300 hover:bg-amber-50"
                      : cat === "data"
                        ? "border-cyan-200 hover:border-brand-cyan/40 hover:bg-cyan-50/50"
                        : "border-violet-200 hover:border-violet-300 hover:bg-violet-50"
                  }`}
                >
                  <span className="text-xs opacity-60">
                    {cat === "law" ? "⚖ قانون" : cat === "data" ? "📊 بياناتك" : "💡 عام"}
                  </span>{" "}
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((m) => {
              const textParts = m.parts.filter((p) => p.type === "text");
              const content = textParts.map((p) => ("text" in p ? p.text : "")).join("");
              const fileParts = m.parts.filter((p) => p.type === "file");
              const sources = messageSources.get(m.id);
              return (
                <div
                  key={m.id}
                  className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                      m.role === "user"
                        ? "bg-gradient-to-br from-brand-cyan to-brand-cyan-dark text-white"
                        : "bg-gradient-to-br from-amber-400 to-amber-600 text-white"
                    }`}
                  >
                    {m.role === "user" ? "أ" : "🤖"}
                  </div>
                  <div className={`flex flex-col gap-2 ${m.role === "user" ? "items-end" : "items-start"}`}>
                    {fileParts.length > 0 && (
                      <div className="flex flex-wrap gap-2 max-w-[80%]">
                        {fileParts.map((p, fi) => {
                          const url = "url" in p && typeof p.url === "string" ? p.url : "";
                          const mt =
                            "mediaType" in p && typeof p.mediaType === "string" ? p.mediaType : "";
                          const name =
                            "filename" in p && typeof p.filename === "string" && p.filename
                              ? p.filename
                              : "ملف";
                          return mt.startsWith("image/") && url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              key={fi}
                              src={url}
                              alt={name}
                              className="max-h-44 rounded-xl border border-slate-200"
                            />
                          ) : (
                            <span
                              key={fi}
                              className="inline-flex items-center gap-1 text-xs font-cairo bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-600"
                            >
                              📎 {name}
                            </span>
                          );
                        })}
                      </div>
                    )}
                    {content && (
                      <div
                        className={`max-w-[80%] px-4 py-3 rounded-2xl font-cairo text-sm leading-relaxed whitespace-pre-wrap ${
                          m.role === "user"
                            ? "bg-brand-cyan/10 text-slate-800 rounded-tr-sm"
                            : "bg-slate-50 text-slate-800 rounded-tl-sm"
                        }`}
                      >
                        {content}
                      </div>
                    )}
                    {m.role !== "user" && sources && sources.length > 0 && (
                      <div className="max-w-md rounded-xl border border-amber-200 bg-amber-50/50 px-3 py-2 text-xs font-cairo shadow-sm">
                        <div className="mb-1 text-[10px] font-bold text-amber-700">📚 المستندات المرجعية</div>
                        <div className="flex flex-wrap gap-1">
                          {sources.map((s) => (
                            <span
                              key={s.id}
                              className="inline-block rounded bg-white px-1.5 py-0.5 text-[10px] text-slate-700 border border-amber-100"
                            >
                              {s.source_type === "pdf" ? "📄" : s.source_type === "doc" ? "📝" : "📋"} {s.title}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {isLoading && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-sm">
                  🤖
                </div>
                <div className="px-4 py-3 rounded-2xl bg-slate-50">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-200 text-red-700 text-xs font-cairo">
          ⚠ {error.message}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-slate-100 bg-slate-50/50">
        {(attached || attachError) && (
          <div className="px-3 pt-2 flex items-center gap-2 flex-wrap">
            {attached && (
              <span className="inline-flex items-center gap-2 text-xs font-cairo bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-600">
                📎 {attached.name}
                <button
                  type="button"
                  onClick={clearAttachment}
                  className="text-red-400 hover:text-red-600"
                  aria-label="إزالة الملف"
                >
                  ✕
                </button>
              </span>
            )}
            {attachError && (
              <span className="text-xs text-red-500 font-cairo">⚠ {attachError}</span>
            )}
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex items-center gap-2 p-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            onChange={onPickFile}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            title="أرفِق صورة أو PDF"
            className="px-3 py-3 rounded-xl border border-slate-200 text-slate-500 hover:bg-white hover:text-brand-cyan transition disabled:opacity-50"
          >
            📎
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="اسألني أي حاجة... (قانون العمل، بيانات شركتك، كتابة، ترجمة، أفكار)"
            disabled={isLoading}
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20 outline-none text-slate-900 font-cairo disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={isLoading || (!input.trim() && !attached)}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-cyan-dark text-white font-bold font-cairo disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition shadow-md"
          >
            {isLoading ? "..." : "ابعت"}
          </button>
        </form>
      </div>
    </div>
  );
}
