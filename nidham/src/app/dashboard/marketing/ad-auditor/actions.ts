"use server";

// ============================================================================
// Ad Auditor — server action (native replacement for Claude Ads)
// ============================================================================
// Pure-AI: paste an ad → scored audit + fixes + improved variants. Enterprise-
// gated like the rest of the Marketing Studio.

import { redirect } from "next/navigation";
import { requireHR } from "@/lib/permissions";
import { canUseFeature } from "@/lib/subscriptions-server";
import { auditAd, type AdAudit } from "@/lib/marketing-ai";

async function gate() {
  await requireHR();
  if (!(await canUseFeature("marketing_studio"))) {
    redirect(
      "/dashboard?error=" +
        encodeURIComponent("مدقق الإعلانات متاح للنسخة Enterprise فقط"),
    );
  }
}

export async function auditAdAction(input: {
  ad_text: string;
  platform: string;
  goal?: string;
  product?: string;
}): Promise<{ ok: true; audit: AdAudit } | { ok: false; error: string }> {
  await gate();
  const adText = (input.ad_text || "").trim();
  if (adText.length < 10) {
    return { ok: false, error: "الزق نص الإعلان الأول (10 حروف على الأقل)" };
  }
  try {
    const audit = await auditAd({
      ad_text: adText,
      platform: input.platform || "meta",
      goal: input.goal?.trim() || undefined,
      product: input.product?.trim() || undefined,
    });
    return { ok: true, audit };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "تعذّر التدقيق، جرّب تاني",
    };
  }
}
