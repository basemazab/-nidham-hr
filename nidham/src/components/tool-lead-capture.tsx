"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { captureToolLead } from "@/app/tools/lead-actions";

// Lead-magnet capture shown under a free calculator. The visitor just got a
// useful result; we offer to do it automatically (the product) and capture
// their contact as a vendor lead. Tasteful + optional — the tool stays free.
export function ToolLeadCapture({
  source,
  title = "عايز النظام يحسبها تلقائي لكل موظفينك؟",
  subtitle = "نِظام بيحسب مرتبات وتأمينات وضرائب كل موظفينك تلقائيًا كل شهر، ويطلّع قسائم رواتب، وينبّهك من الغرامات قبل ما تحصل.",
}: {
  source: string;
  title?: string;
  subtitle?: string;
}) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  function submit() {
    setError("");
    const v = contact.trim();
    if (!v) {
      setError("سيب رقم موبايل أو إيميل");
      return;
    }
    const isEmail = v.includes("@");
    start(async () => {
      const res = await captureToolLead({
        name: name.trim() || undefined,
        phone: isEmail ? undefined : v,
        email: isEmail ? v : undefined,
        source,
      });
      if (res.ok) setDone(true);
      else setError(res.error);
    });
  }

  if (done) {
    return (
      <div className="mt-8 rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-6 text-center font-cairo">
        <div className="text-3xl mb-2">✅</div>
        <div className="font-black text-emerald-800 mb-1">تمام! وصلنا بياناتك</div>
        <p className="text-sm text-emerald-700 mb-4">
          هنتواصل معاك قريب نرتّبلك تجربة مجانية. أو ابدأ دلوقتي بنفسك:
        </p>
        <Link
          href="/signup"
          className="inline-block px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition"
        >
          جرّب نِظام مجانًا 14 يوم
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-2xl border-2 border-brand-cyan/30 bg-gradient-to-br from-cyan-50 to-white p-6 font-cairo shadow-sm">
      <div className="flex items-start gap-3 mb-4">
        <span className="text-2xl shrink-0">🚀</span>
        <div>
          <h3 className="font-black text-slate-800 text-lg leading-tight">{title}</h3>
          <p className="text-sm text-slate-600 leading-relaxed mt-1">{subtitle}</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-2 mb-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="اسمك (اختياري)"
          className="px-4 py-2.5 rounded-lg border border-slate-300 text-sm outline-none focus:border-brand-cyan"
        />
        <input
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="موبايل أو إيميل *"
          dir="ltr"
          className="px-4 py-2.5 rounded-lg border border-slate-300 text-sm outline-none focus:border-brand-cyan text-right"
        />
      </div>

      {error && <div className="text-xs text-rose-600 mb-2">⚠ {error}</div>}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-cyan-dark text-white font-bold text-sm shadow-md hover:shadow-lg disabled:opacity-60 transition"
        >
          {pending ? "..." : "كلّموني + تجربة مجانية"}
        </button>
        <Link
          href="/signup"
          className="text-sm text-brand-cyan-dark font-bold hover:underline"
        >
          أو جرّبه بنفسك دلوقتي ←
        </Link>
      </div>
      <p className="text-[11px] text-slate-400 mt-2">
        مفيش التزام · مش هنزعجك · بياناتك آمنة.
      </p>
    </div>
  );
}
