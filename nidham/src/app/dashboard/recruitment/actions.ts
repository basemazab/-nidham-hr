"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireHR, requireAdmin } from "@/lib/permissions";
import { bustDashboardCache } from "@/lib/cache";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_PIPELINE_STAGES } from "@/lib/recruitment";

function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 80)
    || "job";
}

export async function createJob(formData: FormData) {
  const { supabase, profile } = await requireHR();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const title = String(formData.get("title") ?? "").trim();
  if (!title) redirect("/dashboard/recruitment?error=" + encodeURIComponent("المسمى الوظيفي مطلوب"));

  const department = String(formData.get("department") ?? "").trim() || null;
  const jobType = String(formData.get("job_type") ?? "full_time");
  const level = String(formData.get("level") ?? "mid") || null;
  const location = String(formData.get("location") ?? "").trim() || null;
  const remoteOk = formData.get("remote_ok") === "on";
  const salaryMin = formData.get("salary_min") ? Number(formData.get("salary_min")) : null;
  const salaryMax = formData.get("salary_max") ? Number(formData.get("salary_max")) : null;
  const isSalaryVisible = formData.get("is_salary_visible") !== "off";
  const description = String(formData.get("description") ?? "").trim() || null;
  const requirements = String(formData.get("requirements") ?? "").trim() || null;
  const responsibilities = String(formData.get("responsibilities") ?? "").trim() || null;
  const benefits = String(formData.get("benefits") ?? "").trim() || null;
  const experienceMin = Number(formData.get("experience_years_min") ?? 0);
  const isPublic = formData.get("is_public") === "on";
  const status = String(formData.get("status") ?? "draft");

  let slug = slugify(title);
  const { data: existing } = await supabase.from("jobs").select("slug").eq("slug", slug).maybeSingle();
  if (existing) slug = slug + "-" + Date.now().toString(36);

  const { data: job, error } = await supabase.from("jobs").insert({
    company_id: profile.company_id,
    title, department, description, requirements, responsibilities, benefits,
    job_type: jobType, level, location, remote_ok: remoteOk,
    salary_min: salaryMin, salary_max: salaryMax, is_salary_visible: isSalaryVisible,
    experience_years_min: experienceMin,
    status, is_public: isPublic, slug,
    created_by: user.id,
    posted_at: status === "open" ? new Date().toISOString() : null,
  }).select("id").single();

  if (error) {
    redirect("/dashboard/recruitment?error=" + encodeURIComponent(error.message));
  }

  if (formData.get("skills") as string) {
    const skills = (String(formData.get("skills") ?? "").split(",").map(s => s.trim()).filter(Boolean));
    if (skills.length > 0) {
      const skillRows = skills.map(name => ({ job_id: job.id, name, is_required: true }));
      await supabase.from("job_skills").insert(skillRows);
    }
  }

  const stagesRaw = formData.get("pipeline_stages");
  if (stagesRaw) {
    try {
      const stages = JSON.parse(String(stagesRaw)) as Array<{ name: string; color?: string }>;
      await supabase.from("pipeline_stages").insert(
        stages.map((s, i) => ({
          job_id: job.id,
          name: s.name,
          ordinal: i,
          color: s.color ?? DEFAULT_PIPELINE_STAGES[i]?.color ?? "#3b82f6",
        }))
      );
    } catch { /* use defaults below */ }
  }

  if (!stagesRaw) {
    await supabase.from("pipeline_stages").insert(
      DEFAULT_PIPELINE_STAGES.map((s, i) => ({ job_id: job.id, name: s.name, ordinal: i, color: s.color }))
    );
  }

  revalidatePath("/dashboard/recruitment");
  bustDashboardCache();
  redirect("/dashboard/recruitment/jobs/" + job.id);
}

export async function updateJob(formData: FormData) {
  const { supabase, profile } = await requireHR();
  const jobId = String(formData.get("id") ?? "").trim();
  if (!jobId) redirect("/dashboard/recruitment?error=معرف الوظيفة مطلوب");

  const updates: Record<string, unknown> = {};
  const fields = ["title", "department", "description", "requirements", "responsibilities", "benefits",
    "job_type", "level", "location", "status"];
  for (const f of fields) {
    const val = formData.get(f);
    if (val !== null) updates[f] = String(val).trim() || null;
  }

  updates.remote_ok = formData.get("remote_ok") === "on";
  updates.is_salary_visible = formData.get("is_salary_visible") !== "off";
  updates.is_public = formData.get("is_public") === "on";

  const salaryMin = formData.get("salary_min");
  if (salaryMin) updates.salary_min = Number(salaryMin);
  const salaryMax = formData.get("salary_max");
  if (salaryMax) updates.salary_max = Number(salaryMax);
  const expMin = formData.get("experience_years_min");
  if (expMin) updates.experience_years_min = Number(expMin);

  if (updates.status === "open" && !updates.posted_at) {
    updates.posted_at = new Date().toISOString();
  }

  const { error } = await supabase.from("jobs").update(updates).eq("id", jobId).eq("company_id", profile.company_id);
  if (error) {
    redirect("/dashboard/recruitment/jobs/" + jobId + "?error=" + encodeURIComponent(error.message));
  }

  revalidatePath("/dashboard/recruitment/jobs/" + jobId);
  bustDashboardCache();
  redirect("/dashboard/recruitment/jobs/" + jobId + "?saved=1");
}

export async function moveApplicationStage(formData: FormData) {
  const { supabase, profile } = await requireHR();
  const { data: { user } } = await supabase.auth.getUser();

  const appId = String(formData.get("app_id") ?? "").trim();
  const toStage = String(formData.get("to_stage") ?? "").trim();
  const fromStage = String(formData.get("from_stage") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!appId || !toStage) {
    return { error: "بيانات ناقصة" };
  }

  const { error } = await supabase.from("applications").update({
    status: toStage,
    last_activity_at: new Date().toISOString(),
    reviewed_at: toStage !== "new" ? new Date().toISOString() : undefined,
  }).eq("id", appId).eq("company_id", profile.company_id);

  if (error) return { error: error.message };

  await supabase.from("stage_history").insert({
    application_id: appId,
    from_stage: fromStage === toStage ? null : fromStage,
    to_stage: toStage,
    changed_by: user?.id ?? null,
    notes,
  });

  if (toStage === "hired") {
    await supabase.from("jobs").update({ status: "filled" }).eq("id", (await supabase.from("applications").select("job_id").eq("id", appId).single()).data?.job_id ?? "");
  }

  revalidatePath("/dashboard/recruitment/jobs/[id]");
  bustDashboardCache();
  return { ok: true };
}

export async function submitApplication(formData: FormData) {
  const jobSlug = String(formData.get("job_slug") ?? "").trim();
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const cvText = String(formData.get("cv_text") ?? "").trim() || null;
  const coverLetter = String(formData.get("cover_letter") ?? "").trim() || null;

  if (!fullName || !email) {
    redirect("/jobs/" + jobSlug + "?error=" + encodeURIComponent("الاسم والإيميل مطلوبان"));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("submit_public_application", {
    p_job_slug: jobSlug,
    p_full_name: fullName,
    p_email: email,
    p_phone: phone,
    p_cv_text: cvText,
    p_cover_letter: coverLetter,
  });

  if (error) {
    redirect("/jobs/" + jobSlug + "?error=" + encodeURIComponent(error.message));
  }

  redirect("/jobs/" + jobSlug + "?applied=" + data);
}
