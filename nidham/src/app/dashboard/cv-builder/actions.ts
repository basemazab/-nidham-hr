"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { requireHR } from "@/lib/permissions";
import {
  structureAndEnhanceCV,
  reviewCvAts,
  type CvData,
  type AtsReview,
} from "@/lib/cv-builder";

// Build structured + ATS-enhanced CvData from raw text (paste / file extract).
export async function buildCvFromText(input: {
  rawText: string;
  targetRole?: string;
}): Promise<{ ok: true; cv: CvData } | { ok: false; error: string }> {
  await requireHR();
  if ((input.rawText ?? "").trim().length < 30) {
    return { ok: false, error: "النص قصير — الصق سيرتك أو بياناتك (30 حرف على الأقل)" };
  }
  try {
    const cv = await structureAndEnhanceCV({
      rawText: input.rawText,
      targetRole: input.targetRole?.trim() || undefined,
    });
    return { ok: true, cv };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? `تعذّر التحسين — ${err.message.slice(0, 120)}` : "تعذّر التحسين",
    };
  }
}

// Score the current CV against ATS + target role.
export async function scoreCv(input: {
  cv: CvData;
  targetRole?: string;
}): Promise<{ ok: true; review: AtsReview } | { ok: false; error: string }> {
  await requireHR();
  try {
    const review = await reviewCvAts({ cv: input.cv, targetRole: input.targetRole?.trim() || undefined });
    return { ok: true, review };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? `تعذّر التقييم — ${err.message.slice(0, 120)}` : "تعذّر التقييم",
    };
  }
}

// Save (insert/update) a CV. Returns the row id.
export async function saveCv(input: {
  id?: string;
  title: string;
  targetRole?: string;
  cv: CvData;
  atsScore?: number | null;
  atsReview?: AtsReview | null;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const { supabase, profile } = await requireHR();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const payload = {
    company_id: profile.company_id,
    title: input.title?.trim() || input.cv.full_name || "سيرة ذاتية",
    target_role: input.targetRole?.trim() || null,
    data: input.cv,
    ats_score: input.atsScore ?? null,
    ats_review: input.atsReview ?? null,
    updated_at: new Date().toISOString(),
    created_by: user?.id ?? null,
  };

  if (input.id) {
    const { error } = await supabase
      .from("cvs")
      .update(payload)
      .eq("id", input.id)
      .eq("company_id", profile.company_id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/dashboard/cv-builder");
    return { ok: true, id: input.id };
  }

  const { data, error } = await supabase
    .from("cvs")
    .insert(payload)
    .select("id")
    .single<{ id: string }>();
  if (error || !data) {
    return {
      ok: false,
      error: /relation .* does not exist|PGRST205|schema cache/i.test(error?.message ?? "")
        ? "طبّق migration 111 في Supabase الأول"
        : error?.message || "فشل الحفظ",
    };
  }
  revalidatePath("/dashboard/cv-builder");
  return { ok: true, id: data.id };
}

// Publish the CV as an interactive public page → returns the public URL.
export async function publishCv(input: {
  id: string;
}): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const { supabase, profile } = await requireHR();

  const { data: row } = await supabase
    .from("cvs")
    .select("slug, data")
    .eq("id", input.id)
    .eq("company_id", profile.company_id)
    .maybeSingle<{ slug: string | null; data: CvData }>();
  if (!row) return { ok: false, error: "السيرة غير موجودة" };

  let slug = row.slug;
  if (!slug) {
    const base = (row.data?.full_name || "cv")
      .toLowerCase()
      .replace(/[؀-ۿ\s]+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40);
    slug = `${base || "cv"}-${randomUUID().slice(0, 6)}`;
  }

  const { error } = await supabase
    .from("cvs")
    .update({ slug, is_public: true, updated_at: new Date().toISOString() })
    .eq("id", input.id)
    .eq("company_id", profile.company_id);
  if (error) return { ok: false, error: error.message };

  const site = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.nidhamhr.com").replace(/\/$/, "");
  revalidatePath("/dashboard/cv-builder");
  return { ok: true, url: `${site}/cv/${slug}` };
}
