"use client";

import { useCallback, useEffect, useState } from "react";
import { toggleChecklistItem, getChecklistProgress } from "../actions";

type ChecklistCategory = {
  key: string;
  label: string;
  icon: string;
  items: { key: string; label: string }[];
};

const CATEGORIES: ChecklistCategory[] = [
  {
    key: "hr",
    label: "الموارد البشرية والمستندات",
    icon: "📋",
    items: [
      { key: "contract_signed", label: "توقيع العقد" },
      { key: "id_card", label: "بطاقة تعريف / كارنيه" },
      { key: "bank_account", label: "حساب بنكي" },
      { key: "emergency_contact", label: "جهة اتصال طارئة" },
    ],
  },
  {
    key: "it",
    label: "إعدادات تقنية المعلومات",
    icon: "💻",
    items: [
      { key: "email_created", label: "إنشاء البريد الإلكتروني" },
      { key: "system_access", label: "صلاحية الدخول للأنظمة" },
      { key: "laptop_equipment", label: "لاب توب / أجهزة" },
      { key: "software_installed", label: "تثبيت البرامج" },
    ],
  },
  {
    key: "training",
    label: "التدريب",
    icon: "🎓",
    items: [
      { key: "company_orientation", label: "تعريف بالشركة" },
      { key: "department_training", label: "تدريب القسم" },
      { key: "buddy_assigned", label: "تخصيص مرشد (Buddy)" },
    ],
  },
  {
    key: "facilities",
    label: "المرافق",
    icon: "🏢",
    items: [
      { key: "desk_assigned", label: "تخصيص مكتب" },
      { key: "access_card", label: "بطاقة دخول" },
      { key: "parking", label: "موقف سيارة" },
    ],
  },
];

const STORAGE_KEY = (employeeId: string) => `onboarding_${employeeId}`;

export function OnboardingChecklistClient({
  employeeId,
}: {
  employeeId: string;
}) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY(employeeId));
    if (stored) {
      try {
        setChecked(JSON.parse(stored));
        setLoaded(true);
        return;
      } catch {
        // corrupt data
      }
    }
    // Try loading from server
    getChecklistProgress(employeeId, "onboarding").then((res) => {
      if (res.success && res.data.length > 0) {
        const map: Record<string, boolean> = {};
        for (const item of res.data) {
          map[item.item_key] = item.checked;
        }
        setChecked(map);
      }
      setLoaded(true);
    });
  }, [employeeId]);

  const persist = useCallback(
    (updated: Record<string, boolean>) => {
      localStorage.setItem(STORAGE_KEY(employeeId), JSON.stringify(updated));
    },
    [employeeId],
  );

  const handleToggle = useCallback(
    async (itemKey: string) => {
      const next = !checked[itemKey];
      const updated = { ...checked, [itemKey]: next };
      setChecked(updated);
      persist(updated);
      // Try server sync (best-effort)
      await toggleChecklistItem(employeeId, itemKey, next, "onboarding");
    },
    [checked, employeeId, persist],
  );

  const allItems = CATEGORIES.flatMap((c) => c.items);
  const total = allItems.length;
  const done = allItems.filter((i) => checked[i.key]).length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div>
      {/* Progress Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="font-bold font-cairo text-slate-800">
            تقدم الإجراءات
          </div>
          <div className="text-sm font-black font-cairo text-brand-cyan-dark">
            {done}/{total} — {progress}%
          </div>
        </div>
        <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-cyan to-emerald-400 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        {!loaded && (
          <div className="text-xs text-slate-400 font-cairo mt-2">
            جارٍ التحميل…
          </div>
        )}
        {loaded && progress === 100 && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-bold font-cairo text-center">
            ✅ تم استكمال جميع إجراءات الاستقبال
          </div>
        )}
      </div>

      {/* Checklist Categories */}
      <div className="space-y-4">
        {CATEGORIES.map((cat) => {
          const catDone = cat.items.filter((i) => checked[i.key]).length;
          const catTotal = cat.items.length;
          return (
            <div
              key={cat.key}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">{cat.icon}</span>
                <h3 className="font-bold font-cairo text-slate-800">
                  {cat.label}
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold font-cairo">
                  {catDone}/{catTotal}
                </span>
              </div>
              <div className="space-y-2">
                {cat.items.map((item) => {
                  const isChecked = checked[item.key] ?? false;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => handleToggle(item.key)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border text-right transition ${
                        isChecked
                          ? "bg-emerald-50 border-emerald-200"
                          : "bg-slate-50 border-slate-100 hover:border-brand-cyan/30"
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition ${
                          isChecked
                            ? "bg-emerald-500 border-emerald-500 text-white"
                            : "bg-white border-slate-300"
                        }`}
                      >
                        {isChecked && (
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="w-4 h-4"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                      <span
                        className={`font-cairo text-sm ${
                          isChecked
                            ? "text-emerald-700 line-through"
                            : "text-slate-700"
                        }`}
                      >
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
