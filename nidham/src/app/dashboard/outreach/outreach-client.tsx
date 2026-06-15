"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  OUTREACH_TEMPLATES,
  LEAD_STATUSES,
  statusMeta,
  fillTemplate,
  toWhatsAppLink,
  type OutreachLead,
  type LeadStatus,
} from "@/lib/outreach";
import {
  seedStarterLeads,
  importLeadsFromText,
  importFromCustomers,
  repairLeadNames,
  setLeadStatus,
  markContacted,
  updateLeadNotes,
  deleteLead,
} from "./actions";
import {
  Users,
  Phone,
  Trash2,
  Plus,
  Search,
  Upload,
  Info,
  MessageCircle,
  StickyNote,
  Download,
} from "lucide-react";

const DAILY_CAP = 15;

// Stable per-lead hash so each lead consistently gets one message variant, but
// different leads get different ones (less "copy-paste blast" look → safer).
function hashIdx(id: string, n: number): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return n > 0 ? h % n : 0;
}

// "auto" → rotate templates per lead; otherwise force the chosen one for all.
function templateForLead(tplKey: string, leadId: string) {
  if (tplKey === "auto") return OUTREACH_TEMPLATES[hashIdx(leadId, OUTREACH_TEMPLATES.length)];
  return OUTREACH_TEMPLATES.find((t) => t.key === tplKey) ?? OUTREACH_TEMPLATES[0];
}

function isToday(iso: string | null): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  const n = new Date();
  return (
    d.getFullYear() === n.getFullYear() &&
    d.getMonth() === n.getMonth() &&
    d.getDate() === n.getDate()
  );
}

