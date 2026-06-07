"use client";

// ============================================================================
// Broadcast UI — pick a segment, preview size, send, or tag it for reuse.
// ============================================================================

import { useState, useTransition } from "react";
import {
  previewBroadcastAction,
  sendBroadcastAction,
  tagSegmentAction,
  type Segment,
} from "./actions";

export function BroadcastClient() {
  const [channel, setChannel] = useState("all");
  const [status, setStatus] = useState("all");
  const [leadQuality, setLeadQuality] = useState("all");
  const [tag, setTag] = useState("");

  const [message, setMessage] = useState("");
  const [count, setCount] = useState<number | null>(null);
  const [newTag, setNewTag] = useState("");

  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [previewing, startPreview] = useTransition();
  const [sending, startSend] = useTransition();
  const [tagging, startTag] = useTransition();

  function segment(): Segment {
    return { channel, status, leadQuality, tag: tag.trim() };
  }

  function preview() {
    setErr(null);
    setMsg(null);
    startPreview(async () => {
      const out = await previewBroadcastAction(segment());
      if (!out.ok) {
        setErr(out.error);
        setCount(null);
        return;
      }
      setCount(out.count);
    });
  }

  function send() {
    setErr(null);
    setMsg(null);
    startSend(async () => {
      const out = await sendBroadcastAction({ message, segment: segment() });
      if (!out.ok) {
        setErr(out.error);
        return;
      }
      setMsg(
        `اتبعت ${out.sent}${out.failed ? ` · فشل ${out.failed} (غالبًا مرّ عليهم 24 ساعة)` : ""}${out.remaining ? ` · فاضل ${out.remaining} (اضغط ابعت تاني)` : ""}.`,
      );
      setCount(out.remaining);
    });
  }

  function applyTag() {
    setErr(null);
    setMsg(null);
    startTag(async () => {
      const out = await tagSegmentAction({ segment: segment(), tag: newTag });
      if (!out.ok) {
        setErr(out.error);
        return;
      }
      setMsg(`تم وسم ${out.tagged} محادثة بـ «${newTag}». تقدر تفلتر بيها بعدين.`);
      setNewTag("");
    });
  }

  const canSend = message.trim().length > 1;

  return (
    <div className="space-y-5">
      {/* Segment */}
      <section className="bg-white border-2 border-fuchsia-200 rounded-2xl p-5">
        <h2 className="font-black font-cairo text-slate-800 mb-3">🎯 الشريحة</h2>
        <div className="grid sm:grid-cols-2 gap-2 mb-3">
          <label className="block">
            <span className="block text-[11px] font-bold text-slate-600 mb-1 font-cairo">القناة</span>
            <select value={channel} onChange={(e) => setChannel(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-cairo">
              <option value="all">الكل</option>
              <option value="messenger">ماسنجر</option>
              <option value="instagram">إنستجرام</option>
            </select>
          </label>
          <label className="block">
            <span className="block text-[11px] font-bold text-slate-600 mb-1 font-cairo">الحالة</span>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-cairo">
              <option value="all">الكل</option>
              <option value="open">مفتوحة</option>
              <option value="ai_replied">رد عليها AI</option>
              <option value="human_replied">رد عليها بشري</option>
              <option value="qualified">مؤهّلة</option>
            </select>
          </label>
          <label className="block">
            <span className="block text-[11px] font-bold text-slate-600 mb-1 font-cairo">جودة العميل</span>
            <select value={leadQuality} onChange={(e) => setLeadQuality(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-cairo">
              <option value="all">الكل</option>
              <option value="hot">ساخن 🔥</option>
              <option value="warm">دافئ</option>
              <option value="cold">بارد</option>
            </select>
          </label>
          <label className="block">
            <span className="block text-[11px] font-bold text-slate-600 mb-1 font-cairo">تاج (اختياري)</span>
            <input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="مثلاً: مهتم-بالأسعار" className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-cairo" />
          </label>
        </div>
        <button
          onClick={preview}
          disabled={previewing}
          className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-800 disabled:opacity-50 text-white font-bold font-cairo text-sm"
        >
          {previewing ? "…" : "احسب الجمهور"}
        </button>
        {count !== null && (
          <span className="ms-3 text-sm font-bold text-slate-700 font-cairo">📨 {count} محادثة</span>
        )}

        {/* Tag this segment */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-end gap-2">
          <label className="block flex-1 min-w-[160px]">
            <span className="block text-[11px] font-bold text-slate-600 mb-1 font-cairo">وسم الشريحة دي (عشان تعيد استخدامها)</span>
            <input value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="اسم التاج الجديد" className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-cairo" />
          </label>
          <button
            onClick={applyTag}
            disabled={tagging || newTag.trim().length === 0}
            className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold font-cairo text-sm"
          >
            {tagging ? "…" : "🏷️ وسم"}
          </button>
        </div>
      </section>

      {/* Message + send */}
      <section className="bg-white border-2 border-emerald-200 rounded-2xl p-5">
        <h2 className="font-black font-cairo text-slate-800 mb-3">✉️ الرسالة</h2>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          placeholder="اكتب رسالة البثّ هنا..."
          className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-emerald-400 outline-none text-sm font-cairo resize-y mb-3"
        />
        <button
          onClick={send}
          disabled={sending || !canSend}
          className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold font-cairo text-sm"
        >
          {sending ? "بيبعت…" : "🚀 ابعت للشريحة (حتى 50 في المرة)"}
        </button>

        {msg && (
          <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-700 font-cairo">{msg}</div>
        )}
        {err && (
          <div className="mt-3 bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-700 font-cairo leading-relaxed">{err}</div>
        )}

        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3 text-[11px] text-amber-800 font-cairo leading-relaxed">
          🛡️ ماسنجر/إنستجرام بيوصّلوا الرسالة بس جوه <b>24 ساعة</b> من آخر تفاعل للعميل (سياسة Meta).
          اللي مرّ عليهم أكتر هيتعدّوا كـ«فشل» — ده طبيعي. للوصول خارج النافذة محتاج توثيق Meta + Message Tags.
        </div>
      </section>
    </div>
  );
}
