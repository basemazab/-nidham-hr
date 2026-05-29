"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireHR } from "@/lib/permissions";

function asText(v: FormDataEntryValue | null): string | null {
  if (v === null) return null;
  const t = String(v).trim();
  return t.length === 0 ? null : t;
}

function asInt(v: FormDataEntryValue | null): number | null {
  const t = asText(v);
  if (t === null) return null;
  const n = parseInt(t, 10);
  return Number.isFinite(n) ? n : null;
}

export async function createCourse(formData: FormData) {
  const { profile } = await requireHR();

  const title = asText(formData.get("title"));
  if (!title) {
    redirect(
      "/dashboard/training/courses/new?error=" +
        encodeURIComponent("عنوان الدورة مطلوب"),
    );
  }

  const supabase = await createClient();

  const { error } = await supabase.from("training_courses").insert({
    company_id: profile.company_id,
    title,
    category: asText(formData.get("category")) ?? "Technical",
    description: asText(formData.get("description")),
    duration_hours: asInt(formData.get("duration")),
    max_participants: asInt(formData.get("max_participants")),
    instructor: asText(formData.get("instructor")),
    course_type: asText(formData.get("course_type")) ?? "in_person",
    status: "active",
    created_by: profile.id,
  });

  if (error && error.code !== "42P01") {
    redirect(
      "/dashboard/training/courses/new?error=" +
        encodeURIComponent("فشل حفظ الدورة: " + error.message),
    );
  }

  revalidatePath("/dashboard/training/courses");
  redirect("/dashboard/training/courses");
}

export async function enrollInCourse(formData: FormData) {
  const { profile } = await requireHR();

  const courseId = asText(formData.get("course_id"));
  const employeeId = asText(formData.get("employee_id"));

  if (!courseId || !employeeId) {
    redirect(
      "/dashboard/training/courses?error=" +
        encodeURIComponent("بيانات التسجيل غير مكتملة"),
    );
  }

  const supabase = await createClient();

  const { error } = await supabase.from("training_enrollments").insert({
    company_id: profile.company_id,
    course_id: courseId,
    employee_id: employeeId,
    status: "pending",
    progress: 0,
    enrolled_by: profile.id,
  });

  if (error && error.code !== "42P01") {
    redirect(
      "/dashboard/training/courses?error=" +
        encodeURIComponent("فشل التسجيل: " + error.message),
    );
  }

  revalidatePath("/dashboard/training/enrollments");
  redirect("/dashboard/training/enrollments");
}

export async function updateEnrollmentStatus(formData: FormData) {
  const { profile } = await requireHR();

  const enrollmentId = asText(formData.get("enrollment_id"));
  const status = asText(formData.get("status"));
  const progressStr = asText(formData.get("progress"));

  if (!enrollmentId || !status) {
    redirect(
      "/dashboard/training/enrollments?error=" +
        encodeURIComponent("بيانات التحديث غير مكتملة"),
    );
  }

  const supabase = await createClient();

  const updateData: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  if (progressStr !== null) {
    const p = parseInt(progressStr, 10);
    if (Number.isFinite(p)) updateData.progress = p;
  }
  if (status === "completed") updateData.progress = 100;

  const { error } = await supabase
    .from("training_enrollments")
    .update(updateData)
    .eq("id", enrollmentId)
    .eq("company_id", profile.company_id);

  if (error && error.code !== "42P01") {
    redirect(
      "/dashboard/training/enrollments?error=" +
        encodeURIComponent("فشل تحديث الحالة: " + error.message),
    );
  }

  revalidatePath("/dashboard/training/enrollments");
  redirect("/dashboard/training/enrollments");
}
