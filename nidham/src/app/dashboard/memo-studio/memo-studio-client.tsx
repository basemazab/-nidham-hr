"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";

// ── types (mirror the API) ──
type MemoTable = {
  columns: string[];
  rows: string[][];
  total: { label: string; value: string } | null;
} | null;

type Memo = {
  lang: "ar" | "en";
  docType: string;
  referenceNo: string;
  toLine: string;
  fromLine: string;
  subject: string;
  greeting: string;
  bodyParagraphs: string[];
  table: MemoTable;
  closing: string;
  signatureName: string;
  signatureTitle: string;
  notes: string | null;
};

type Dates = { greg: string; hijri: string };

const EXAMPLES = [
  "مذكرة لإدارة الحسابات بصرف مستحقات الموظف أحمد علي: راتب شهر يونيو 8500 + بدل انتقال 1500 + حافز 2000",
  "مذكرة طلب موافقة على شراء 5 أجهزة كمبيوتر للمكتب بسعر 18000 للجهاز",
  "مذكرة داخلية لتعميم مواعيد العمل الصيفية الجديدة على جميع الإدارات",
  "مذكرة صرف سلفة مستعجلة للموظف محمد سمير بقيمة 5000 جنيه تُخصم على 5 أشهر",
];

const NAVY = "#0D1B2A";
const GOLD = "#C9A84C";

// ── helpers ──
function esc(s: unknown): string {
  return String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      (({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }) as Record<string, string>)[
        c
      ],
  );
}

