// ============================================================================
// أداة التواصل مع العملاء المحتملين — types, templates, WhatsApp deep-link
// ============================================================================
// Pure (client-safe) helpers. The actual sending is ALWAYS a manual tap on the
// user's own WhatsApp via a wa.me link — never automated (WhatsApp bans cold
// auto-blasting). We just pre-fill the message and track the pipeline.

export type LeadStatus =
  | "new"
  | "messaged"
  | "replied"
  | "demo"
  | "customer"
  | "not_interested";

export type OutreachLead = {
  id: string;
  name: string;
  phone: string | null;
  sector: string | null;
  city: string | null;
  website: string | null;
  email: string | null;
  status: LeadStatus;
  notes: string | null;
  source: string | null;
  last_contacted_at: string | null;
  created_at: string;
};

export const LEAD_STATUSES: {
  key: LeadStatus;
  label: string;
  cls: string;
}[] = [
  { key: "new", label: "جديد", cls: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" },
  { key: "messaged", label: "اتبعت", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  { key: "replied", label: "رد", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  { key: "demo", label: "ديمو", cls: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300" },
  { key: "customer", label: "عميل", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
  { key: "not_interested", label: "مش مهتم", cls: "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300" },
];

export function statusMeta(s: LeadStatus) {
  return LEAD_STATUSES.find((x) => x.key === s) ?? LEAD_STATUSES[0];
}

// First-touch message templates. `{name}` is replaced by the lead's name.
export const OUTREACH_TEMPLATES: { key: string; label: string; text: string }[] = [
  {
    key: "pain",
    label: "سؤال عن الوجع (موصى به)",
    text:
      "السلام عليكم 👋 سؤال سريع: مرتبات وتأمينات {name} بتتعمل على إكسيل ولا على نظام؟\n" +
      "أنا باسم — شغّال HR بنفسي — وعملت نظام مصري بيقفل المرتبات والتأمينات والحضور في ساعة بدل أيام، ومتوافق مع القانون ١٠٠٪.\n" +
      "لو حابب أوريك في دقيقتين إزاي، اكتبلي «مهتم» وأبعتلك 🙏",
  },
  {
    key: "loss",
    label: "الخسارة والغرامات",
    text:
      "السلام عليكم، بخصوص {name}.\n" +
      "غلطة واحدة في التأمينات أو الأوفر تايم ممكن تكلّف آلاف وغرامات. أنا باسم (HR)، عملت نظام مصري بيحسب المرتبات والتأمينات والحضور صح وأوتوماتيك — وتقدر تجرّبه شهر مجانًا على بياناتك، وأنا شخصيًا أظبّط أول دورة معاك.\n" +
      "اكتبلي «جرّب» ونبدأ.",
  },
  {
    key: "value",
    label: "عرض قيمة مجاني",
    text:
      "أهلاً، أنا باسم — خبير موارد بشرية. بعمل لـ {name} مراجعة سريعة مجانية لحساب التأمينات والضرايب (بنلاقي أخطاء بتكلّف فلوس في أغلب الحالات).\n" +
      "ولو حبيت، أوريك نظام بيعمل ده كله أوتوماتيك. أبعتلك التفاصيل؟",
  },
];

export function fillTemplate(text: string, name: string): string {
  return text.replaceAll("{name}", name || "حضرتك");
}

// Convert a local/intl Egyptian number to a wa.me deep-link with a pre-filled
// message. Returns null when there's no usable number (e.g. landline-less row).
export function toWhatsAppLink(phone: string | null, message: string): string | null {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (digits.length < 7) return null;
  let intl = digits;
  if (intl.startsWith("0")) intl = "20" + intl.slice(1);
  else if (!intl.startsWith("20")) intl = "20" + intl;
  return `https://wa.me/${intl}?text=${encodeURIComponent(message)}`;
}

// Egyptian mobiles start 010/011/012/015 (→ 2010…). Landlines (02…, 055…) can't
// receive WhatsApp — surface them as "call only".
export function isMobile(phone: string | null): boolean {
  const d = (phone ?? "").replace(/\D/g, "");
  const local = d.startsWith("20") ? "0" + d.slice(2) : d;
  return /^01[0125]\d{8}$/.test(local);
}
