"use server";

// ============================================================================
// SEO Content Optimizer — server action (native replacement for Surfer)
// ============================================================================

import { redirect } from "next/navigation";
import { requireHR } from "@/lib/permissions";
import { canUseFeature } from "@/lib/subscriptions-server";
import { optimizeSeoContent, type SeoOptimizeResult } from "@/lib/marketing-ai";

async function gate() {
  await requireHR();
  if (!(await canUseFeature("marketing_studio"))) {
    redirect(
      "/dashboard?error=" +
        encodeURIComponent("محسّن المحتوى متاح للنسخة Enterprise فقط"),
    );
  }
}

export async function optimizeSeoAction(input: {
  keyword: string;
  content: string;
  title?: string;
}): Promise<{ ok: true; result: SeoOptimizeResult } | { ok: false; error: string }> {
  await gate();
  const keyword = (input.keyword || "").trim();
  const content = (input.content || "").trim();
  if (keyword.length < 2) {
    return { ok: false, error: "اكتب الكلمة المفتاحية المستهدفة" };
  }
  if (content.length < 50) {
    return { ok: false, error: "الزق محتوى أطول (50 حرف على الأقل)" };
  }
  try {
    const result = await optimizeSeoContent({
      keyword,
      content,
      title: input.title?.trim() || undefined,
    });
    return { ok: true, result };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "تعذّر التحليل، جرّب تاني",
    };
  }
}
