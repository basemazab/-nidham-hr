"use client";

// ============================================================================
// Email Campaigns UI — write (AI) → recipients (import/export) → send.
// ============================================================================

import { useState, useTransition } from "react";
import type { EmailCampaign } from "@/lib/marketing-ai";
import {
  generateEmailAction,
  importEmailsAction,
  listEmailRecipientsAction,
  exportEmailsAction,
  sendTestEmailAction,
  sendCampaignAction,
} from "./actions";

function downloadCsv(name: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function EmailClient({ defaultBusiness = "" }: { defaultBusiness?: string }) {
  // composer
  const [business, setBusiness] = useState(defaultBusiness);
  const [goal, setGoal] = useState("");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState("");
  const [campaign, setCampaign] = useState<EmailCampaign | null>(null);
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [genErr, setGenErr] = useState<string | null>(null);
  const [generating, startGen] = useTransition();

  // sender + recipients
  const [fromName, setFromName] = useState("");
  const [status, setStatus] = useState("all");
  const [source, setSource] = useState("all");
  const [count, setCount] = useState<number | null>(null);
  const [importText, setImportText] = useState("");
  const [recMsg, setRecMsg] = useState<string | null>(null);
  const [recErr, setRecErr] = useState<string | null>(null);
  const [loadingRec, startRec] = useTransition();
  const [importing, startImport] = useTransition();

  // send
  const [testTo, setTestTo] = useState("");
  const [sendMsg, setSendMsg] = useState<string | null>(null);
  const [sendErr, setSendErr] = useState<string | null>(null);
  const [sending, startSend] = useTransition();

  function gen() {
    setGenErr(null);
    startGen(async () => {
      const out = await generateEmailAction({ business, goal, audience, tone });
      if (!out.ok) {
        setGenErr(out.error);
        return;
      }
      setCampaign(out.campaign);
      setSubject(out.campaign.subject_lines[0] ?? "");
      setBodyHtml(out.campaign.body_html ?? "");
    });
  }

  function loadCount() {
    setRecErr(null);
    setRecMsg(null);
    startRec(async () => {
      const out = await listEmailRecipientsAction({ status, source, limit: 2000 });
      if (!out.ok) {
        setRecErr(out.error);
        setCount(null);
        return;
      }
      setCount(out.recipients.length);
    });
  }

  function runImport() {
    setRecErr(null);
    setRecMsg(null);
    startImport(async () => {
      const out = await importEmailsAction(importText);
      if (!out.ok) {
        setRecErr(out.error);
        return;
      }
      setRecMsg(`تم استيراد ${out.inserted} إيميل${out.skipped ? ` (${out.skipped} مكرر اتخطّى)` : ""}.`);
      if (out.inserted > 0) setImportText("");
      setCount(null);
    });
  }

  function exportList() {
    startRec(async () => {
      const out = await exportEmailsAction({ status, source });
      if (!out.ok) {
        setRecErr(out.error);
        return;
      }
      if (out.count === 0) {
        setRecMsg("مفيش إيميلات في الفلتر ده.");
        return;
      }
      downloadCsv("nidham-email-list.csv", out.csv);
      setRecMsg(`تم تنزيل ${out.count} إيميل (ارفعه في Brevo/Mailchimp).`);
    });
  }

  function sendTest() {
    setSendErr(null);
    setSendMsg(null);
    startSend(async () => {
      const out = await sendTestEmailAction({ to: testTo, subject, html: bodyHtml, fromName });
      if (!out.ok) {
        setSendErr(out.error);
        return;
      }
      setSendMsg(`اتبعت تجربة لـ ${testTo} ✓`);
    });
  }

  function sendCampaign() {
    setSendErr(null);
    setSendMsg(null);
    startSend(async () => {
      const out = await sendCampaignAction({ subject, html: bodyHtml, fromName, status, source });
      if (!out.ok) {
        setSendErr(out.error);
        return;
      }
      setSendMsg(
        `اتبعت ${out.sent} إيميل${out.failed ? ` · فشل ${out.failed}` : ""}${out.remaining ? ` · فاضل ${out.remaining} (ابعت دفعة تانية)` : ""}.`,
      );
      setCount(out.remaining);
    });
  }

  const canSend = subject.trim().length > 1 && bodyHtml.trim().length > 10;

  return (
    <div className="space-y-5">
      {/* 1) Composer */}
      <section className="bg-white border-2 border-indigo-200 rounded-2xl p-5">
        <h2 className="font-black font-cairo text-slate-800 mb-1 flex items-center gap-2">
          ✍️ اكتب الحملة <span className="text-xs font-normal text-slate-400">(AI)</span>
        </h2>
        <p className="text-xs text-slate-500 font-cairo mb-3">
          الحملة بتتكتب عن <strong>منتجك إنت</strong> — عناوين + جسم جاهز.
        </p>
        <label className="block text-[11px] font-bold text-slate-600 mb-1 font-cairo">
          منتجك / خدمتك <span className="text-rose-500">*</span>
        </label>
        <textarea
          value={business}
          onChange={(e) => setBusiness(e.target.value)}
          rows={2}
          placeholder="مثلاً: أبواب WPC مقاومة للمياه بضمان 5 سنين"
          className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-400 outline-none text-sm font-cairo resize-y mb-3"
        />
        <div className="grid sm:grid-cols-3 gap-2 mb-3">
          <input
            type="text"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="هدف الحملة (عرض/منتج جديد)"
            className="px-3 py-2 rounded-lg border border-slate-200 outline-none text-sm font-cairo"
          />
          <input
            type="text"
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            placeholder="الجمهور (اختياري)"
            className="px-3 py-2 rounded-lg border border-slate-200 outline-none text-sm font-cairo"
          />
          <input
            type="text"
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            placeholder="النبرة (اختياري)"
            className="px-3 py-2 rounded-lg border border-slate-200 outline-none text-sm font-cairo"
          />
        </div>
        <button
          onClick={gen}
          disabled={generating}
          className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold font-cairo text-sm"
        >
          {generating ? "بيكتب…" : "✨ ولّد الحملة"}
        </button>
        {genErr && (
          <div className="mt-3 bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-700 font-cairo">
            {genErr}
          </div>
        )}

        {campaign && (
          <div className="mt-4 space-y-3">
            <div>
              <span className="block text-[11px] font-bold text-slate-600 mb-1 font-cairo">
                اختار العنوان
              </span>
              <div className="space-y-1">
                {campaign.subject_lines.map((s, i) => (
                  <label key={i} className="flex items-center gap-2 text-sm font-cairo cursor-pointer">
                    <input
                      type="radio"
                      name="subject"
                      checked={subject === s}
                      onChange={() => setSubject(s)}
                    />
                    {s}
                  </label>
                ))}
              </div>
              {campaign.preview_text && (
                <p className="text-[11px] text-slate-400 font-cairo mt-1">
                  معاينة: {campaign.preview_text}
                </p>
              )}
            </div>
            <div>
              <span className="block text-[11px] font-bold text-slate-600 mb-1 font-cairo">
                جسم الإيميل (تقدر تعدّله)
              </span>
              <textarea
                value={bodyHtml}
                onChange={(e) => setBodyHtml(e.target.value)}
                rows={8}
                dir="rtl"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-400 outline-none text-sm font-cairo resize-y"
              />
            </div>
          </div>
        )}
      </section>

      {/* 2) Recipients */}
      <section className="bg-white border-2 border-slate-200 rounded-2xl p-5">
        <h2 className="font-black font-cairo text-slate-800 mb-3">📋 القائمة</h2>
        <div className="grid sm:grid-cols-3 gap-2 mb-2">
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 outline-none text-sm font-cairo"
          >
            <option value="all">كل المصادر</option>
            <option value="email_import">إيميلات مستوردة</option>
            <option value="landing_page">صفحات الهبوط</option>
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 outline-none text-sm font-cairo"
          >
            <option value="all">كل الحالات</option>
            <option value="lead">جديد</option>
            <option value="contacted">اتواصلنا</option>
          </select>
          <button
            onClick={loadCount}
            disabled={loadingRec}
            className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-800 disabled:opacity-50 text-white font-bold font-cairo text-sm"
          >
            {loadingRec ? "…" : "احسب العدد"}
          </button>
        </div>
        {count !== null && (
          <p className="text-sm text-slate-700 font-cairo mb-2">
            📨 {count} إيميل في الفلتر ده
          </p>
        )}

        <label className="block text-[11px] font-bold text-slate-600 mb-1 mt-2 font-cairo">
          استيراد إيميلات (كل واحد في سطر — بدون مفتاح جوجل)
        </label>
        <textarea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          rows={3}
          dir="ltr"
          placeholder={"ahmed@example.com\nشركة النور info@noor.com"}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none text-sm font-mono resize-y mb-2"
        />
        <div className="flex flex-wrap gap-2">
          <button
            onClick={runImport}
            disabled={importing || importText.trim().length === 0}
            className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-800 disabled:opacity-50 text-white font-bold font-cairo text-sm"
          >
            {importing ? "بيستورد…" : "استورد"}
          </button>
          <button
            onClick={exportList}
            disabled={loadingRec}
            className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold font-cairo text-sm"
          >
            ⬇️ تصدير CSV (لـ Brevo)
          </button>
        </div>
        {recMsg && (
          <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-700 font-cairo">
            {recMsg}
          </div>
        )}
        {recErr && (
          <div className="mt-3 bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-700 font-cairo">
            {recErr}
          </div>
        )}
      </section>

      {/* 3) Send */}
      <section className="bg-white border-2 border-emerald-200 rounded-2xl p-5">
        <h2 className="font-black font-cairo text-slate-800 mb-3">🚀 الإرسال</h2>
        <label className="block text-[11px] font-bold text-slate-600 mb-1 font-cairo">
          اسم المُرسِل (شركتك) — هيظهر للعميل
        </label>
        <input
          type="text"
          value={fromName}
          onChange={(e) => setFromName(e.target.value)}
          placeholder="مثلاً: أبواب النور"
          className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none text-sm font-cairo mb-3"
        />

        <div className="flex flex-col sm:flex-row gap-2 mb-3">
          <input
            type="email"
            value={testTo}
            onChange={(e) => setTestTo(e.target.value)}
            dir="ltr"
            placeholder="ابعت تجربة لإيميلك"
            className="flex-1 px-3 py-2 rounded-lg border border-slate-200 outline-none text-sm font-cairo"
          />
          <button
            onClick={sendTest}
            disabled={sending || !canSend}
            className="px-4 py-2 rounded-lg border border-emerald-300 hover:bg-emerald-50 text-emerald-700 font-bold font-cairo text-sm whitespace-nowrap"
          >
            ✉️ تجربة
          </button>
        </div>

        <button
          onClick={sendCampaign}
          disabled={sending || !canSend}
          className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold font-cairo text-sm"
        >
          {sending ? "بيبعت…" : "🚀 ابعت للقائمة (حتى 50 في المرة)"}
        </button>

        {sendMsg && (
          <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-700 font-cairo">
            {sendMsg}
          </div>
        )}
        {sendErr && (
          <div className="mt-3 bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-700 font-cairo leading-relaxed">
            {sendErr}
          </div>
        )}

        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3 text-[11px] text-amber-800 font-cairo leading-relaxed">
          🛡️ الإرسال بيشتغل لو فيه <code className="font-mono">RESEND_API_KEY</code> + دومين موثّق.
          للقوائم الكبيرة يُفضّل تنزّل CSV وتستخدم Brevo (مجاني 300/يوم) — بيتكفّل بالوصول
          وزر إلغاء الاشتراك تلقائيًا.
        </div>
      </section>
    </div>
  );
}
