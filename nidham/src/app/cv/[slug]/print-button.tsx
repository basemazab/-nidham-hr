"use client";

export function CvPrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-sm font-cairo hover:bg-slate-800 transition"
    >
      🖨️ اطبع / حمّل PDF
    </button>
  );
}
