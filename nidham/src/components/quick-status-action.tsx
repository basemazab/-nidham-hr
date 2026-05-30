"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setEmployeeStatus } from "@/app/dashboard/employees/actions";

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: string; color: string }
> = {
  active: { label: "نشط", icon: "✓", color: "emerald" },
  on_leave: { label: "في إجازة", icon: "🏖", color: "amber" },
  terminated: { label: "منتهي", icon: "⛔", color: "red" },
  resigned: { label: "استقال", icon: "🚪", color: "slate" },
  inactive: { label: "غير نشط", icon: "⏸", color: "slate" },
};

interface Props {
  employeeId: string;
  currentStatus: string;
}

export function QuickStatusAction({ employeeId, currentStatus }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleChange(status: string) {
    const formData = new FormData();
    formData.append("employee_id", employeeId);
    formData.append("status", status);
    setOpen(false);
    await setEmployeeStatus(employeeId, status);
    router.refresh();
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 font-cairo shadow-sm"
      >
        <span>🏷</span>
        <span>تغيير الحالة</span>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-full z-20 mt-2 w-52 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            {Object.entries(STATUS_CONFIG).map(([value, config]) => {
              const isCurrent = value === currentStatus;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleChange(value)}
                  disabled={isCurrent}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-right text-sm transition ${
                    isCurrent
                      ? "bg-cyan-50 font-bold text-cyan-700 cursor-not-allowed"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="text-lg">{config.icon}</span>
                  <span className="flex-1">{config.label}</span>
                  {isCurrent && (
                    <span className="rounded-full bg-cyan-200 px-2 py-0.5 text-[10px] font-bold text-cyan-700">
                      الحالية
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
