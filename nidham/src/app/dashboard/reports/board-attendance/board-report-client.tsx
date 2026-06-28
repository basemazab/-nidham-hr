"use client";

// ============================================================================
// BoardReportClient — upload a biometric sheet → printable board report
// ============================================================================
// The toolbar (upload / print) is `.no-print`. The <article> is the A4 page
// that prints. Before a sheet is uploaded it shows the factory STRENGTH
// (headcount per department); after upload it adds present/absent + a staffing
// recommendation per department, plus an absentee breakdown.

import { useState, useRef } from "react";
import Link from "next/link";
import { FormLetterhead } from "@/components/forms/form-letterhead";
import type { FormCompany } from "@/lib/forms";
import type { BoardReport, DeptReport } from "@/lib/board-report";

type DeptOverview = { name: string; total: number; withCode: number };

type Props = {
  company: { name: string; industry: string | null; logoUrl: string | null };
  reference: string;
  today: string;
  overview: DeptOverview[];
  totalActive: number;
  totalWithCode: number;
};

const REC_STYLE: Record<DeptReport["recommendation"]["level"], string> = {
  ok: "bg-emerald-50 text-emerald-800 border-emerald-200",
  watch: "bg-amber-50 text-amber-800 border-amber-200",
  hire: "bg-red-50 text-red-700 border-red-200",
  unknown: "bg-slate-50 text-slate-500 border-slate-200",
};

function pct(rate: number | null): string {
  if (rate === null) return "—";
  return `${Math.round(rate * 100)}%`;
}

function fmtDate(d: string | null): string {
  if (!d) return "—";
  const parts = d.split("-");
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : d;
}

