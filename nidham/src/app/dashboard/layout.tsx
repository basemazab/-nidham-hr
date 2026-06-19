import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { SupportChat } from "@/components/support-chat";
import { getMyFeatureOverrides } from "@/lib/subscriptions-server";
import type { Plan } from "@/lib/subscriptions";

type Profile = {
  full_name: string | null;
  role: "admin" | "manager" | "employee";
  companies: { name: string } | null;
};

type SubscriptionLite = {
  plan: Plan;
  ends_at: string;
};

// /dashboard is the HR-facing surface (admin + manager). Employees see
// the company data through the mobile app and have no business browsing
// the web UI -- migration 017 also denies them most SELECTs via RLS, so
// pages would render empty anyway. Catching them here gives a clean
// redirect with an Arabic explainer instead of a confusing blank screen.
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Defense-in-depth: even if middleware somehow misses the 2FA check,
  // verify the nidham_2fa_pass cookie is present when 2FA is enabled.
  const cookieStore = await cookies();
  const twofaPass = cookieStore.get("nidham_2fa_pass");
  if (!twofaPass) {
    const { data: twofaProfile } = await supabase
      .from("profiles")
      .select("two_factor_enabled")
      .eq("id", user.id)
      .single<{ two_factor_enabled: boolean | null }>();
    if (twofaProfile?.two_factor_enabled === true) {
      redirect("/login/2fa");
    }
  }

  const [profileRes, superAdminRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, role, company_id, companies(name)")
      .eq("id", user.id)
      .single<Profile & { company_id: string }>(),
    supabase
      .from("super_admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const profile = profileRes.data;
  // Reuse company_id from the profile row above — no extra profiles query.
  const callerCompanyId = profile?.company_id;

  // Subscription + feature overrides are independent, so fetch them in
  // parallel (one round-trip instead of two on EVERY dashboard page).
  // Subscription stays company-scoped to defend against the super_admin
  // RLS bypass returning multi-tenant rows.
  const [subRes, featureOverrides] = await Promise.all([
    callerCompanyId
      ? supabase
          .from("subscriptions")
          .select("plan, ends_at")
          .eq("company_id", callerCompanyId)
          .maybeSingle<SubscriptionLite>()
      : Promise.resolve({ data: null }),
    getMyFeatureOverrides(),
  ]);
  const subscription = subRes.data;
  // eslint-disable-next-line react-hooks/purity
  const nowMs = Date.now();
  const daysLeft = subscription
    ? Math.round(
        (new Date(subscription.ends_at + "T23:59:59").getTime() - nowMs) /
          (1000 * 60 * 60 * 24),
      )
    : undefined;

  // Employee accounts only have access to their own data via the mobile
  // app. Redirect to a dedicated "use the mobile app" page rather than
  // dumping them on /login where they'd just try to sign in again.
  if (profile && profile.role === "employee") {
    redirect("/mobile-only");
  }

  const userName = profile?.full_name ?? user.email?.split("@")[0] ?? "مستخدم";
  const companyName = profile?.companies?.name ?? "—";
  const isSuperAdmin = !!superAdminRes.data;

  // featureOverrides is fetched above (in parallel with the subscription).
  // Per-tenant overrides (mig 041): an enabled=false entry hides that module's
  // nav items; tenants with no overrides see tier-based defaults.

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 dark:bg-slate-950">
      <DashboardSidebar
        userName={userName}
        companyName={companyName}
        userEmail={user.email ?? ""}
        isSuperAdmin={isSuperAdmin}
        role={profile?.role}
        plan={subscription?.plan ?? null}
        daysLeft={daysLeft}
        featureOverrides={featureOverrides}
      />
      {/* min-w-0 prevents flex children from forcing horizontal scroll
          when they contain wide content like tables or pre tags. */}
      <div className="flex-1 min-w-0">{children}</div>
      {/* المساعد الفني الفوري — floating on every dashboard page so users
          solve setup/usage problems themselves instead of contacting us. */}
      <SupportChat />
    </div>
  );
}