export function OutreachClient({
  leads,
  isSuperAdmin,
}: {
  leads: OutreachLead[];
  isSuperAdmin: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [tplKey, setTplKey] = useState("auto");
  const [filter, setFilter] = useState<LeadStatus | "all">("all");
  const [q, setQ] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [notice, setNotice] = useState("");

  const tpl = OUTREACH_TEMPLATES.find((t) => t.key === tplKey) ?? OUTREACH_TEMPLATES[0];

  const sentToday = useMemo(() => leads.filter((l) => isToday(l.last_contacted_at)).length, [leads]);
  const counts = useMemo(() => {
    const m: Record<string, number> = { all: leads.length };
    for (const s of LEAD_STATUSES) m[s.key] = 0;
    for (const l of leads) m[l.status] = (m[l.status] ?? 0) + 1;
    return m;
  }, [leads]);

  // Rows whose name came through as a bare serial number (mis-parsed import).
  const badCount = useMemo(
    () => leads.filter((l) => /^\d{1,4}$/.test((l.name ?? "").trim())).length,
    [leads],
  );

  const shown = useMemo(() => {
    const needle = q.trim();
    return leads.filter((l) => {
      if (filter !== "all" && l.status !== filter) return false;
      if (needle && !`${l.name} ${l.sector ?? ""} ${l.city ?? ""} ${l.phone ?? ""}`.includes(needle))
        return false;
      return true;
    });
  }, [leads, filter, q]);

  function refresh() {
    startTransition(() => router.refresh());
  }

  async function onSeed() {
    setNotice("");
    const r = await seedStarterLeads();
    setNotice(r.added > 0 ? `تمت إضافة ${r.added} عميل جديد ✅` : "كل العملاء الجاهزين مضافين بالفعل");
    refresh();
  }

  async function onImportCustomers() {
    setNotice("");
    const r = await importFromCustomers();
    setNotice(
      r.added > 0
        ? `تمت إضافة ${r.added} من العملاء ✅${r.withoutPhone ? ` (${r.withoutPhone} بدون رقم اتجاهلوا)` : ""}`
        : "كل العملاء اللي ليهم رقم مضافين بالفعل",
    );
    refresh();
  }

  async function onRepair() {
    setNotice("");
    const r = await repairLeadNames();
    setNotice(r.fixed > 0 ? `تم إصلاح ${r.fixed} اسم ✅` : "مفيش أسماء محتاجة إصلاح");
    refresh();
  }

  async function onImport(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const r = await importLeadsFromText(fd);
    setNotice(`تمت إضافة ${r.added} عميل ✅`);
    setImportText("");
    setShowImport(false);
    refresh();
  }

  const inp =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-800";

  return (
    <div dir="rtl" className="mx-auto max-w-5xl space-y-5 font-cairo">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">العملاء المحتملين</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              ابعت رسالتك بضغطة من واتساب بتاعك، وتابع كل عميل لحد ما يبقى صفقة.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onImportCustomers}
            disabled={pending}
            className="flex items-center gap-1.5 rounded-lg border border-cyan-300 bg-cyan-50 px-3 py-2 text-sm font-bold text-cyan-700 hover:bg-cyan-100 disabled:opacity-50 dark:border-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-300"
          >
            <Download className="h-4 w-4" /> استورد من العملاء
          </button>
          <button
            onClick={() => setShowImport((s) => !s)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-600 hover:border-cyan-400 dark:border-slate-700 dark:text-slate-300"
          >
            <Upload className="h-4 w-4" /> استيراد
          </button>
          {leads.length === 0 && isSuperAdmin && (
            <button
              onClick={onSeed}
              disabled={pending}
              className="flex items-center gap-1.5 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-bold text-white hover:bg-cyan-700 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" /> حمّل الـ 63 عميل الجاهزين
            </button>
          )}
        </div>
      </div>

      {/* Safety note */}
      <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          إنت اللي بتبعت بإيدك — النظام بيجهّز الرسالة بس. ابعت <strong>{DAILY_CAP}</strong> في
          اليوم على الأكثر وغيّر الصيغة شوية، عشان رقم الواتساب ما يتحظرش.
        </span>
      </div>

      {notice && (
        <div className="rounded-lg bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
          {notice}
        </div>
      )}

      {badCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm dark:border-amber-800 dark:bg-amber-900/20">
          <span className="text-amber-900 dark:text-amber-300">
            🛠 في {badCount} صف ظهر فيه رقم بدل اسم الشركة (استيراد قديم اتفهم غلط).
          </span>
          <button
            onClick={onRepair}
            disabled={pending}
            className="shrink-0 rounded-lg bg-amber-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-amber-700 disabled:opacity-50"
          >
            إصلاح الأسماء تلقائيًا
          </button>
        </div>
      )}

      {/* Import box */}
      {showImport && (
        <form onSubmit={onImport} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
              الصق عملاء (كل سطر: الاسم، التليفون، المجال)
            </label>
            {leads.length > 0 && isSuperAdmin && (
              <button type="button" onClick={onSeed} disabled={pending} className="text-xs font-bold text-cyan-600 hover:underline">
                + حمّل الـ 63 الجاهزين
              </button>
            )}
          </div>
          <textarea
            name="text"
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            rows={5}
            dir="rtl"
            placeholder={"مصنع النور, 01000000000, بلاستيك\nعيادة الشفاء, 01100000000, مركز طبي"}
            className={inp + " font-mono"}
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowImport(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-600 dark:border-slate-700 dark:text-slate-300">
              إلغاء
            </button>
            <button type="submit" disabled={pending || !importText.trim()} className="rounded-lg bg-cyan-600 px-5 py-2 text-sm font-bold text-white hover:bg-cyan-700 disabled:opacity-50">
              استيراد
            </button>
          </div>
        </form>
      )}

      {/* Template picker + daily counter */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="min-w-[260px] flex-1">
          <label className="mb-1 block text-xs font-bold text-slate-500">الرسالة اللي هتتبعت (بتتعبّى باسم الشركة)</label>
          <select value={tplKey} onChange={(e) => setTplKey(e.target.value)} className={inp}>
            <option value="auto">🔀 تلقائي — رسالة مختلفة لكل عميل (موصى به)</option>
            {OUTREACH_TEMPLATES.map((t) => (
              <option key={t.key} value={t.key}>{t.label} (ثابتة للكل)</option>
            ))}
          </select>
        </div>
        <div className="text-center">
          <div className="text-xs font-bold text-slate-500">بعتّ النهاردة</div>
          <div className={`text-2xl font-black tabular-nums ${sentToday >= DAILY_CAP ? "text-rose-600" : "text-cyan-700 dark:text-cyan-300"}`}>
            {sentToday}<span className="text-sm text-slate-400">/{DAILY_CAP}</span>
          </div>
        </div>
      </div>

      <p className="-mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:bg-slate-800/40" dir="rtl">
        {tplKey === "auto" ? "بتتنوّع تلقائيًا بين 3 صيغ — مثال: " : "معاينة: "}
        {fillTemplate(tpl.text, "شركة النور").split("\n")[0]}…
      </p>

      {/* Status filter chips */}
      <div className="flex flex-wrap gap-2">
        <Chip active={filter === "all"} onClick={() => setFilter("all")} label={`الكل ${counts.all}`} />
        {LEAD_STATUSES.map((s) => (
          <Chip key={s.key} active={filter === s.key} onClick={() => setFilter(s.key)} label={`${s.label} ${counts[s.key] ?? 0}`} />
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث باسم/مجال/مدينة/رقم" className={inp + " pr-9"} />
      </div>

      {/* Empty */}
      {leads.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-700">
          <MessageCircle className="mx-auto mb-4 h-8 w-8 text-slate-300" />
          <p className="mb-1 font-bold text-slate-600 dark:text-slate-300">لسه مفيش عملاء محتملين</p>
          {isSuperAdmin ? (
            <>
              <p className="mb-4 text-sm text-slate-400">حمّل الـ 63 عميل الجاهزين أو استورد قائمتك.</p>
              <button onClick={onSeed} disabled={pending} className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-bold text-white hover:bg-cyan-700 disabled:opacity-50">
                <Plus className="h-4 w-4" /> حمّل الـ 63 عميل
              </button>
            </>
          ) : (
            <>
              <p className="mb-4 text-sm text-slate-400">استورد عملاءك من زر «استورد من العملاء» فوق، أو «استيراد» لقائمتك (اسم، تليفون).</p>
              <button onClick={() => setShowImport(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-bold text-white hover:bg-cyan-700">
                <Upload className="h-4 w-4" /> استيراد قائمتك
              </button>
            </>
          )}
        </div>
      )}

      {/* Leads */}
      <div className="space-y-2">
        {shown.map((lead) => (
          <LeadRow
            key={lead.id}
            lead={lead}
            message={fillTemplate(templateForLead(tplKey, lead.id).text, lead.name)}
            onChange={refresh}
          />
        ))}
      </div>
    </div>
  );
}

function Chip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-bold transition ${
        active ? "bg-cyan-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
      }`}
    >
      {label}
    </button>
  );
}

function LeadRow({ lead, message, onChange }: { lead: OutreachLead; message: string; onChange: () => void }) {
  const [, startTransition] = useTransition();
  const [notes, setNotes] = useState(lead.notes ?? "");
  const [openNotes, setOpenNotes] = useState(false);
  const meta = statusMeta(lead.status);
  // Show WhatsApp for ANY usable number (normalizes +20 / 0 / spaces). Falls
  // back to a call link only when no number can form a wa.me link at all.
  const waLink = toWhatsAppLink(lead.phone, message);

  function act(fn: () => Promise<unknown>) {
    startTransition(async () => {
      await fn();
      onChange();
    });
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-black text-slate-900 dark:text-white">{lead.name}</span>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${meta.cls}`}>{meta.label}</span>
            {lead.last_contacted_at && (
              <span className="text-[11px] text-slate-400">آخر تواصل: {new Date(lead.last_contacted_at).toLocaleDateString("ar-EG")}</span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            {lead.sector && <span>{lead.sector}</span>}
            {lead.city && <span>· {lead.city}</span>}
            {lead.phone && <span dir="ltr" className="font-mono">{lead.phone}</span>}
            {lead.source && <span className="text-slate-400">· {lead.source}</span>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {waLink ? (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => act(() => markContacted(lead.id))}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-700"
            >
              <MessageCircle className="h-4 w-4" /> واتساب
            </a>
          ) : lead.phone ? (
            <a href={`tel:${lead.phone}`} className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-600 dark:border-slate-700 dark:text-slate-300">
              <Phone className="h-4 w-4" /> اتصال
            </a>
          ) : null}

          <select
            value={lead.status}
            onChange={(e) => act(() => setLeadStatus(lead.id, e.target.value as LeadStatus))}
            className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            {LEAD_STATUSES.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>

          <button onClick={() => setOpenNotes((o) => !o)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="ملاحظات">
            <StickyNote className="h-4 w-4" />
          </button>
          <button
            onClick={() => { if (confirm("حذف العميل ده؟")) act(() => deleteLead(lead.id)); }}
            className="rounded-lg p-2 text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20"
            aria-label="حذف"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {openNotes && (
        <div className="mt-3 flex gap-2">
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="ملاحظات (مثلاً: طلب أكلمه بكرة، مهتم بالحضور...)"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-800"
          />
          <button onClick={() => act(() => updateLeadNotes(lead.id, notes))} className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-bold text-white hover:bg-cyan-700">
            حفظ
          </button>
        </div>
      )}
    </div>
  );
}
