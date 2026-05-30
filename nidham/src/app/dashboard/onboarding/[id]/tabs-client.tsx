"use client";

import { useState } from "react";
import { OnboardingChecklistClient } from "./checklist-client";
import { ThirtySixtyNinetyPlan } from "./thirty-sixty-ninety-plan";

const TABS = [
  { key: "checklist", label: "📋 إجراءات الاستقبال", desc: "المستندات والتجهيزات" },
  { key: "goals", label: "📅 خطة 30-60-90", desc: "المراحل والأهداف" },
] as const;

export function OnboardingTabsClient({
  employeeId,
  hireDate,
}: {
  employeeId: string;
  hireDate: string | null;
}) {
  const [activeTab, setActiveTab] = useState<string>("checklist");

  return (
    <div>
      {/* Tab bar */}
      <div className="mb-6 flex gap-1 rounded-2xl border border-slate-200 bg-slate-100/50 p-1 shadow-sm">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 rounded-xl px-4 py-2.5 text-right transition-all ${
                isActive
                  ? "bg-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <div
                className={`font-bold font-cairo text-sm ${
                  isActive ? "text-slate-800" : "text-slate-600"
                }`}
              >
                {tab.label}
              </div>
              <div className="text-[10px] font-cairo text-slate-400">
                {tab.desc}
              </div>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === "checklist" && (
        <OnboardingChecklistClient employeeId={employeeId} />
      )}
      {activeTab === "goals" && (
        <ThirtySixtyNinetyPlan
          employeeId={employeeId}
          hireDate={hireDate}
        />
      )}
    </div>
  );
}
