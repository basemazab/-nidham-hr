"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireHR } from "@/lib/permissions";
import { runSystemHealth, type HealthCheck } from "@/lib/system-health";

// Run the full live diagnostics for the caller's company.
export async function runHealthAction(): Promise<
  | { ok: true; checks: HealthCheck[]; ranAt: string }
  | { ok: false; error: string }
> {
  try {
    const { supabase, profile } = await requireHR();
    const checks = await runSystemHealth(supabase, profile.company_id);
    return { ok: true, checks, ranAt: new Date().toISOString() };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "فشل الفحص",
    };
  }
}

// Manually publish all DUE scheduled posts now (LinkedIn + social). A safety
// valve for when Vercel's daily cron is late/stalled — the admin triggers the
// exact same work the cron does, on demand. Runs with the service role.
export async function runScheduledNow(): Promise<void> {
  await requireHR();
  const { createServiceClient } = await import("@/lib/supabase/service");
  const svc = createServiceClient();

  let posted = 0;
  let failed = 0;
  try {
    const { runScheduledLinkedInPosts } = await import("@/lib/linkedin-scheduler");
    const r = await runScheduledLinkedInPosts(svc);
    posted += r?.posted ?? 0;
    failed += r?.failed ?? 0;
  } catch {
    /* best-effort */
  }
  try {
    const { publishDueSocialPosts } = await import("@/lib/social-scheduler");
    const r = await publishDueSocialPosts(svc);
    posted += r?.published ?? 0;
    failed += r?.failed ?? 0;
  } catch {
    /* best-effort */
  }

  revalidatePath("/dashboard/system-engineer");
  redirect(`/dashboard/system-engineer?ran=${posted}_${failed}`);
}

// File a bug report / feature request with a fresh diagnostics snapshot
// attached — so whoever implements it starts with full context.
export async function createDevRequest(form: FormData): Promise<void> {
  const { supabase, profile } = await requireHR();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const kind = form.get("kind") === "feature" ? "feature" : "bug";
  const title = String(form.get("title") ?? "").trim().slice(0, 150);
  const details = String(form.get("details") ?? "").trim().slice(0, 4000);

  if (!title) {
    redirect(
      "/dashboard/system-engineer?error=" +
        encodeURIComponent("اكتب عنوان للطلب"),
    );
  }

  // Diagnostics snapshot is best-effort — the ticket matters more.
  let diagnostics: HealthCheck[] | null = null;
  try {
    diagnostics = await runSystemHealth(supabase, profile.company_id);
  } catch {
    diagnostics = null;
  }

  const { error } = await supabase.from("dev_requests").insert({
    company_id: profile.company_id,
    kind,
    title,
    details: details || null,
    diagnostics,
    created_by: user?.id ?? null,
  });

  if (error) {
    redirect(
      "/dashboard/system-engineer?error=" +
        encodeURIComponent(
          /relation .* does not exist|PGRST205|schema cache/i.test(error.message)
            ? "طبّق migration 108 في Supabase الأول"
            : error.message,
        ),
    );
  }

  revalidatePath("/dashboard/system-engineer");
  redirect("/dashboard/system-engineer?created=1");
}
