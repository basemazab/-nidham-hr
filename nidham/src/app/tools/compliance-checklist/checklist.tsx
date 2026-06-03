"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// ============================================================================
// Interactive Egyptian HR compliance checklist — 2026
// ============================================================================
//
// A free, sticky lead magnet: an interactive checklist a business owner /
// HR manager runs against their own company. Progress persists to
// localStorage so they come back to it. Each item carries the legal
// reference (Law 12/2003, 148/2019, tax, 168/2023) so it reads as
// authoritative. The "incomplete" items are exactly the pains Nidham
// removes → strong, honest CTA.

type Item = { id: string; text: string; ref?: string };
type Group = { title: string; icon: string; items: Item[] };

const GROUPS: Group[] = [
  {
    title: "التعاقد والتوظيف",
    icon: "📝",
    items: [
      { id: "contract", text: "عقد عمل مكتوب بـ 3 نسخ لكل موظف", ref: "قانون 12/2003" },
      { id: "form1", text: "تقديم نموذج 1 للتأمينات خلال 7 أيام من التعيين", ref: "قانون 148/2019" },
      { id: "file", text: "ملف موظف كامل (مؤهلات، رقم قومي، شهادات)", ref: "" },
      { id: "probation", text: "تحديد فترة الاختبار في العقد (3 شهور كحد أقصى)", ref: "المادة 33" },
    ],
  },
  {
    title: "التأمينات الاجتماعية",
    icon: "🛡️",
    items: [
      { id: "si-register", text: "تسجيل كل العاملين في التأمينات الاجتماعية", ref: "قانون 148/2019" },
      { id: "si-pay", text: "سداد الاشتراكات الشهرية في موعدها (تجنب غرامة التأخير)", ref: "" },
      { id: "si-rates", text: "خصم 11% من الموظف + 18.75% حصة صاحب العمل", ref: "قانون 148/2019" },
      { id: "form6", text: "نموذج 6 عند انتهاء خدمة أي موظف", ref: "" },
    ],
  },
  {
    title: "الأجور والضرائب",
    icon: "💰",
    items: [
      { id: "minwage", text: "الالتزام بالحد الأدنى للأجور المعلن", ref: "" },
      { id: "tax-monthly", text: "خصم ضريبة كسب العمل شهرياً بالشرائح 2026", ref: "" },
      { id: "form4", text: "تقديم النموذج 4 (ضريبة المرتبات) ربع سنوي", ref: "" },
      { id: "form27", text: "تسوية النموذج 27 السنوية", ref: "" },
    ],
  },
  {
    title: "ساعات العمل والإجازات",
    icon: "⏰",
    items: [
      { id: "attendance", text: "سجل حضور وانصراف موثّق لكل موظف", ref: "" },
      { id: "leave", text: "منح الإجازة السنوية المستحقة (21 / 30 يوم)", ref: "المادة 47" },
      { id: "overtime", text: "حساب الأوفر تايم بنسبه الصحيحة (35% / 70% / 100%)", ref: "المادة 85" },
      { id: "weeklyrest", text: "يوم راحة أسبوعي مدفوع", ref: "" },
    ],
  },
  {
    title: "اللوائح والسلامة",
    icon: "🏛️",
    items: [
      { id: "penalties", text: "لائحة جزاءات معتمدة من مكتب العمل", ref: "" },
      { id: "harassment", text: "سياسة منع التحرش (للشركات 50 موظف فأكثر)", ref: "قانون 168/2023" },
      { id: "safety", text: "لجنة سلامة ومسؤول سلامة (50 موظف فأكثر)", ref: "" },
      { id: "report", text: "تقرير سنوي لمكتب العمل بإجمالي العاملين", ref: "" },
    ],
  },
  {
    title: "إنهاء الخدمة",
    icon: "📤",
    items: [
      { id: "notice", text: "إخطار قانوني قبل الفصل (حسب مدة الخدمة)", ref: "" },
      { id: "eos", text: "حساب مكافأة نهاية الخدمة وصرفها", ref: "المادة 122" },
      { id: "settlement", text: "مخالصة موقّعة + شهادة خبرة", ref: "" },
    ],
  },
];

const ALL_IDS = GROUPS.flatMap((g) => g.items.map((i) => i.id));
const STORAGE_KEY = "nidham-compliance-checklist";

export function ComplianceChecklist() {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  // Load saved progress after mount (avoids hydration mismatch).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setChecked(new Set(JSON.parse(raw) as string[]));
    } catch {
      // ignore corrupt storage
    }
    setLoaded(true);
  }, []);

  // Persist on every change (after the initial load).
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...checked]));
    } catch {
      // ignore quota errors
    }
  }, [checked, loaded]);

  const toggle = (id: string) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const reset = () => setChecked(new Set());

  const done = checked.size;
  const total = ALL_IDS.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div>
      {/* Progress */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border border-slate-200 rounded-2xl p-5 mb-6 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-slate-700">
            نسبة الالتزام: {pct}%
          </span>
          <span className="text-sm text-slate-500">
            {done} من {total}
          </span>
        </div>
        <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              pct === 100 ? "bg-emerald-500" : pct >= 60 ? "bg-cyan-500" : "bg-amber-500"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {done > 0 && (
          <button
            type="button"
            onClick={reset}
            className="mt-3 text-xs text-slate-400 hover:text-slate-600 underline"
          >
            إعادة تعيين
          </button>
        )}
      </div>

      {/* Groups */}
      <div className="space-y-6">
        {GROUPS.map((group) => (
          <div key={group.title} className="rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
              <span className="text-xl">{group.icon}</span>
              <h2 className="font-black text-slate-900">{group.title}</h2>
            </div>
            <ul>
              {group.items.map((item) => {
                const isOn = checked.has(item.id);
                return (
                  <li key={item.id} className="border-b border-slate-100 last:border-b-0">
                    <button
                      type="button"
                      onClick={() => toggle(item.id)}
                      className="w-full flex items-start gap-3 px-5 py-3.5 text-right hover:bg-slate-50 transition"
                    >
                      <span
                        className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition ${
                          isOn
                            ? "bg-emerald-500 border-emerald-500 text-white"
                            : "border-slate-300"
                        }`}
                      >
                        {isOn && (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                      <span className="flex-1">
                        <span className={`text-sm ${isOn ? "text-slate-400 line-through" : "text-slate-800"}`}>
                          {item.text}
                        </span>
                        {item.ref && (
                          <span className="block text-xs text-slate-400 mt-0.5">{item.ref}</span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* CTA — adapts to progress */}
      <div className="mt-8 rounded-3xl bg-gradient-to-br from-brand-cyan to-brand-cyan-dark p-8 text-white shadow-xl text-center">
        <h2 className="text-2xl font-black mb-3">
          {pct === 100
            ? "ممتاز! شركتك ملتزمة 👏"
            : `عندك ${total - done} بند ناقص للالتزام الكامل`}
        </h2>
        <p className="text-cyan-50 mb-5 max-w-xl mx-auto">
          نِظام HR بيأتمت معظم البنود دي تلقائياً: نموذج 1 و6، حساب التأمينات
          والضرايب، سجل الحضور، رصيد الإجازات، ومكافأة نهاية الخدمة — في مكان
          واحد. 14 يوم تجربة مجاناً.
        </p>
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-white text-brand-cyan-dark font-bold shadow-md hover:shadow-lg transition"
        >
          🚀 ابدأ تجربة مجانية
        </Link>
      </div>
    </div>
  );
}
