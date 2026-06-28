"use client";

import { useState } from "react";

// Egyptian phone → wa.me international form (digits, no +). Mirrors the helper
// used on the applicant page.
function waNumber(raw: string): string {
  let d = (raw || "").replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("20")) return d;
  if (d.startsWith("0")) return "20" + d.slice(1);
  if (d.length === 10 && d.startsWith("1")) return "20" + d;
  return d;
}

type Tone = "green" | "slate" | "blue";

type Props = {
  phone: string | null;
  firstName: string;
  companyName: string;
  jobTitle: string;
  // Pre-formatted interview slot (plain Arabic wall-clock) computed server-side
  // to avoid any hydration/timezone mismatch. May be empty.
  defaultWhen: string;
};

export function ApplicantMessageTemplates({
  phone,
  firstName,
  companyName,
  jobTitle,
  defaultWhen,
}: Props) {
  const [when, setWhen] = useState(defaultWhen);
  const [address, setAddress] = useState("");

  if (!phone) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6">
        <h3 className="text-base font-bold text-slate-800 mb-1 font-cairo">
          📨 رسائل واتساب جاهزة
        </h3>
        <p className="text-sm text-slate-500 font-cairo">
          مفيش رقم موبايل للمتقدم — ضيف رقمه عشان تقدر تبعتله واتساب.
        </p>
      </div>
    );
  }

  const wa = waNumber(phone);
  const link = (msg: string) => `https://wa.me/${wa}?text=${encodeURIComponent(msg)}`;

  const w = when.trim();
  const a = address.trim();

  const templates: { key: string; label: string; msg: string; tone: Tone }[] = [
    {
      key: "interview_scheduled",
      label: "📅 دعوة مقابلة — بموعد وعنوان",
      tone: "green",
      msg:
        `السلام عليكم ${firstName} 👋\n\n` +
        `معاك فريق الموارد البشرية في ${companyName}.\n` +
        `يسعدنا دعوتك لمقابلة شخصية لوظيفة «${jobTitle}».\n\n` +
        (w ? `🗓️ الموعد: ${w}\n` : "") +
        (a ? `📍 العنوان: ${a}\n` : "") +
        `\nبرجاء تأكيد حضورك بالرد على الرسالة. في انتظارك 🌟`,
    },
    {
      key: "interview_open",
      label: "💬 دعوة مقابلة — مفتوحة",
      tone: "green",
      msg:
        `السلام عليكم ${firstName} 👋\n\n` +
        `معاك فريق الموارد البشرية في ${companyName}.\n` +
        `شكرًا لتقديمك على وظيفة «${jobTitle}» — سيرتك الذاتية لفتت انتباهنا 🌟\n\n` +
        `حابين نحدّد معاك موعد مقابلة. ياريت تقولنا الأيام والمواعيد اللي تناسبك خلال الأيام الجاية.\n\n` +
        `في انتظار ردك، وشكرًا.`,
    },
    {
      key: "documents",
      label: "📎 طلب مستندات",
      tone: "blue",
      msg:
        `السلام عليكم ${firstName} 👋\n\n` +
        `معاك فريق الموارد البشرية في ${companyName}.\n` +
        `علشان نكمّل إجراءات التقديم لوظيفة «${jobTitle}»، محتاجين منك المستندات دي:\n` +
        `• صورة بطاقة الرقم القومي\n• آخر مؤهل دراسي\n• صورة شخصية حديثة\n\n` +
        `ياريت ترسلها في أقرب وقت. شكرًا لتعاونك 🙏`,
    },
    {
      key: "reminder",
      label: "🔔 تذكير بالمقابلة",
      tone: "blue",
      msg:
        `تذكير ودّي 🔔\n\n` +
        `أهلاً ${firstName}، بنفكّرك بموعد مقابلتك لوظيفة «${jobTitle}» في ${companyName}${w ? ` — ${w}` : ""}.\n` +
        (a ? `📍 العنوان: ${a}\n` : "") +
        `مستنينك، ولو في أي ظرف طارئ ياريت تطمنّا. شكرًا 🌟`,
    },
    {
      key: "rejection",
      label: "✉️ رسالة اعتذار",
      tone: "slate",
      msg:
        `السلام عليكم ${firstName} 🌟\n\n` +
        `معاك فريق الموارد البشرية في ${companyName}.\n` +
        `بنشكرك جدًا على اهتمامك ووقتك في التقديم على وظيفة «${jobTitle}».\n\n` +
        `بعد دراسة طلبك بعناية، اخترنا نمضي مع مرشحين أقرب لمتطلبات الوظيفة في الوقت الحالي — وده مش تقليل من خبرتك أو مؤهلاتك إطلاقًا.\n\n` +
        `هنحتفظ ببياناتك، ولو ظهرت فرصة مناسبة قدّام هنتواصل معاك. نتمنّالك كل التوفيق في مشوارك المهني 🙏`,
    },
  ];

  const toneClass: Record<Tone, string> = {
    green: "bg-[#25D366]/10 text-[#0b6b4f] border-[#25D366]/40 hover:bg-[#25D366]/20",
    slate: "bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6">
      <h3 className="text-base font-bold text-slate-800 mb-1 font-cairo">
        📨 رسائل واتساب جاهزة
      </h3>
      <p className="text-xs text-slate-500 font-cairo mb-4">
        اختَر رسالة وهتفتح في واتساب جاهزة للإرسال — تقدر تعدّلها قبل ما تبعت.
      </p>

      {/* Fill-in fields used by the dated invite + the reminder */}
      <div className="grid sm:grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-xs text-slate-500 mb-1 font-cairo">
            الموعد (للدعوة بموعد)
          </label>
          <input
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            placeholder="مثال: غدًا الساعة 10 ص"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan/20 outline-none transition text-slate-900 text-sm font-cairo"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1 font-cairo">العنوان</label>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="اكتب عنوان المقابلة"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan/20 outline-none transition text-slate-900 text-sm font-cairo"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {templates.map((t) => (
          <a
            key={t.key}
            href={link(t.msg)}
            target="_blank"
            rel="noopener noreferrer"
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition font-cairo ${toneClass[t.tone]}`}
          >
            {t.label}
          </a>
        ))}
      </div>

      {!w && (
        <p className="text-[11px] text-slate-400 font-cairo mt-3">
          💡 «الموعد» بيتعبّى تلقائيًا لو سجّلت موعد المقابلة في خانة الملاحظات تحت.
        </p>
      )}
    </div>
  );
}
