"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { refreshCustomerProfiles } from "./actions";

// One-tap backfill: pulls names + profile pics from Meta for conversations
// that are still showing "مستخدم ......" (created before the token worked).
export function RefreshNamesButton() {
  const router = useRouter();
  const [state, setState] = useState<
    | { status: "idle" }
    | { status: "loading" }
    | { status: "done"; ok: boolean; msg: string }
  >({ status: "idle" });

  function run() {
    setState({ status: "loading" });
    refreshCustomerProfiles().then((res) => {
      if (res.ok) {
        setState({
          status: "done",
          ok: true,
          msg:
            res.updated > 0
              ? `تم جلب ${res.updated} اسم${res.remaining ? ` (${res.remaining} متاحين مش سامحين بالبيانات)` : ""}`
              : "كل الأسماء المتاحة ظاهرة بالفعل",
        });
        router.refresh();
      } else {
        setState({ status: "done", ok: false, msg: res.error });
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={run}
        disabled={state.status === "loading"}
        className="px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 font-bold text-sm hover:bg-slate-50 disabled:opacity-50 transition"
      >
        {state.status === "loading" ? "بيجلب الأسماء..." : "👤 تحديث أسماء العملاء"}
      </button>
      {state.status === "done" && (
        <span
          className={`text-xs font-bold ${state.ok ? "text-emerald-700" : "text-rose-700"}`}
        >
          {state.ok ? "✓ " : "⚠️ "}
          {state.msg}
        </span>
      )}
    </div>
  );
}