export function BoardReportClient({
  company,
  reference,
  today,
  overview,
  totalActive,
  totalWithCode,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<BoardReport | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const formCompany: FormCompany = {
    name: company.name,
    industry: company.industry,
    logoUrl: company.logoUrl,
  };

  async function handleFile(file: File) {
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/reports/board-attendance", { method: "POST", body: fd });
      const data = await res.json();
      if (data.ok && data.report) {
        setReport(data.report as BoardReport);
        setFileName(file.name);
      } else {
        setError(data.error || "تعذّر إنشاء التقرير");
      }
    } catch {
      setError("حصل خطأ في الاتصال — جرّب تاني");
    }
    setBusy(false);
  }

  const periodLabel = report
    ? report.period.days <= 1
      ? `يوم ${fmtDate(report.period.from)}`
      : `من ${fmtDate(report.period.from)} إلى ${fmtDate(report.period.to)} (${report.period.days} يوم)`
    : null;

  // What the table renders: the live report's departments, or the pre-upload
  // strength overview mapped to the same shape (no present/absent yet).
  const rows = report ? report.departments : null;

  return (
    <>
      <style>{`
        @page { size: A4; margin: 0; }
        @media print {
          html, body { background:#fff !important; margin:0 !important; padding:0 !important; }
          .no-print { display:none !important; }
          .report-page { box-shadow:none !important; border:none !important; margin:0 !important; }
        }
        .report-page { width:210mm; min-height:297mm; margin:0 auto; background:#fff; }
      `}</style>

      <div className="min-h-screen bg-slate-100 py-8 print:bg-white print:py-0">
        {/* Toolbar (hidden in print) */}
        <div className="no-print max-w-4xl mx-auto mb-6 px-4 md:px-0">
          <Link href="/dashboard/reports" className="text-sm text-slate-500 hover:text-brand-cyan-dark font-cairo">
            ← الرجوع للتقارير
          </Link>
          <h1 className="text-xl font-black font-cairo text-slate-800 mt-1">
            📋 تقرير الحضور والغياب لمجلس الإدارة
          </h1>
          <p className="text-sm text-slate-500 font-cairo mt-1">
            ارفع كشف البصمة (Excel/CSV) — النظام بيقارنه بقوة المصنع ويطلّعلك تقرير احترافي جاهز للطباعة.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              className="px-5 py-2.5 rounded-xl bg-brand-cyan-dark text-white font-bold text-sm font-cairo hover:brightness-110 disabled:opacity-50 transition"
            >
              {busy ? "⏳ بنحلّل الكشف..." : report ? "🔄 ارفع كشف تاني" : "📥 ارفع كشف البصمة"}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-sm font-cairo hover:bg-slate-50 transition"
            >
              🖨 طباعة / حفظ PDF
            </button>
            {fileName && (
              <span className="text-xs text-slate-400 font-cairo">📎 {fileName}</span>
            )}
          </div>

          {error && (
            <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-cairo">
              ⚠ {error}
            </div>
          )}
          {!report && !error && (
            <div className="mt-3 p-3 rounded-xl bg-cyan-50 border border-cyan-100 text-brand-cyan-dark text-xs font-cairo">
              دلوقتي معروض «قوة المصنع» (عدد الموظفين لكل قسم). ارفع كشف البصمة عشان يتحسب الحاضر والغائب واحتياج كل قسم للتوظيف.
            </div>
          )}
        </div>

        {/* The printable A4 page */}
        <article
          id="board-report"
          className="report-page shadow-2xl rounded-sm border border-slate-200 print:shadow-none print:border-0 pb-10"
        >
          <FormLetterhead
            company={formCompany}
            reference={reference}
            date={today}
            subtitle="تقرير الحضور والغياب — مرفوع لمجلس الإدارة"
          />

          <div className="px-12 pt-6">
            <div className="flex items-baseline justify-between flex-wrap gap-2 mb-1">
              <h2 className="text-2xl font-black font-cairo text-slate-900">
                {report ? "تقرير الحضور والغياب" : "تقرير قوة المصنع"}
              </h2>
              {periodLabel && (
                <span className="text-sm font-cairo text-slate-600">الفترة: {periodLabel}</span>
              )}
            </div>
            <div className="h-0.5 w-full bg-gradient-to-l from-transparent via-amber-400 to-amber-500 mb-6" />

            {/* ── Executive summary ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              <SummaryCard label="إجمالي القوة العاملة" value={totalActive} accent="slate" />
              <SummaryCard label="عدد الأقسام" value={overview.length} accent="slate" />
              {report ? (
                <>
                  <SummaryCard label="الحاضرون" value={report.totals.present} accent="emerald" />
                  <SummaryCard label="الغائبون" value={report.totals.absent} accent="red" />
                </>
              ) : (
                <>
                  <SummaryCard label="بكود بصمة" value={totalWithCode} accent="slate" />
                  <SummaryCard label="نسبة الحضور" value="—" accent="slate" />
                </>
              )}
            </div>

            {report && report.totals.rate !== null && (
              <div className="mb-8 flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-4xl font-black font-cairo text-slate-900">
                  {pct(report.totals.rate)}
                </div>
                <div className="text-sm font-cairo text-slate-600 leading-relaxed">
                  نسبة الحضور الإجمالية للمصنع خلال الفترة.
                  <br />
                  {report.totals.present} حاضر من {report.totals.withCode} موظف بكود بصمة.
                </div>
              </div>
            )}

            {/* ── Department table ── */}
            <SectionLabel n="1" title={report ? "قوة كل قسم والحضور" : "قوة كل قسم"} />
            <div className="overflow-x-auto mb-8">
              <table className="w-full text-sm font-cairo border-collapse">
                <thead>
                  <tr className="bg-slate-800 text-white text-xs">
                    <th className="text-right p-2.5 font-bold">القسم</th>
                    <th className="p-2.5 font-bold">العدد الكلي</th>
                    {report ? (
                      <>
                        <th className="p-2.5 font-bold">الحاضر</th>
                        <th className="p-2.5 font-bold">الغائب</th>
                        <th className="p-2.5 font-bold">نسبة الحضور</th>
                        <th className="p-2.5 font-bold">التقييم والتوصية</th>
                      </>
                    ) : (
                      <th className="p-2.5 font-bold">بكود بصمة</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {rows
                    ? rows.map((d, i) => (
                        <tr key={d.name} className={i % 2 ? "bg-slate-50" : "bg-white"}>
                          <td className="p-2.5 font-bold text-slate-800 border-b border-slate-100">{d.name}</td>
                          <td className="p-2.5 text-center text-slate-700 border-b border-slate-100">{d.total}</td>
                          <td className="p-2.5 text-center text-emerald-700 font-bold border-b border-slate-100">{d.present}</td>
                          <td className="p-2.5 text-center text-red-600 font-bold border-b border-slate-100">{d.absent}</td>
                          <td className="p-2.5 text-center font-bold text-slate-800 border-b border-slate-100">{pct(d.rate)}</td>
                          <td className="p-2.5 border-b border-slate-100">
                            <span className={`inline-block px-2 py-0.5 rounded-md border text-[11px] font-bold ${REC_STYLE[d.recommendation.level]}`}>
                              {d.recommendation.label}
                            </span>
                          </td>
                        </tr>
                      ))
                    : overview.map((d, i) => (
                        <tr key={d.name} className={i % 2 ? "bg-slate-50" : "bg-white"}>
                          <td className="p-2.5 font-bold text-slate-800 border-b border-slate-100">{d.name}</td>
                          <td className="p-2.5 text-center text-slate-700 border-b border-slate-100">{d.total}</td>
                          <td className="p-2.5 text-center text-slate-500 border-b border-slate-100">{d.withCode}</td>
                        </tr>
                      ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-black text-slate-900">
                    <td className="p-2.5">الإجمالي</td>
                    <td className="p-2.5 text-center">{totalActive}</td>
                    {report ? (
                      <>
                        <td className="p-2.5 text-center text-emerald-700">{report.totals.present}</td>
                        <td className="p-2.5 text-center text-red-600">{report.totals.absent}</td>
                        <td className="p-2.5 text-center">{pct(report.totals.rate)}</td>
                        <td className="p-2.5" />
                      </>
                    ) : (
                      <td className="p-2.5 text-center">{totalWithCode}</td>
                    )}
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* ── Absentee detail (only after a sheet is uploaded) ── */}
            {report && report.totals.absent > 0 && (
              <>
                <SectionLabel n="2" title="تفاصيل الغياب حسب القسم" />
                <div className="space-y-4 mb-8">
                  {report.departments
                    .filter((d) => d.absentees.length > 0)
                    .map((d) => (
                      <div key={d.name} className="rounded-xl border border-slate-200 overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-200">
                          <span className="font-bold font-cairo text-slate-800 text-sm">{d.name}</span>
                          <span className="text-xs font-cairo text-red-600 font-bold">{d.absentees.length} غائب</span>
                        </div>
                        <ul className="divide-y divide-slate-100">
                          {d.absentees.map((a) => (
                            <li key={(a.code ?? "") + a.name} className="flex items-center justify-between px-4 py-2 text-sm font-cairo">
                              <span className="text-slate-800">{a.name}</span>
                              <span className="text-slate-400 text-xs">
                                {a.job_title ? `${a.job_title} · ` : ""}كود: {a.code ?? "—"}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                </div>
              </>
            )}

            {/* ── Footnotes ── */}
            <div className="mb-10 text-[11px] leading-relaxed text-slate-500 font-cairo border-t border-slate-200 pt-4 space-y-1">
              <p>● «الغياب» = موظف نشط له كود بصمة ولم يُسجَّل له حضور في الكشف خلال الفترة، وقد يشمل إجازات معتمدة.</p>
              {report && report.totals.noCode > 0 && (
                <p>● {report.totals.noCode} موظف بدون كود بصمة لم يُحتسبوا في نسبة الحضور (محتاجين ربط بكود الجهاز).</p>
              )}
              <p>● التوصية بالتوظيف إشارة استرشادية مبنية على نسبة الحضور: 90%+ كافية · 75–90% متابعة · أقل من 75% يُنصح بالتعزيز.</p>
            </div>

            {/* ── Signatures ── */}
            <div className="grid grid-cols-3 gap-6 pt-8">
              {["مدير الموارد البشرية", "المدير التنفيذي", "رئيس مجلس الإدارة"].map((role) => (
                <div key={role} className="text-center">
                  <div className="h-12 border-b border-slate-400 mb-2" />
                  <div className="text-xs font-bold font-cairo text-slate-700">{role}</div>
                  <div className="text-[10px] font-cairo text-slate-400 mt-0.5">الاسم / التوقيع</div>
                </div>
              ))}
            </div>
          </div>
        </article>
      </div>
    </>
  );
}

function SummaryCard({ label, value, accent }: { label: string; value: number | string; accent: "slate" | "emerald" | "red" }) {
  const color =
    accent === "emerald" ? "text-emerald-700" : accent === "red" ? "text-red-600" : "text-slate-900";
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
      <div className={`text-2xl font-black font-cairo ${color}`}>
        {typeof value === "number" ? value.toLocaleString("ar-EG") : value}
      </div>
      <div className="text-[11px] font-cairo text-slate-500 mt-1 leading-tight">{label}</div>
    </div>
  );
}

function SectionLabel({ n, title }: { n: string; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="w-6 h-6 rounded-md bg-amber-500 text-white text-xs font-black flex items-center justify-center">{n}</span>
      <h3 className="text-base font-black font-cairo text-slate-900">{title}</h3>
      <div className="h-px flex-1 bg-slate-200" />
    </div>
  );
}
