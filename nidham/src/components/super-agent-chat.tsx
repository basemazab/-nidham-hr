"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage } from "ai";

// ─── Types ───────────────────────────────────────────────────────────────────
type ParsedFile = {
  ok: true;
  filename: string;
  size: number;
  sheet_name: string;
  headers: string[];
  row_count: number;
  truncated: boolean;
  rows: Record<string, string | number | null>[];
  hint: "employees" | "attendance" | "unknown";
  notes: string;
  is_pdf?: boolean;
  pdf_type?: "employees" | "attendance" | "other";
  is_image?: boolean;
  image_type?: string;
  text_summary?: string | null;
};

type ToolPart = {
  type: string;
  toolCallId?: string;
  state?: string;
  input?: Record<string, unknown>;
  output?: unknown;
  errorText?: string;
};

function isToolPart(p: unknown): p is ToolPart {
  return (
    !!p &&
    typeof p === "object" &&
    "type" in p &&
    typeof (p as { type: unknown }).type === "string" &&
    (p as { type: string }).type.startsWith("tool-")
  );
}

function getToolName(p: ToolPart): string {
  return p.type.slice("tool-".length);
}

// ─── Tool labels ─────────────────────────────────────────────────────────────
const TOOL_LABELS: Record<string, { running: string; done: string; icon: string }> = {
  search_employees: { running: "بيدور على الموظفين", done: "خلص البحث", icon: "🔍" },
  get_attendance_summary: { running: "بيلخص الحضور", done: "جهز ملخص الحضور", icon: "📊" },
  count_employees_by_pay_frequency: { running: "بيعد الموظفين", done: "عد الموظفين", icon: "👥" },
  list_pending_requests: { running: "بيشوف الطلبات المعلقة", done: "جاب الطلبات", icon: "📋" },
  find_duplicate_employees: { running: "بيدور على التكرارات", done: "خلص فحص التكرارات", icon: "🔁" },
  propose_payroll_period: { running: "بيحسب المرتبات (محاكاة)", done: "جهز اقتراح المرتبات", icon: "🧮" },
  analyze_retention: { running: "بيحلل الاحتفاظ بالموظفين", done: "خلص تحليل الاحتفاظ", icon: "🎯" },
  bulk_import_employees: { running: "بيضيف الموظفين من الملف", done: "تم إضافة الموظفين", icon: "📥" },
  bulk_import_attendance: { running: "بيضيف الحضور من الملف", done: "تم إضافة الحضور", icon: "📥" },
  execute_payroll_period: { running: "بيقفل المرتبات", done: "تم قفل المرتبات", icon: "💰" },
};

// ─── Suggested actions ───────────────────────────────────────────────────────
const SUGGESTED: { q: string; cat: "tool" | "law" | "data"; icon: string }[] = [
  { q: "اقفل مرتبات الموظفين الشهريين", cat: "tool", icon: "💰" },
  { q: "مين يستحق زيادة دلوقتي؟", cat: "tool", icon: "📈" },
  { q: "كام موظف نشط عندي؟", cat: "data", icon: "👥" },
  { q: "اعرضلي طلبات الإجازة المعلقة", cat: "tool", icon: "📋" },
  { q: "حلل الحضور الشهر ده", cat: "data", icon: "📊" },
  { q: "ايه حقوقي في الإجازة الاعتيادية؟", cat: "law", icon: "⚖️" },
  { q: "في حد ممكن يستقيل قريب؟", cat: "tool", icon: "🎯" },
  { q: "ضريبة الدخل على ٨٠٠٠ ج كام؟", cat: "law", icon: "🧮" },
];

