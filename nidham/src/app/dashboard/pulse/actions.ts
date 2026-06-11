"use server";

import { revalidatePath } from "next/cache";
import { requireHR } from "@/lib/permissions";
import {
  collectPulseData,
  generatePulseBrief,
  type PulseBrief,
  type PulseData,
} from "@/lib/pulse";

export type PulseBriefRow = {
  id: string;
  brief_date: string;
  headline: string;
  health_score: number;
  items: PulseBrief["items"];
  stats: Record<string, number | string>;
  created_at: string;
};

// Generate (or regenerate) today's pulse for the caller's company and store it.
export async function generateTodayPulse(): Promise<
  | { ok: true; brief: PulseBriefRow }
  | { ok: false; error: string }
> {
  const { supabase, profile } = await requireHR();

  let data: PulseData;
  try {
    data = await collectPulseData(supabase, profile.company_id);
  } catch (err) {
    return {
      ok: false,
      error: `فشل جمع البيانات: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  let brief: PulseBrief;
  try {
    brief = await generatePulseBrief(data);
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message.slice(0, 200) : "فشل توليد البريفينج",
    };
  }

  const stats = {
    headcount: data.headcount,
    present: data.attendance.present,
    absent: data.attendance.absent,
    late: data.attendance.late,
    pendingLeaves: data.leaves.pending,
    pendingAdvances: data.advances.pending,
    newLeads7d: data.crm.newLeads7d,
    hotLeads: data.crm.hotLeadsLast72h.length,
    openConversations: data.crm.openConversations,
    estMonthlyPayroll: data.estMonthlyPayroll,
  };

  const { data: saved, error } = await supabase
    .from("pulse_briefs")
    .upsert(
      {
        company_id: profile.company_id,
        brief_date: data.date,
        headline: brief.headline,
        health_score: Math.round(brief.health_score),
        items: brief.items,
        stats,
      },
      { onConflict: "company_id,brief_date" },
    )
    .select("id, brief_date, headline, health_score, items, stats, created_at")
    .single<PulseBriefRow>();

  if (error || !saved) {
    return {
      ok: false,
      error: /relation .* does not exist|PGRST205|schema cache/i.test(error?.message ?? "")
        ? "طبّق migration 104 في Supabase الأول"
        : error?.message || "فشل الحفظ",
    };
  }

  revalidatePath("/dashboard/pulse");
  return { ok: true, brief: saved };
}
