"use client";

// Print trigger for the compliance report. Hidden in the printed output
// (print:hidden) so it never shows on paper / PDF.
export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="print:hidden px-5 py-2.5 rounded-lg bg-brand-cyan-dark hover:bg-brand-cyan text-white font-bold font-cairo text-sm transition"
    >
      🖨️ اطبع / احفظ PDF
    </button>
  );
}