function safeName(s: string): string {
  return (s || "مذكرة").replace(/[\\/:*?"<>|]+/g, " ").trim().slice(0, 60);
}

// Build a fully self-contained, print-optimized A4 HTML document and print it
// in a new window. The browser renders Arabic perfectly (shaping + ligatures),
// which no client-side PDF library does reliably — this is the robust path.
function buildPrintHtml(memo: Memo, companyName: string, dates: Dates): string {
  const rtl = memo.lang !== "en";
  const dir = rtl ? "rtl" : "ltr";
  const align = rtl ? "right" : "left";
  const dateStr = rtl
    ? `${esc(dates.greg)}${dates.hijri ? ` &nbsp;•&nbsp; ${esc(dates.hijri)} هـ` : ""}`
    : esc(dates.greg);

  const bodyHtml = memo.bodyParagraphs.map((p) => `<p>${esc(p)}</p>`).join("");

  let tableHtml = "";
  if (memo.table && memo.table.columns.length > 0) {
    const head = memo.table.columns.map((c) => `<th>${esc(c)}</th>`).join("");
    const rows = memo.table.rows
      .map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`)
      .join("");
    let totalRow = "";
    if (memo.table.total) {
      const span = Math.max(1, memo.table.columns.length - 1);
      totalRow = `<tr class="total"><td colspan="${span}">${esc(
        memo.table.total.label,
      )}</td><td>${esc(memo.table.total.value)}</td></tr>`;
    }
    tableHtml = `<table><thead><tr>${head}</tr></thead><tbody>${rows}${totalRow}</tbody></table>`;
  }

  const notesHtml = memo.notes
    ? `<div class="notes"><b>ملاحظات:</b> ${esc(memo.notes)}</div>`
    : "";

  return `<!doctype html>
<html lang="${rtl ? "ar" : "en"}" dir="${dir}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(memo.docType)} — ${esc(companyName)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
  @page { size: A4; margin: 18mm 16mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: 'Cairo', 'Tahoma', 'Segoe UI', Arial, sans-serif;
    color: #1f2937; direction: ${dir}; text-align: ${align};
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
    background: #fff;
  }
  .doc { max-width: 178mm; margin: 0 auto; padding: 6mm 0; }
  .head { display: flex; justify-content: space-between; align-items: flex-end;
    border-bottom: 3px double ${NAVY}; padding-bottom: 8px; }
  .company { font-family: 'Amiri', 'Cairo', serif; font-size: 25px; font-weight: 700; color: ${NAVY}; line-height: 1.2; }
  .accent { height: 3px; width: 70px; background: ${GOLD}; margin-top: 4px; }
  .badge { font-size: 12px; color: #6b7280; border: 1px solid #e5e7eb; border-radius: 6px; padding: 3px 8px; }
  .title { text-align: center; font-family: 'Amiri', 'Cairo', serif; font-size: 22px; font-weight: 700;
    color: ${NAVY}; margin: 24px 0 4px; letter-spacing: .3px; }
  .title-rule { width: 110px; height: 2px; background: ${GOLD}; margin: 0 auto 16px; }
  .meta { display: flex; justify-content: space-between; font-size: 12.5px; color: #555; margin-bottom: 14px; }
  .meta b { color: ${NAVY}; }
  .field { font-size: 14.5px; margin: 5px 0; }
  .field b { color: ${NAVY}; }
  .subject { font-weight: 700; color: ${NAVY}; font-size: 15.5px; margin: 14px 0; padding: 9px 13px;
    background: #f8f6ef; border-${rtl ? "right" : "left"}: 4px solid ${GOLD}; border-radius: 4px; }
  .greeting { font-size: 14.5px; margin: 8px 0 12px; }
  .body p { font-size: 14.5px; line-height: 2.05; text-align: justify; margin: 0 0 11px; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13.5px; }
  th { background: ${NAVY}; color: #fff; padding: 9px 12px; text-align: ${align}; font-weight: 700; }
  td { border: 1px solid #e5e7eb; padding: 8px 12px; }
  tbody tr:nth-child(even) td { background: #faf9f5; }
  tr.total td { background: ${GOLD}33; font-weight: 800; color: ${NAVY}; font-size: 14.5px; }
  .closing { font-size: 14.5px; margin-top: 16px; }
  .sign { margin-top: 40px; display: flex; justify-content: ${rtl ? "flex-start" : "flex-end"}; }
  .sign-box { text-align: center; min-width: 230px; }
  .sign-name { font-weight: 700; color: ${NAVY}; font-size: 14.5px; }
  .sign-title { font-size: 12.5px; color: #555; margin-top: 2px; }
  .sign-line { margin-top: 34px; border-top: 1px dashed #9aa0a6; padding-top: 5px; font-size: 11.5px; color: #9aa0a6; }
  .notes { margin-top: 18px; font-size: 12px; color: #6b7280; background: #f9fafb; border: 1px solid #eef0f2; border-radius: 6px; padding: 8px 11px; }
  .foot { margin-top: 26px; border-top: 1px solid #eef0f2; padding-top: 8px; font-size: 10.5px; color: #9aa0a6; text-align: center; }
  @media print { .doc { padding: 0; } }
</style>
</head>
<body>
  <div class="doc">
    <div class="head">
      <div>
        <div class="company">${esc(companyName)}</div>
        <div class="accent"></div>
      </div>
      <div class="badge">${rtl ? "مستند رسمي" : "Official Document"}</div>
    </div>

    <div class="title">${esc(memo.docType)}</div>
    <div class="title-rule"></div>

    <div class="meta">
      <span><b>${rtl ? "الرقم المرجعي" : "Ref."}:</b> ${esc(memo.referenceNo) || "—"}</span>
      <span><b>${rtl ? "التاريخ" : "Date"}:</b> ${dateStr}</span>
    </div>

    ${memo.toLine ? `<div class="field"><b></b>${esc(memo.toLine)}</div>` : ""}
    ${memo.fromLine ? `<div class="field">${esc(memo.fromLine)}</div>` : ""}
    ${memo.subject ? `<div class="subject">${esc(memo.subject)}</div>` : ""}
    ${memo.greeting ? `<div class="greeting">${esc(memo.greeting)}</div>` : ""}

    <div class="body">${bodyHtml}</div>
    ${tableHtml}
    ${memo.closing ? `<div class="closing">${esc(memo.closing)}</div>` : ""}

    <div class="sign">
      <div class="sign-box">
        <div class="sign-name">${esc(memo.signatureName) || "&nbsp;"}</div>
        <div class="sign-title">${esc(memo.signatureTitle)}</div>
        <div class="sign-line">${rtl ? "التوقيع / الختم" : "Signature / Stamp"}</div>
      </div>
    </div>

    ${notesHtml}
    <div class="foot">${esc(companyName)} — ${rtl ? "صدر عبر نِظام" : "Generated via Nidham"}</div>
  </div>
  <script>
    window.addEventListener('load', function () {
      setTimeout(function () { window.focus(); window.print(); }, 350);
    });
  </script>
</body>
</html>`;
}

function printMemo(memo: Memo, companyName: string, dates: Dates) {
  const html = buildPrintHtml(memo, companyName, dates);
  const w = window.open("", "_blank", "width=900,height=1000");
  if (!w) {
    alert("المتصفح منع فتح نافذة الطباعة — اسمح بالنوافذ المنبثقة لهذا الموقع وحاول تاني.");
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}

function exportExcel(memo: Memo, companyName: string, dates: Dates) {
  const aoa: string[][] = [];
  aoa.push([companyName]);
  aoa.push([memo.docType]);
  if (memo.referenceNo) aoa.push(["الرقم المرجعي", memo.referenceNo]);
  aoa.push(["التاريخ", dates.greg + (dates.hijri ? `  |  ${dates.hijri} هـ` : "")]);
  aoa.push([""]);
  if (memo.toLine) aoa.push([memo.toLine]);
  if (memo.fromLine) aoa.push([memo.fromLine]);
  if (memo.subject) aoa.push([memo.subject]);
  aoa.push([""]);
  if (memo.greeting) aoa.push([memo.greeting]);
  for (const p of memo.bodyParagraphs) aoa.push([p]);
  aoa.push([""]);

  let colCount = 2;
  if (memo.table && memo.table.columns.length > 0) {
    aoa.push(memo.table.columns);
    colCount = Math.max(colCount, memo.table.columns.length);
    for (const r of memo.table.rows) {
      aoa.push(r);
      colCount = Math.max(colCount, r.length);
    }
    if (memo.table.total) {
      const row = new Array(memo.table.columns.length).fill("");
      row[0] = memo.table.total.label;
      row[memo.table.columns.length - 1] = memo.table.total.value;
      aoa.push(row);
    }
    aoa.push([""]);
  }

  if (memo.closing) aoa.push([memo.closing]);
  aoa.push([""]);
  if (memo.signatureName) aoa.push([memo.signatureName]);
  if (memo.signatureTitle) aoa.push([memo.signatureTitle]);

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = Array.from({ length: colCount }, () => ({ wch: 26 }));
  const wb = XLSX.utils.book_new();
  wb.Workbook = { Views: [{ RTL: memo.lang !== "en" }] };
  XLSX.utils.book_append_sheet(wb, ws, "المذكرة");
  XLSX.writeFile(wb, `${safeName(memo.docType)}.xlsx`);
}

// ── component ──
export function MemoStudioClient({
  companyName,
  signatory,
}: {
  companyName: string;
  signatory: string;
}) {
  const [request, setRequest] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [memo, setMemo] = useState<Memo | null>(null);
  const [dates, setDates] = useState<Dates>({ greg: "", hijri: "" });

  useEffect(() => {
    const now = new Date();
    let hijri = "";
    try {
      hijri = now.toLocaleDateString("ar-SA-u-ca-islamic-umalqura", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      hijri = "";
    }
    setDates({
      greg: now.toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" }),
      hijri,
    });
  }, []);

  const generate = async () => {
    if (!request.trim()) {
      setError("اكتب طلبك الأول 🙂");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tools/memo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data || !data.ok) {
        setError((data && data.error) || "حصل خطأ في التوليد، جرّب تاني.");
      } else {
        const m: Memo = data.memo;
        if (!m.signatureName && signatory) m.signatureName = signatory;
        setMemo(m);
      }
    } catch {
      setError("تعذّر الاتصال بالخادم — جرّب تاني.");
    }
    setLoading(false);
  };

  const upd = (patch: Partial<Memo>) => setMemo((m) => (m ? { ...m, ...patch } : m));
  const rtl = !memo || memo.lang !== "en";

  return (
    <main className="flex-1 px-4 sm:px-6 py-8 bg-gradient-to-b from-slate-50 via-white to-cyan-50/30 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="mb-4">
          <Link href="/dashboard" className="text-sm text-slate-500 hover:text-brand-cyan-dark font-cairo">
            ← الرجوع للوحة التحكم
          </Link>
        </div>

        <header className="mb-6">
          <h1 className="text-3xl font-black font-cairo text-slate-800 mb-1">📝 مولّد المستندات الرسمية</h1>
          <p className="text-sm text-slate-500 font-cairo leading-relaxed">
            اكتب طلبك بالعامية — مذكرة لإدارة، صرف مستحقات، طلب موافقة، أي حاجة — والأداة تكتبها بصياغة
            رسمية محترمة، تحسب المبالغ، وتطلّعها <b>PDF جاهز للطباعة</b> أو <b>Excel</b>.
          </p>
        </header>

        <div className="grid lg:grid-cols-[380px_1fr] gap-6 items-start">
          {/* ── Controls ── */}
          <div className="space-y-4">
            <div className="rounded-2xl border-2 border-slate-200 bg-white p-5">
              <label className="block text-sm font-bold text-slate-700 mb-2 font-cairo">
                اكتب طلبك
              </label>
              <textarea
                value={request}
                onChange={(e) => setRequest(e.target.value)}
                rows={5}
                placeholder="مثال: اكتب مذكرة لإدارة الحسابات بصرف مستحقات الموظف أحمد علي — راتب شهر 8500 + بدل انتقال 1500 + حافز 2000"
                className="w-full px-3.5 py-3 rounded-xl border border-slate-300 text-sm outline-none focus:border-brand-cyan font-cairo resize-y leading-relaxed"
              />
              <button
                type="button"
                onClick={generate}
                disabled={loading}
                className="mt-3 w-full px-5 py-3 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-cyan-dark text-white font-bold font-cairo text-sm shadow-md hover:shadow-lg transition disabled:opacity-60"
              >
                {loading ? "⏳ بيكتب المذكرة..." : "✨ ولّد المذكرة"}
              </button>
              {error && (
                <p className="mt-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 font-cairo">
                  {error}
                </p>
              )}
            </div>

            {!memo && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="text-xs font-bold text-slate-500 mb-2 font-cairo">جرّب أمثلة جاهزة:</div>
                <div className="space-y-2">
                  {EXAMPLES.map((ex, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setRequest(ex)}
                      className="block w-full text-right text-xs text-slate-600 hover:text-brand-cyan-dark hover:bg-cyan-50/60 border border-slate-200 rounded-lg px-3 py-2 font-cairo transition leading-relaxed"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick edit — tweak before exporting */}
            {memo && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
                <div className="text-sm font-black text-slate-700 font-cairo">✏️ تعديل سريع</div>
                <EditField label="نوع المستند" value={memo.docType} onChange={(v) => upd({ docType: v })} />
                <EditField label="الرقم المرجعي" value={memo.referenceNo} onChange={(v) => upd({ referenceNo: v })} />
                <EditField label="إلى" value={memo.toLine} onChange={(v) => upd({ toLine: v })} />
                <EditField label="من" value={memo.fromLine} onChange={(v) => upd({ fromLine: v })} />
                <EditField label="الموضوع" value={memo.subject} onChange={(v) => upd({ subject: v })} />
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 font-cairo">نص المذكرة</label>
                  <textarea
                    value={memo.bodyParagraphs.join("\n\n")}
                    onChange={(e) =>
                      upd({ bodyParagraphs: e.target.value.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean) })
                    }
                    rows={6}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs outline-none focus:border-brand-cyan font-cairo resize-y leading-relaxed"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <EditField label="اسم المُوقِّع" value={memo.signatureName} onChange={(v) => upd({ signatureName: v })} />
                  <EditField label="المنصب" value={memo.signatureTitle} onChange={(v) => upd({ signatureTitle: v })} />
                </div>
              </div>
            )}
          </div>

          {/* ── Live preview + export ── */}
          <div>
            {!memo ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-12 text-center text-sm text-slate-400 font-cairo">
                المعاينة هتظهر هنا بعد ما تولّد المذكرة 📄
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => printMemo(memo, companyName, dates)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 text-white font-bold font-cairo text-sm hover:bg-slate-700 transition shadow-sm"
                  >
                    🖨️ تحميل / طباعة PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => exportExcel(memo, companyName, dates)}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold font-cairo text-sm hover:bg-emerald-700 transition shadow-sm"
                  >
                    📊 تحميل Excel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMemo(null);
                      setError(null);
                    }}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-bold font-cairo text-sm hover:bg-slate-50 transition"
                  >
                    ↺ جديدة
                  </button>
                </div>

                {/* A4-style preview */}
                <div className="rounded-2xl bg-slate-100 p-3 sm:p-6 overflow-x-auto">
                  <div
                    dir={rtl ? "rtl" : "ltr"}
                    className="bg-white mx-auto shadow-lg rounded-sm p-8 sm:p-10 font-cairo"
                    style={{ maxWidth: "210mm", textAlign: rtl ? "right" : "left" }}
                  >
                    {/* head */}
                    <div className="flex items-end justify-between border-b-[3px] border-double pb-2" style={{ borderColor: NAVY }}>
                      <div>
                        <div className="text-2xl font-black" style={{ color: NAVY }}>{companyName}</div>
                        <div className="h-[3px] w-16 mt-1" style={{ background: GOLD }} />
                      </div>
                      <span className="text-[11px] text-slate-500 border border-slate-200 rounded px-2 py-0.5">
                        مستند رسمي
                      </span>
                    </div>

                    <div className="text-center text-xl font-black mt-6 mb-1" style={{ color: NAVY }}>
                      {memo.docType}
                    </div>
                    <div className="h-0.5 w-28 mx-auto mb-4" style={{ background: GOLD }} />

                    <div className="flex justify-between text-[12.5px] text-slate-500 mb-4">
                      <span><b style={{ color: NAVY }}>الرقم المرجعي:</b> {memo.referenceNo || "—"}</span>
                      <span>
                        <b style={{ color: NAVY }}>التاريخ:</b> {dates.greg}
                        {dates.hijri ? ` • ${dates.hijri} هـ` : ""}
                      </span>
                    </div>

                    {memo.toLine && <div className="text-[14.5px] my-1.5">{memo.toLine}</div>}
                    {memo.fromLine && <div className="text-[14.5px] my-1.5">{memo.fromLine}</div>}
                    {memo.subject && (
                      <div
                        className="font-bold text-[15.5px] my-3 px-3 py-2 rounded"
                        style={{
                          color: NAVY,
                          background: "#f8f6ef",
                          ...(rtl
                            ? { borderRight: `4px solid ${GOLD}` }
                            : { borderLeft: `4px solid ${GOLD}` }),
                        }}
                      >
                        {memo.subject}
                      </div>
                    )}
                    {memo.greeting && <div className="text-[14.5px] mt-2 mb-3">{memo.greeting}</div>}

                    <div className="space-y-2.5">
                      {memo.bodyParagraphs.map((p, i) => (
                        <p key={i} className="text-[14.5px] leading-[2.05]" style={{ textAlign: "justify" }}>
                          {p}
                        </p>
                      ))}
                    </div>

                    {memo.table && memo.table.columns.length > 0 && (
                      <table className="w-full border-collapse my-4 text-[13.5px]">
                        <thead>
                          <tr>
                            {memo.table.columns.map((c, i) => (
                              <th
                                key={i}
                                className="px-3 py-2 font-bold text-white"
                                style={{ background: NAVY, textAlign: rtl ? "right" : "left" }}
                              >
                                {c}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {memo.table.rows.map((r, ri) => (
                            <tr key={ri} className={ri % 2 ? "bg-[#faf9f5]" : ""}>
                              {r.map((c, ci) => (
                                <td key={ci} className="border border-slate-200 px-3 py-1.5">
                                  {c}
                                </td>
                              ))}
                            </tr>
                          ))}
                          {memo.table.total && (
                            <tr>
                              <td
                                className="border border-slate-200 px-3 py-2 font-black"
                                colSpan={Math.max(1, memo.table.columns.length - 1)}
                                style={{ background: `${GOLD}33`, color: NAVY }}
                              >
                                {memo.table.total.label}
                              </td>
                              <td
                                className="border border-slate-200 px-3 py-2 font-black"
                                style={{ background: `${GOLD}33`, color: NAVY }}
                              >
                                {memo.table.total.value}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    )}

                    {memo.closing && <div className="text-[14.5px] mt-4">{memo.closing}</div>}

                    <div className={`mt-10 flex ${rtl ? "justify-start" : "justify-end"}`}>
                      <div className="text-center min-w-[220px]">
                        <div className="font-bold text-[14.5px]" style={{ color: NAVY }}>
                          {memo.signatureName || " "}
                        </div>
                        <div className="text-[12.5px] text-slate-500 mt-0.5">{memo.signatureTitle}</div>
                        <div className="mt-8 border-t border-dashed border-slate-400 pt-1 text-[11.5px] text-slate-400">
                          التوقيع / الختم
                        </div>
                      </div>
                    </div>

                    {memo.notes && (
                      <div className="mt-5 text-[12px] text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
                        <b>ملاحظات:</b> {memo.notes}
                      </div>
                    )}

                    <div className="mt-6 border-t border-slate-100 pt-2 text-center text-[10.5px] text-slate-400">
                      {companyName} — صدر عبر نِظام
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 font-cairo mt-2 text-center">
                  💡 «تحميل PDF» بيفتح نافذة الطباعة — اختار «حفظ كـ PDF» أو اطبع مباشرة. لو منع المتصفح
                  النافذة، اسمح بالنوافذ المنبثقة.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function EditField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 mb-1 font-cairo">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs outline-none focus:border-brand-cyan font-cairo"
      />
    </div>
  );
}