// ─── Main component ───────────────────────────────────────────────────────────
export function SuperAgentChat() {
  const [input, setInput] = useState("");
  const [attached, setAttached] = useState<ParsedFile | null>(null);
  const [fileBusy, setFileBusy] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/ai/agent" }),
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  const isLoading = status === "submitted" || status === "streaming";

  // ─── File handling ─────────────────────────────────────────────────────────
  const handleFile = useCallback(async (file: File) => {
    setFileError(null);
    setFileBusy(true);
    try {
      const fd = new FormData();
      fd.set("file", file);

      // For images, show instant local preview
      if (file.type.startsWith("image/")) {
        setAttached({
          ok: true,
          filename: file.name,
          size: file.size,
          sheet_name: "صورة",
          headers: [],
          row_count: 0,
          truncated: false,
          rows: [],
          hint: "unknown",
          notes: "جاري تحليل الصورة...",
          is_image: true,
          image_type: "unknown",
          text_summary: null,
        });
      }

      const res = await fetch("/api/ai/parse-file", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "فشل قراءة الملف" }));
        throw new Error(err?.error ?? `فشل (${res.status})`);
      }
      const data = (await res.json()) as ParsedFile;
      setAttached(data);
    } catch (e) {
      setFileError(e instanceof Error ? e.message : "حصل خطأ غير متوقع");
      setAttached(null);
    } finally {
      setFileBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, []);

  const handleFilePick = (f: File | null | undefined) => {
    if (f) handleFile(f);
  };

  // ─── Drag & drop ──────────────────────────────────────────────────────────
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  // ─── Build message with file context ───────────────────────────────────────
  const buildMessageText = (userText: string): string => {
    if (!attached) return userText;
    const fileKind = attached.is_image
      ? "صورة"
      : attached.is_pdf
        ? "PDF"
        : "Excel/CSV";
    const hintLine =
      attached.hint === "employees"
        ? "هذا كشف موظفين"
        : attached.hint === "attendance"
          ? "هذا كشف حضور"
          : attached.is_image
            ? `هذه صورة (${attached.image_type})`
            : attached.pdf_type === "other"
              ? "هذا ملف غير منظم"
              : "نوع الملف غير محدد";

    const lines: string[] = [
      `📎 [ملف ${fileKind} مرفق]`,
      `اسم الملف: ${attached.filename}`,
    ];

    if (attached.is_image && attached.text_summary) {
      lines.push(hintLine);
      lines.push("");
      lines.push("النصوص المستخرجة من الصورة:");
      lines.push(attached.text_summary);
    } else if (attached.pdf_type === "other" && attached.text_summary) {
      lines.push(hintLine);
      lines.push("");
      lines.push("ملخص المحتوى:");
      lines.push(attached.text_summary);
    } else if (attached.rows.length > 0) {
      lines.push(
        `${hintLine} — ${attached.row_count} صف${attached.truncated ? " (مختصر)" : ""}`,
      );
      if (attached.headers.length > 0) {
        lines.push(`العناوين: ${attached.headers.join(" | ")}`);
      }
      lines.push("البيانات الكاملة:");
      lines.push("```json");
      lines.push(JSON.stringify(attached.rows, null, 0));
      lines.push("```");
    } else {
      lines.push(hintLine);
      if (attached.notes) lines.push(attached.notes);
    }

    lines.push("");
    lines.push(userText);
    return lines.join("\n");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    if (!input.trim() && !attached) return;
    const finalText = buildMessageText(input.trim() || "حلل الملف ده وقولي ممكن أعمل بيه إيه");
    sendMessage({ text: finalText });
    setInput("");
    setAttached(null);
    setFileError(null);
  };

  const handleSuggestionClick = (q: string) => {
    if (isLoading) return;
    sendMessage({ text: q });
  };

  // ─── Tool output renderer ──────────────────────────────────────────────────
  function renderToolOutput(toolName: string, output: unknown) {
    if (!output || typeof output !== "object") return null;
    const o = output as Record<string, unknown>;

    if (toolName === "execute_payroll_period" && o.ok === true) {
      return (
        <a href={String(o.url ?? "")}
          className="mt-2 block rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-cyan-50 p-3 font-cairo text-xs transition hover:shadow-md">
          <div className="mb-1 text-[11px] font-bold text-emerald-700">
            {o.already_exists ? "📂 موجودة" : "✅ تم القفل"}
          </div>
          <div className="font-bold text-slate-800">{String(o.employee_count ?? 0)} موظف · صافي {Number(o.total_net ?? 0).toLocaleString("ar-EG")} ج</div>
          <div className="mt-1 text-[11px] text-slate-600">اضغط لفتح الكشف →</div>
        </a>
      );
    }
    if (toolName === "propose_payroll_period" && o.ok === true) {
      return (
        <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-cairo">
          <div className="mb-1 font-bold text-amber-800">🧮 مقترح</div>
          <div>{String(o.employee_count ?? 0)} موظف · صافي {Number(o.total_net ?? 0).toLocaleString("ar-EG")} ج</div>
        </div>
      );
    }
    if (toolName === "bulk_import_employees" && o.ok === true) {
      return (
        <a href={String(o.dashboard_url ?? "/dashboard/employees")}
          className="mt-2 block rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-cyan-50 p-3 font-cairo text-xs transition hover:shadow-md">
          <div className="font-bold text-emerald-700">✅ تمت الإضافة</div>
          <div className="text-slate-800">{String(o.inserted_count ?? 0)} موظف</div>
        </a>
      );
    }
    if (toolName === "bulk_import_attendance" && o.ok === true) {
      return (
        <a href={String(o.review_url ?? "/dashboard/attendance")}
          className="mt-2 block rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-cyan-50 p-3 font-cairo text-xs transition hover:shadow-md">
          <div className="font-bold text-emerald-700">✅ تمت الإضافة</div>
          <div className="text-slate-800">{String(o.inserted_count ?? 0)} سجل</div>
        </a>
      );
    }
    if (toolName === "analyze_retention" && o.ok === true) {
      const c = (o.insight_counts ?? {}) as Record<string, number>;
      return (
        <div className="mt-2 rounded-xl border border-amber-200 bg-gradient-to-l from-rose-50 via-amber-50 to-emerald-50 p-2 text-xs font-cairo">
          <div className="flex flex-wrap gap-2">
            {(c.raise ?? 0) > 0 && <span>💸 {c.raise}</span>}
            {(c.bonus ?? 0) > 0 && <span>🎁 {c.bonus}</span>}
            {(c.flight_risk ?? 0) > 0 && <span className="text-rose-700">⚠ {c.flight_risk}</span>}
          </div>
        </div>
      );
    }
    if (o.ok === false && o.error) {
      return <div className="mt-1 text-[11px] text-red-600 font-cairo">⚠ {String(o.error)}</div>;
    }
    return null;
  }

  // ─── File icon helper ──────────────────────────────────────────────────────
  const fileIcon = attached
    ? attached.is_image
      ? "🖼"
      : attached.is_pdf
        ? attached.pdf_type === "other"
          ? "📕"
          : "📄"
        : attached.hint === "employees"
          ? "👥"
          : attached.hint === "attendance"
            ? "⏰"
            : "📎"
    : null;

  return (
    <div
      ref={dropRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative flex h-[calc(100vh-200px)] flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-md md:h-[calc(100vh-160px)]"
    >
      {/* Drag overlay */}
      {dragOver && (
        <div className="absolute inset-0 z-50 flex items-center justify-center rounded-2xl border-2 border-dashed border-cyan-400 bg-cyan-50/80 backdrop-blur-sm">
          <div className="text-center">
            <div className="text-5xl">📂</div>
            <p className="mt-2 text-lg font-bold font-cairo text-cyan-700">أفلت الملف هنا</p>
            <p className="text-sm font-cairo text-cyan-600">Excel, PDF, CSV, أو صورة</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 border-b border-amber-100 bg-gradient-to-r from-amber-50 to-cyan-50 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-amber-200/50 px-2 py-0.5 text-[11px] font-bold text-amber-800 font-cairo">
            ⚡ Super Agent
          </span>
          <span className="text-[11px] text-slate-500 font-cairo">
            قدرات خارقة — ملفات، صور، تنفيذ
          </span>
        </div>
        <div className="mr-auto flex items-center gap-1.5 text-[10px] text-slate-400 font-cairo">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
          {status === "ready" ? "نشط" : "مشغول"}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-3 text-6xl">🤖</div>
            <h2 className="mb-1 text-2xl font-black font-cairo text-slate-800">
              أنا نِظام — المساعد الخارق
            </h2>
            <p className="mb-1 max-w-lg text-sm font-cairo leading-relaxed text-slate-500">
              بقدر أستورد الموظفين من Excel، أحلل الصور والعقود،
              أقفل المرتبات، وأدير طلبات الإجازة — <strong className="text-amber-700">كأني موظف back-office كامل</strong>.
            </p>
            <p className="mb-1 text-[11px] font-cairo text-cyan-600">
              🖱 اسحب وأفلت أي ملف هنا · 📸 صور مستندات · 📊 Excel و PDF
            </p>
            <p className="mb-6 text-[11px] font-cairo text-slate-400">
              متخصص في قانون العمل المصري والتأمينات الاجتماعية
            </p>

            {/* Quick action grid */}
            <div className="grid w-full max-w-2xl grid-cols-1 gap-2 md:grid-cols-2">
              {SUGGESTED.map(({ q, cat, icon }, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSuggestionClick(q)}
                  className={`flex items-center gap-2 rounded-xl border p-3 text-right text-sm font-cairo transition ${
                    cat === "tool"
                      ? "border-emerald-200 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50"
                      : cat === "law"
                        ? "border-amber-200 text-slate-700 hover:border-amber-300 hover:bg-amber-50"
                        : "border-cyan-200 text-slate-700 hover:border-brand-cyan/40 hover:bg-cyan-50/50"
                  }`}
                >
                  <span className="text-lg">{icon}</span>
                  <span>{q}</span>
                </button>
              ))}
            </div>

            {/* Upload zone hint (when no messages yet) */}
            <div className="mt-6 flex items-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-6 py-4">
              <span className="text-2xl">📎</span>
              <div className="text-right font-cairo text-xs text-slate-500">
                <span className="font-bold text-slate-700">اسحب وأفلت</span> أو اضغط على المشبك لرفع ملف
                <div className="mt-0.5 text-[10px] text-slate-400">Excel · CSV · PDF · صور (JPG, PNG)</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((m: UIMessage) => (
              <MessageBubble key={m.id} message={m} renderToolOutput={renderToolOutput} />
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-sm">
                  🤖
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <div className="flex gap-1">
                    {[0, 150, 300].map((d) => (
                      <span key={d} className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: `${d}ms` }} />
                    ))}
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
        <div className="border-t border-red-200 bg-red-50 px-4 py-2 text-xs font-cairo text-red-700">
          ⚠ {error.message}
        </div>
      )}

      {/* Attached file preview */}
      {attached && (
        <div className="border-t border-slate-100 bg-slate-50/50 px-3 pt-3">
          <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-white p-3">
            {/* File thumbnail for images */}
            {attached.is_image ? (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-50 to-blue-50 text-2xl">
                🖼
              </div>
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-lg">
                {fileIcon}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 font-cairo text-sm font-bold text-slate-800">
                <span className="truncate">{attached.filename}</span>
                {attached.is_image && (
                  <span className="whitespace-nowrap rounded-full bg-cyan-50 px-1.5 py-0.5 text-[9px] font-bold text-cyan-600 border border-cyan-200">
                    صورة
                  </span>
                )}
                {attached.is_pdf && (
                  <span className="whitespace-nowrap rounded-full bg-rose-50 px-1.5 py-0.5 text-[9px] font-bold text-rose-600 border border-rose-200">
                    PDF
                  </span>
                )}
              </div>
              <div className="mt-0.5 line-clamp-2 text-[11px] font-cairo text-slate-500">
                {fileBusy ? (
                  <span className="text-cyan-600">جاري التحليل...</span>
                ) : attached.is_image && attached.text_summary ? (
                  <span>{attached.text_summary?.slice(0, 120)}...</span>
                ) : (
                  attached.notes
                )}
              </div>
              {attached.rows.length > 0 && !fileBusy && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {attached.headers.slice(0, 6).map((h) => (
                    <span key={h} className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-cairo text-slate-600">
                      {h}
                    </span>
                  ))}
                  {attached.headers.length > 6 && (
                    <span className="text-[9px] text-slate-400">+{attached.headers.length - 6}</span>
                  )}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => { setAttached(null); setFileError(null); }}
              className="shrink-0 text-lg text-slate-400 transition hover:text-red-500"
              aria-label="إزالة"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* File error */}
      {fileError && (
        <div className="border-t border-red-200 bg-red-50 px-4 py-2 text-xs font-cairo text-red-700">
          ⚠ {fileError}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-slate-100 bg-slate-50/50 p-3">
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv,.pdf,.png,.jpg,.jpeg,.gif,.webp,application/pdf,image/*"
          onChange={(e) => handleFilePick(e.target.files?.[0])}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading || fileBusy}
          title="ارفع ملف أو صورة"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-lg text-slate-600 transition hover:border-brand-cyan hover:text-brand-cyan-dark disabled:opacity-50"
        >
          {fileBusy ? (
            <span className="flex gap-0.5">
              {[0, 150, 300].map((d) => (
                <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: `${d}ms` }} />
              ))}
            </span>
          ) : (
            "📎"
          )}
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            attached
              ? attached.is_image
                ? "اطلب من الـ AI يحلل الصورة دي..."
                : "اطلب من الـ AI يعمل بالملف ده إيه..."
              : "اطلب أي حاجة — رتبات، موظفين، حضور، تحليلات..."
          }
          disabled={isLoading}
          className="flex-1 rounded-xl border border-slate-200 px-4 py-3 font-cairo text-slate-900 outline-none transition focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={isLoading || (!input.trim() && !attached)}
          className="rounded-xl bg-gradient-to-r from-brand-cyan to-brand-cyan-dark px-5 py-3 font-bold font-cairo text-white shadow-md transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? "..." : "ابعت"}
        </button>
      </form>
    </div>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────
function MessageBubble({
  message,
  renderToolOutput,
}: {
  message: UIMessage;
  renderToolOutput: (toolName: string, output: unknown) => React.ReactNode;
}) {
  const isUser = message.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
          isUser
            ? "bg-gradient-to-br from-brand-cyan to-brand-cyan-dark text-white"
            : "bg-gradient-to-br from-amber-400 to-amber-600 text-white"
        }`}
      >
        {isUser ? "أ" : "🤖"}
      </div>
      <div className={`flex max-w-[85%] flex-col gap-2 ${isUser ? "items-end" : "items-start"}`}>
        {message.parts.map((part, idx) => {
          if (part.type === "text" && "text" in part) {
            return (
              <div
                key={idx}
                className={`rounded-2xl px-4 py-3 font-cairo text-sm leading-relaxed whitespace-pre-wrap ${
                  isUser
                    ? "bg-brand-cyan/10 text-slate-800"
                    : "bg-slate-50 text-slate-800"
                }`}
              >
                {part.text}
              </div>
            );
          }
          if (isToolPart(part)) {
            const toolName = getToolName(part);
            const label = TOOL_LABELS[toolName] ?? { running: toolName, done: toolName, icon: "⚙" };
            const isRunning = part.state === "input-streaming" || part.state === "input-available";
            const hasOutput = part.state === "output-available";
            const hasError = part.state === "output-error";
            return (
              <div key={idx} className="max-w-md rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-cairo shadow-sm">
                <div className="flex items-center gap-2 text-slate-700">
                  <span>{label.icon}</span>
                  <span className="font-bold">{isRunning ? `${label.running}...` : label.done}</span>
                  {isRunning && (
                    <span className="mr-auto flex gap-0.5">
                      {[0, 150, 300].map((d) => (
                        <span key={d} className="h-1 w-1 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: `${d}ms` }} />
                      ))}
                    </span>
                  )}
                </div>
                {hasOutput && renderToolOutput(toolName, part.output)}
                {hasError && <div className="mt-1 text-[11px] text-red-600">⚠ {part.errorText ?? "خطأ"}</div>}
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}
