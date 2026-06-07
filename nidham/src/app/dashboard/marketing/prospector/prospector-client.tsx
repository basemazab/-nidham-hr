"use client";

// ============================================================================
// Prospector UI — find businesses, import as leads, write AI openers, export
// a Bot-X-ready WhatsApp CSV. The "send" itself happens in Bot X.
// ============================================================================

import { useState, useTransition } from "react";
import type { ProspectResult } from "@/lib/prospecting";
import {
  searchProspectsAction,
  importProspectsAction,
  importManualAction,
  generateOutreachAction,
  listOutreachAction,
  exportBotXAction,
} from "./actions";

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function ProspectorClient() {
  return (
    <div className="space-y-5">
      <SearchSection />
      <ManualImportSection />
      <OutreachSection />
      <DirectReachSection />
      <ExportSection />
    </div>
  );
}

// ---------------------------------------------------------------------------
// 1) Search + import
// ---------------------------------------------------------------------------
function SearchSection() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProspectResult[]>([]);
  const [selected, setSelected] = useState<boolean[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [needKey, setNeedKey] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [searching, startSearch] = useTransition();
  const [importing, startImport] = useTransition();

  function runSearch() {
    setErr(null);
    setInfo(null);
    setNeedKey(false);
    startSearch(async () => {
      const out = await searchProspectsAction(query);
      if (!out.ok) {
        setErr(out.error);
        setNeedKey(!!out.needKey);
        setResults([]);
        setSelected([]);
        return;
      }
      setResults(out.results);
      setSelected(out.results.map(() => true));
      if (out.results.length === 0) setInfo("مفيش نتايج — جرّب كلمات أوضح أو منطقة تانية");
    });
  }

  function toggle(i: number) {
    setSelected((s) => s.map((v, idx) => (idx === i ? !v : v)));
  }
  function toggleAll(v: boolean) {
    setSelected(results.map(() => v));
  }

  function runImport() {
    const chosen = results.filter((_, i) => selected[i]);
    if (chosen.length === 0) {
      setInfo("اختار شركة واحدة على الأقل");
      return;
    }
    setInfo(null);
    startImport(async () => {
      const out = await importProspectsAction(chosen);
      if (!out.ok) {
        setErr(out.error);
        return;
      }
      setInfo(
        `تم استيراد ${out.inserted} عميل كـ Leads${out.skipped ? ` (${out.skipped} مكرر اتخطّى)` : ""}. تلاقيهم في Leads Inbox.`,
      );
    });
  }

  const selectedCount = selected.filter(Boolean).length;

  return (
    <section className="bg-white border-2 border-cyan-200 rounded-2xl p-5">
      <h2 className="font-black font-cairo text-slate-800 mb-1 flex items-center gap-2">
        🔎 الباحث عن العملاء <span className="text-xs font-normal text-slate-400">(جوجل ماب)</span>
      </h2>
      <p className="text-xs text-slate-500 font-cairo mb-4">
        اكتب نوع النشاط + المدينة وهات شركات حقيقية بأرقامها، واستوردهم كـ Leads بضغطة.
      </p>

      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") runSearch();
          }}
          placeholder="مثلاً: مصانع بلاستيك في العاشر من رمضان"
          className="flex-1 px-3 py-2 rounded-lg border border-slate-200 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 outline-none text-sm font-cairo"
        />
        <button
          onClick={runSearch}
          disabled={searching}
          className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white font-bold font-cairo text-sm whitespace-nowrap"
        >
          {searching ? "بيدور…" : "ابحث"}
        </button>
      </div>

      {err && (
        <div className="mb-3 bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-700 font-cairo leading-relaxed">
          {err}
          {needKey && (
            <div className="mt-2 text-rose-600">
              خطوات التفعيل: افتح Google Cloud Console → فعّل <b>Places API (New)</b> → أنشئ API
              key → ضيفه في Vercel باسم{" "}
              <code className="bg-rose-100 px-1 rounded font-mono" dir="ltr">
                GOOGLE_PLACES_API_KEY
              </code>
              .
            </div>
          )}
        </div>
      )}
      {info && (
        <div className="mb-3 bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-700 font-cairo">
          {info}
        </div>
      )}

      {results.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-slate-500 font-cairo">
              {results.length} نتيجة · محدد {selectedCount}
            </div>
            <div className="flex gap-2 text-xs">
              <button onClick={() => toggleAll(true)} className="text-cyan-700 font-bold font-cairo">
                تحديد الكل
              </button>
              <span className="text-slate-300">|</span>
              <button onClick={() => toggleAll(false)} className="text-slate-500 font-bold font-cairo">
                إلغاء الكل
              </button>
            </div>
          </div>
          <div className="overflow-x-auto border border-slate-200 rounded-lg mb-3">
            <table className="w-full text-xs font-cairo">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="p-2 w-8"></th>
                  <th className="p-2 text-right">الاسم</th>
                  <th className="p-2 text-right">واتساب</th>
                  <th className="p-2 text-right">التقييم</th>
                  <th className="p-2 text-right">العنوان</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={i} className="border-t border-slate-100 hover:bg-cyan-50/40">
                    <td className="p-2 text-center">
                      <input
                        type="checkbox"
                        checked={selected[i] ?? false}
                        onChange={() => toggle(i)}
                      />
                    </td>
                    <td className="p-2 font-bold text-slate-700">
                      {r.name}
                      {r.website && (
                        <a
                          href={r.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-[10px] text-cyan-600 font-normal truncate max-w-[160px]"
                          dir="ltr"
                        >
                          {r.website}
                        </a>
                      )}
                    </td>
                    <td className="p-2" dir="ltr">
                      {r.isMobile ? (
                        <span className="text-emerald-700 font-mono">{r.phone}</span>
                      ) : r.phoneRaw ? (
                        <span className="text-amber-600" title="أرضي — مفيش واتساب">
                          ☎ {r.phoneRaw}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="p-2 text-slate-600">
                      {r.rating != null ? `★ ${r.rating}` : "—"}
                    </td>
                    <td className="p-2 text-slate-500 max-w-[220px] truncate" title={r.address ?? ""}>
                      {r.address ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            onClick={runImport}
            disabled={importing || selectedCount === 0}
            className="px-5 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold font-cairo text-sm"
          >
            {importing ? "بيستورد…" : `استورد المحدد (${selectedCount}) كـ Leads`}
          </button>
        </>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// 2) AI outreach messages
// ---------------------------------------------------------------------------
function OutreachSection() {
  const [sector, setSector] = useState("");
  const [city, setCity] = useState("");
  const [angle, setAngle] = useState("");
  const [messages, setMessages] = useState<{ angle: string; text: string }[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
  const [loading, start] = useTransition();

  function run() {
    setErr(null);
    start(async () => {
      const out = await generateOutreachAction({ sector, city, angle });
      if (!out.ok) {
        setErr(out.error);
        setMessages([]);
        return;
      }
      setMessages(out.messages);
    });
  }

  async function copy(text: string, i: number) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(i);
      setTimeout(() => setCopied((c) => (c === i ? null : c)), 1500);
    } catch {
      setErr("المتصفح منع النسخ — حدد النص وانسخه يدوي");
    }
  }

  return (
    <section className="bg-white border-2 border-violet-200 rounded-2xl p-5">
      <h2 className="font-black font-cairo text-slate-800 mb-1 flex items-center gap-2">
        ✍️ مولّد رسائل التواصل <span className="text-xs font-normal text-slate-400">(AI)</span>
      </h2>
      <p className="text-xs text-slate-500 font-cairo mb-4">
        رسائل واتساب افتتاحية بالعامية تستخدم <code className="bg-slate-100 px-1 rounded">{"{name}"}</code> — جاهزة تحطها في بوت اكس.
      </p>

      <div className="grid sm:grid-cols-3 gap-2 mb-3">
        <input
          type="text"
          value={sector}
          onChange={(e) => setSector(e.target.value)}
          placeholder="القطاع (مصانع، عيادات…)"
          className="px-3 py-2 rounded-lg border border-slate-200 focus:border-violet-400 outline-none text-sm font-cairo"
        />
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="المدينة (اختياري)"
          className="px-3 py-2 rounded-lg border border-slate-200 focus:border-violet-400 outline-none text-sm font-cairo"
        />
        <input
          type="text"
          value={angle}
          onChange={(e) => setAngle(e.target.value)}
          placeholder="زاوية (اختياري: الغرامات…)"
          className="px-3 py-2 rounded-lg border border-slate-200 focus:border-violet-400 outline-none text-sm font-cairo"
        />
      </div>
      <button
        onClick={run}
        disabled={loading}
        className="px-5 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold font-cairo text-sm mb-3"
      >
        {loading ? "بيكتب…" : "✨ ولّد الرسائل"}
      </button>

      {err && (
        <div className="mb-3 bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-700 font-cairo leading-relaxed">
          {err}
        </div>
      )}

      <div className="space-y-2">
        {messages.map((m, i) => (
          <div key={i} className="bg-violet-50/60 border border-violet-100 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-violet-700 font-cairo bg-violet-100 px-2 py-0.5 rounded-full">
                {m.angle}
              </span>
              <button
                onClick={() => copy(m.text, i)}
                className="text-[11px] font-bold text-violet-700 hover:text-violet-900 font-cairo"
              >
                {copied === i ? "✓ اتنسخت" : "📋 نسخ"}
              </button>
            </div>
            <p className="text-sm text-slate-700 font-cairo whitespace-pre-wrap leading-relaxed">
              {m.text}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 3) Export to Bot X
// ---------------------------------------------------------------------------
function ExportSection() {
  const [source, setSource] = useState("google_maps");
  const [status, setStatus] = useState("all");
  const [mobileOnly, setMobileOnly] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, start] = useTransition();

  function run() {
    setErr(null);
    setMsg(null);
    start(async () => {
      const out = await exportBotXAction({ source, status, mobileOnly });
      if (!out.ok) {
        setErr(out.error);
        return;
      }
      if (out.count === 0) {
        setMsg(
          `مفيش أرقام صالحة للتصدير (من ${out.total} عميل). ${mobileOnly ? "جرّب تشيل «الموبايل فقط» أو استورد أرقام موبايل." : ""}`,
        );
        return;
      }
      downloadCsv("nidham-botx-contacts.csv", out.csv);
      setMsg(`تم تنزيل ${out.count} رقم جاهز لبوت اكس (من ${out.total} عميل).`);
    });
  }

  return (
    <section className="bg-white border-2 border-emerald-200 rounded-2xl p-5">
      <h2 className="font-black font-cairo text-slate-800 mb-1 flex items-center gap-2">
        📤 تصدير لبوت اكس <span className="text-xs font-normal text-slate-400">(CSV واتساب)</span>
      </h2>
      <p className="text-xs text-slate-500 font-cairo mb-4">
        صدّر أرقام عملائك بصيغة الواتساب (الرقم,الاسم) جاهزة ترفعها في بوت اكس وتبعت.
      </p>

      <div className="grid sm:grid-cols-3 gap-2 mb-3">
        <label className="block">
          <span className="block text-[11px] font-bold text-slate-600 mb-1 font-cairo">المصدر</span>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none text-sm font-cairo"
          >
            <option value="google_maps">من جوجل ماب</option>
            <option value="landing_page">من صفحات الهبوط</option>
            <option value="all">كل المصادر</option>
          </select>
        </label>
        <label className="block">
          <span className="block text-[11px] font-bold text-slate-600 mb-1 font-cairo">الحالة</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none text-sm font-cairo"
          >
            <option value="all">كل الحالات</option>
            <option value="lead">جديد (لسه ما اتكلمناش)</option>
            <option value="contacted">اتواصلنا</option>
            <option value="qualified">مؤهّل</option>
          </select>
        </label>
        <label className="flex items-end gap-2 pb-2">
          <input
            type="checkbox"
            checked={mobileOnly}
            onChange={(e) => setMobileOnly(e.target.checked)}
          />
          <span className="text-xs font-cairo text-slate-600">موبايل فقط (اللي عليه واتساب)</span>
        </label>
      </div>

      <button
        onClick={run}
        disabled={loading}
        className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold font-cairo text-sm"
      >
        {loading ? "بيجهّز…" : "⬇️ نزّل CSV لبوت اكس"}
      </button>

      {msg && (
        <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-700 font-cairo">
          {msg}
        </div>
      )}
      {err && (
        <div className="mt-3 bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-700 font-cairo">
          {err}
        </div>
      )}

      <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3 text-[11px] text-amber-800 font-cairo leading-relaxed">
        🛡️ <b>قبل ما تبعت:</b> استخدم رقم مخصّص للتسويق (WhatsApp Business)، ابدأ 20-30 رسالة/يوم
        وزوّد بالتدريج، بفاصل عشوائي بين الرسائل، وخلّي في جملة «اكتب إلغاء». ركّز على الرد على
        اللي بيكلّمك — أأمن وأعلى تحويل.
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 1b) Manual import — paste numbers (works without the Google key)
// ---------------------------------------------------------------------------
function ManualImportSection() {
  const [text, setText] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, start] = useTransition();

  function run() {
    setErr(null);
    setMsg(null);
    start(async () => {
      const out = await importManualAction(text);
      if (!out.ok) {
        setErr(out.error);
        return;
      }
      setMsg(
        `تم استيراد ${out.inserted} عميل${out.skipped ? ` (${out.skipped} مكرر/غير صالح اتخطّى)` : ""} كـ Leads.`,
      );
      if (out.inserted > 0) setText("");
    });
  }

  return (
    <section className="bg-white border-2 border-slate-200 rounded-2xl p-5">
      <h2 className="font-black font-cairo text-slate-800 mb-1 flex items-center gap-2">
        📋 استيراد أرقام يدويًا{" "}
        <span className="text-xs font-normal text-emerald-600">(بدون مفتاح جوجل)</span>
      </h2>
      <p className="text-xs text-slate-500 font-cairo mb-3">
        الزق أي أرقام — كل عميل في سطر (الاسم والرقم، أو الرقم لوحده). هنحوّلها لصيغة
        الواتساب ونشيل المكرر ونضيفهم Leads.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        dir="ltr"
        placeholder={"شركة الأمل 01001234567\nمصنع النور 01112223334\n01234567890"}
        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-slate-400 outline-none text-sm font-mono resize-y mb-3"
      />
      <button
        onClick={run}
        disabled={loading || text.trim().length === 0}
        className="px-5 py-2 rounded-lg bg-slate-700 hover:bg-slate-800 disabled:opacity-50 text-white font-bold font-cairo text-sm"
      >
        {loading ? "بيستورد…" : "استورد كـ Leads"}
      </button>
      {msg && (
        <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-700 font-cairo">
          {msg}
        </div>
      )}
      {err && (
        <div className="mt-3 bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-700 font-cairo">
          {err}
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// 2b) Direct reach — per-lead wa.me links (manual send, no Bot X, no ban risk)
// ---------------------------------------------------------------------------
function DirectReachSection() {
  const [message, setMessage] = useState("");
  const [source, setSource] = useState("all");
  const [status, setStatus] = useState("lead");
  const [leads, setLeads] = useState<{ id: string; name: string; wa: string }[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, start] = useTransition();

  function run() {
    setErr(null);
    start(async () => {
      const out = await listOutreachAction({ source, status, limit: 200 });
      setLoaded(true);
      if (!out.ok) {
        setErr(out.error);
        setLeads([]);
        return;
      }
      setLeads(out.leads);
    });
  }

  function waHref(l: { name: string; wa: string }) {
    const m = (message || "").split("{name}").join(l.name);
    const q = m ? `?text=${encodeURIComponent(m)}` : "";
    return `https://wa.me/${l.wa}${q}`;
  }

  return (
    <section className="bg-white border-2 border-green-200 rounded-2xl p-5">
      <h2 className="font-black font-cairo text-slate-800 mb-1 flex items-center gap-2">
        💬 تواصل مباشر <span className="text-xs font-normal text-slate-400">(واتساب يدوي — بدون بوت اكس)</span>
      </h2>
      <p className="text-xs text-slate-500 font-cairo mb-3">
        اكتب رسالتك (استخدم <code className="bg-slate-100 px-1 rounded">{"{name}"}</code> وهتتبدل باسم كل عميل)،
        حمّل العملاء، واضغط «افتح واتساب» — هيفتح المحادثة بالرسالة جاهزة، تبعت بإيدك.
      </p>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={3}
        placeholder="أهلًا {name} 👋 معاك فريق نِظام HR..."
        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-green-400 outline-none text-sm font-cairo resize-y mb-3"
      />

      <div className="grid sm:grid-cols-3 gap-2 mb-3">
        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-200 outline-none text-sm font-cairo"
        >
          <option value="all">كل المصادر</option>
          <option value="google_maps">جوجل ماب</option>
          <option value="manual">يدوي</option>
          <option value="landing_page">صفحات الهبوط</option>
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-200 outline-none text-sm font-cairo"
        >
          <option value="lead">جديد</option>
          <option value="contacted">اتواصلنا</option>
          <option value="all">كل الحالات</option>
        </select>
        <button
          onClick={run}
          disabled={loading}
          className="px-5 py-2 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold font-cairo text-sm"
        >
          {loading ? "بيحمّل…" : "حمّل العملاء"}
        </button>
      </div>

      {err && (
        <div className="mb-3 bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-700 font-cairo">
          {err}
        </div>
      )}

      {loaded && !err && leads.length === 0 && (
        <div className="text-xs text-slate-500 font-cairo">
          مفيش عملاء بأرقام موبايل في الفلتر ده. استورد أرقام الأول.
        </div>
      )}

      {leads.length > 0 && (
        <>
          <div className="text-xs text-slate-500 font-cairo mb-2">
            {leads.length} عميل جاهز للتواصل
          </div>
          <div className="max-h-80 overflow-y-auto border border-slate-100 rounded-lg divide-y divide-slate-100">
            {leads.map((l) => (
              <div key={l.id} className="flex items-center justify-between gap-2 p-2">
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-700 font-cairo truncate">
                    {l.name}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono" dir="ltr">
                    {l.wa}
                  </div>
                </div>
                <a
                  href={waHref(l)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-bold font-cairo"
                >
                  افتح واتساب
                </a>
              </div>
            ))}
          </div>
          <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3 text-[11px] text-amber-800 font-cairo leading-relaxed">
            🛡️ ابعت على دفعات صغيرة وبفاصل بينهم، ونوّع الصياغة شوية — حتى اليدوي
            لو بعت بسرعة لأرقام كتير ممكن يترصد.
          </div>
        </>
      )}
    </section>
  );
}
