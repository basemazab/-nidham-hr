"use client";

// Print trigger for the weekly schedule. Replaces an inline <script> that
// only ran on a full page load (never on client-side navigation), so the
// button used to do nothing when reached via an in-app link.
export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm font-cairo transition print:hidden"
    >
      🖨 طباعة
    </button>
  );
}
