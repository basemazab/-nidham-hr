"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/login/actions";
import { TierBadge } from "@/components/tier-badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notification-bell";
import { hasFeature, type Plan, type Feature } from "@/lib/subscriptions";

type Role = "admin" | "manager" | "employee";

type Props = {
  userName: string;
  companyName: string;
  userEmail: string;
  isSuperAdmin?: boolean;
  role?: Role;
  plan?: Plan | null;
  daysLeft?: number;
  /**
   * Per-tenant feature flag overrides (mig 041). When a feature is
   * explicitly disabled in this map, the corresponding nav item is
   * HIDDEN entirely (vs. the old behavior of showing it with a 🔒).
   * Lets super-admin sculpt the dashboard for "Marketing-only" or
   * "HR-only" customers.
   */
  featureOverrides?: Partial<Record<Feature, boolean>>;
};

// ────────────────────────────────────────────────────────────────────────────
// Sidebar information architecture
// ────────────────────────────────────────────────────────────────────────────
// One single "Modules" section with 20+ items was overwhelming — users had
// to scan a 200-pixel-tall list every time they wanted to find anything.
// The new layout groups items by job-to-be-done so the eye can hop between
// section headers (which act as tabs):
//
//   home       — quick return to dashboard
//   people     — anything about the humans (employees, perf, assets, celebs)
//   time       — anything time-related (attendance, shifts, leaves, requests)
//   payroll    — money out the door (payroll, loans, EOS)
//   crm        — money in (customers, interactions, contracts)
//   docs       — paperwork (forms, e-signature, compliance guide)
//   ai         — AI + retention insights (still in its own section because
//                they're the "premium" pull for upgrades)
//   marketing  — separate from AI because most HR-only tenants disable it
//   reports    — read-only dashboards
//   settings   — admin knobs + help
//
// Each section renders with its own header so users see "🕒 الوقت والحضور"
// instead of one giant "الموديولات" wall.

type NavSectionKey =
  | "home"
  | "people"
  | "time"
  | "payroll"
  | "crm"
  | "docs"
  | "ai"
  | "automation"
  | "marketing"
  | "reports"
  | "settings";

type NavItem = {
  href: string;
  label: string;
  icon: string;
  section: NavSectionKey;
  visibleTo?: Role[];
  feature?: Feature;
  /** Platform-owner-only item — hidden from every tenant. */
  superAdminOnly?: boolean;
};

// Ordered list of [key, header label] — drives the render order.
// Putting "people" before "time" matches the typical Egyptian HR's daily
// flow: morning roll-call (people) → mark attendance (time) → process
// payroll at month-end (payroll).
const SECTION_ORDER: ReadonlyArray<{ key: NavSectionKey; label: string }> = [
  { key: "home", label: "" }, // no header for the home link — keeps top tight
  { key: "people", label: "👥 الفريق" },
  { key: "time", label: "⏰ الوقت والحضور" },
  { key: "payroll", label: "💰 المرتبات" },
  { key: "crm", label: "💼 العملاء والمبيعات" },
  { key: "docs", label: "📄 المستندات والامتثال" },
  { key: "ai", label: "🤖 ذكاء HR" },
  { key: "automation", label: "⚡ الأتمتة" },
  { key: "marketing", label: "✦ تسويق" },
  { key: "reports", label: "📊 التقارير" },
  { key: "settings", label: "⚙ الإعدادات" },
];

const NAV_ITEMS: readonly NavItem[] = [
  // ── Home ──
  { href: "/dashboard", label: "الرئيسية", icon: "🏠", section: "home" },
  { href: "/dashboard/notifications", label: "الإشعارات", icon: "🔔", section: "home" },

  // ── People (الفريق) ──
  { href: "/dashboard/employees",    label: "الموظفين",         icon: "👥", section: "people", feature: "employees" },
  { href: "/dashboard/org-chart",    label: "الهيكل التنظيمي",  icon: "🌳", section: "people", feature: "employees" },
  { href: "/dashboard/performance",  label: "تقييم الأداء",     icon: "📈", section: "people", feature: "employees" },
  { href: "/dashboard/assets",       label: "الأصول والعهد",    icon: "📦", section: "people", feature: "employees" },
  { href: "/dashboard/celebrations", label: "الاحتفالات",       icon: "🎉", section: "people", feature: "employees" },
  { href: "/dashboard/team",         label: "فريق الشركة",      icon: "🤝", section: "people", visibleTo: ["admin"] },
  { href: "/dashboard/onboarding",   label: "الاستقبال والتسكين", icon: "🤝", section: "people", feature: "employees" },
  // Hidden until backed by real tables — Training is currently a localStorage
  // -only demo (system audit). Restore this line when the module persists to DB.
  // { href: "/dashboard/training",    label: "التدريب والتطوير",  icon: "🎓", section: "people", feature: "employees" },

  // ── Time (الوقت والحضور) ──
  { href: "/dashboard/attendance",      label: "تسجيل الحضور",     icon: "⏰", section: "time", feature: "attendance" },
  { href: "/dashboard/attendance/review", label: "مراجعة واعتماد الحضور", icon: "✅", section: "time", feature: "attendance" },
  { href: "/dashboard/attendance/absences", label: "متابعة وتصحيح الغياب", icon: "🚫", section: "time", feature: "attendance" },
  { href: "/dashboard/settings/devices", label: "أجهزة البصمة", icon: "🔌", section: "time", visibleTo: ["admin"] },
  { href: "/dashboard/shifts",          label: "الورديات",          icon: "🕒", section: "time", feature: "shifts_rotations" },
  { href: "/dashboard/team-calendar",   label: "تقويم الإجازات",   icon: "📅", section: "time", feature: "requests" },
  { href: "/dashboard/requests",        label: "طلبات الموظفين",   icon: "📨", section: "time", feature: "requests" },

  // ── Payroll (المرتبات) ──
  { href: "/dashboard/payroll",          label: "الرواتب",                 icon: "💰", section: "payroll", feature: "payroll" },
  { href: "/dashboard/payroll/analytics", label: "تحليلات المرتبات",       icon: "📊", section: "payroll", feature: "payroll" },
  { href: "/dashboard/payroll/audit",     label: "مراجعة المرتبات AI",     icon: "🔍", section: "payroll", feature: "payroll" },
  { href: "/dashboard/loans",            label: "السلف والمرتجعات",        icon: "💵", section: "payroll", feature: "payroll" },
  { href: "/dashboard/eos-calculator",   label: "مكافأة نهاية الخدمة",     icon: "⚖", section: "payroll", feature: "payroll" },

  // ── CRM (العملاء) ──
  { href: "/dashboard/outreach",            label: "العملاء المحتملين", icon: "🎯", section: "crm", superAdminOnly: true },
  { href: "/dashboard/customers",           label: "العملاء",        icon: "💼", section: "crm", feature: "crm" },
  { href: "/dashboard/interactions",        label: "التفاعلات",      icon: "💬", section: "crm", feature: "crm" },
  { href: "/dashboard/contracts",           label: "العقود",         icon: "📋", section: "crm", feature: "crm" },
  { href: "/dashboard/contracts-renewals",  label: "تجديد العقود",   icon: "📋", section: "crm", feature: "crm" },

  // ── Documents (المستندات) ──
  { href: "/dashboard/compliance-shield", label: "درع الامتثال",  icon: "🛡️", section: "docs", visibleTo: ["admin", "manager"] },
  { href: "/dashboard/documents",   label: "المستندات والتراخيص", icon: "📁", section: "docs", visibleTo: ["admin", "manager"] },
  { href: "/dashboard/forms",       label: "النماذج",            icon: "📄", section: "docs" },
  { href: "/dashboard/signatures",  label: "التوقيع الإلكتروني", icon: "✍", section: "docs", feature: "employees" },
  { href: "/dashboard/compliance",  label: "دليل الامتثال",      icon: "🏛", section: "docs" },

  // ── AI / Smart features ──
  { href: "/dashboard/pulse",           label: "نبض نِظام",            icon: "⚡", section: "ai", feature: "ai_assistant" },
  { href: "/dashboard/ai",              label: "المساعد الذكي",          icon: "🤖", section: "ai", feature: "ai_assistant" },
  { href: "/dashboard/legal-advisor",   label: "المستشار القانوني",      icon: "⚖️", section: "ai", feature: "ai_assistant" },
  { href: "/dashboard/ai/tools",        label: "تقارير AI",             icon: "📡", section: "ai", feature: "ai_assistant" },
  { href: "/dashboard/ai/knowledge",    label: "قاعدة المعرفة",          icon: "📚", section: "ai", feature: "ai_assistant" },
  { href: "/dashboard/ai/audit",        label: "سجل نشاط AI",           icon: "📋", section: "ai", visibleTo: ["admin"] },
  { href: "/dashboard/whatsapp-test",   label: "اختبار بوت الواتساب",   icon: "💬", section: "ai", visibleTo: ["admin"] },
  { href: "/dashboard/jobs",       label: "التوظيف الذكي",        icon: "🎯", section: "ai", feature: "recruitment" },
  { href: "/dashboard/jobs/cv-analyzer", label: "محلّل السيرة الذاتية", icon: "🔍", section: "ai", feature: "recruitment" },
  { href: "/dashboard/jobs/cv-translator", label: "مترجم السيرة الذاتية", icon: "🌐", section: "ai", feature: "recruitment" },
  { href: "/dashboard/cv-builder",       label: "بانية السيرة الذاتية",  icon: "📄", section: "ai", feature: "recruitment" },
  { href: "/dashboard/jobs/job-description", label: "مولّد التوصيف الوظيفي", icon: "📝", section: "ai", feature: "recruitment" },
  { href: "/dashboard/retention",  label: "احتفاظ بالموظفين",     icon: "🛡", section: "ai", feature: "retention_insights" },
  { href: "/dashboard/nidham-ai", label: "محرك نيدهام AI",        icon: "🧠", section: "ai", feature: "retention_insights" },

  // ── Automation — workflow engine ──
  // Hidden until wired: the workflow engine (lib/workflow/engine.ts) is never
  // executed (no triggers/cron) and half its actions are no-op stubs (system
  // audit). Showing a "build automations" UI that never runs is misleading.
  // Restore these two lines once runWorkflow is fired by a real event/cron.
  // { href: "/dashboard/automation",     label: "أتمتة سير العمل",  icon: "⚡", section: "automation", visibleTo: ["admin", "manager"] },
  // { href: "/dashboard/automation/logs", label: "سجل التشغيل",      icon: "📋", section: "automation", visibleTo: ["admin"] },

  // ── Marketing ──
  { href: "/dashboard/marketing",                label: "Marketing Studio",  icon: "✦",  section: "marketing", feature: "marketing_studio" },
  { href: "/dashboard/marketing/video-studio",   label: "Video Studio",      icon: "🎬", section: "marketing", feature: "marketing_studio" },
  { href: "/dashboard/marketing/inbox",          label: "صندوق رسائل الإعلانات", icon: "💬", section: "marketing", feature: "marketing_studio" },
  { href: "/dashboard/marketing/leads",          label: "Leads Inbox",       icon: "📥", section: "marketing", feature: "marketing_studio" },
  { href: "/dashboard/marketing/landing-pages",  label: "صفحات الهبوط",      icon: "🏠", section: "marketing", feature: "marketing_studio" },
  { href: "/dashboard/marketing/analytics",      label: "تحليل التسويق",     icon: "📊", section: "marketing", feature: "marketing_studio" },

  // ── Reports ──
  { href: "/dashboard/intelligence",      label: "ذكاء الأعمال",    icon: "🧠", section: "reports", feature: "employees" },
  { href: "/dashboard/analytics",          label: "لوحة التحليلات",  icon: "📊", section: "reports", feature: "employees" },
  { href: "/dashboard/reports/attendance", label: "تقرير الحضور",    icon: "📋", section: "reports", feature: "attendance" },
  { href: "/dashboard/reports/bridge",     label: "Bridge ✦",        icon: "✦",  section: "reports", feature: "bridge_analytics" },
  { href: "/dashboard/audit-log",          label: "سجل النشاط",      icon: "🗂", section: "reports", visibleTo: ["admin"], feature: "audit_log" },

  // ── Settings ──
  { href: "/dashboard/settings/office-location",  label: "موقع المكتب",         icon: "📍", section: "settings", visibleTo: ["admin"] },
  { href: "/dashboard/settings/leave-rollover",   label: "ترحيل الإجازات",     icon: "🗓", section: "settings", visibleTo: ["admin"] },
  { href: "/dashboard/referrals",            label: "ادعُ شركة (شهر مجاني)", icon: "🎁", section: "settings", visibleTo: ["admin"] },
  { href: "/dashboard/security",             label: "لوحة الأمان",        icon: "🛡", section: "settings", visibleTo: ["admin"] },
  { href: "/dashboard/system-engineer",      label: "مهندس النظام",       icon: "🛠️", section: "settings", visibleTo: ["admin"] },
  { href: "/dashboard/settings/holidays",         label: "العطلات الرسمية",    icon: "📅", section: "settings", visibleTo: ["admin"] },
  { href: "/dashboard/settings/linkedin",         label: "ربط لينكد إن",        icon: "💼", section: "settings", visibleTo: ["admin"] },
  { href: "/dashboard/settings/api-keys",         label: "مفاتيح API",          icon: "🔑", section: "settings", visibleTo: ["admin"] },
  { href: "/api-docs",                            label: "توثيق API",           icon: "📖", section: "settings" },
  { href: "/dashboard/academy",                   label: "الأكاديمية",          icon: "🎓", section: "settings" },
];

export function DashboardSidebar({
  userName,
  companyName,
  userEmail,
  isSuperAdmin,
  role,
  plan,
  daysLeft,
  featureOverrides,
}: Props) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  // Collapsible nav groups the user has expanded (besides the active group,
  // which is always shown). Tames the long 40+ item list into a tidy outline.
  const [openSections, setOpenSections] = useState<Set<NavSectionKey>>(
    () => new Set(),
  );
  // Live filter for the 40+ nav items — typing "رواتب" or "salary" narrows
  // the list as you type. With this many tools, scanning visually is
  // expensive; typing is faster. Lower-cased once and reused.
  const [search, setSearch] = useState("");
  const q = search.trim().toLowerCase();

  // Close mobile drawer whenever the route changes. Also wipe any in-flight
  // search query so the next drawer open starts clean. The setState is
  // intentional here — we're syncing UI to an external state (the URL),
  // which is a legitimate effect use case. The lint rule is overzealous
  // for this pattern, so we suppress it on the offending line.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileOpen(false);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSearch("");
  }, [pathname]);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname?.startsWith(href + "/");
  };

  const canSee = (item: NavItem) => {
    // Owner-only gate — hide platform-owner tools from every tenant.
    if (item.superAdminOnly && !isSuperAdmin) {
      return false;
    }
    // Role gate
    if (item.visibleTo && (role === undefined || !item.visibleTo.includes(role))) {
      return false;
    }
    // Per-tenant override gate — if super-admin explicitly DISABLED the
    // feature for this tenant, hide the nav item entirely so the customer
    // never sees the module they didn't pay for. Override=true (or no
    // override at all) falls through to the rank-based render.
    if (
      item.feature &&
      featureOverrides &&
      featureOverrides[item.feature] === false
    ) {
      return false;
    }
    return true;
  };

  // Build an ordered list of {label, items} per SECTION_ORDER. Empty
  // sections are dropped so users on a single-feature plan don't see
  // headers above zero items. When the user types in the search box we
  // additionally filter by substring match on the localized label so
  // "رواتب" surfaces every payroll tool regardless of which group it sits in.
  const groupedSections = SECTION_ORDER.map(({ key, label }) => ({
    key,
    label,
    items: NAV_ITEMS.filter((i) => {
      if (i.section !== key) return false;
      if (!canSee(i)) return false;
      if (q && !i.label.toLowerCase().includes(q)) return false;
      return true;
    }),
  })).filter((s) => s.items.length > 0);

  // The group holding the current route stays open; the rest collapse by
  // default so the sidebar reads as a short, scannable outline. While a
  // search is active EVERY surviving group is forced open — collapsed
  // matches would defeat the purpose of the filter.
  const activeSectionKey: NavSectionKey =
    NAV_ITEMS.find((i) => isActive(i.href))?.section ?? "home";
  const sectionOpen = (key: NavSectionKey) =>
    q.length > 0 ||
    key === "home" ||
    key === activeSectionKey ||
    openSections.has(key);
  const toggleSection = (key: NavSectionKey) =>
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <>
      {/* Mobile top bar — visible only on small screens */}
      <header className="md:hidden print:hidden sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-2">
          <NotificationBell />
          <ThemeToggle size="sm" />
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="القائمة"
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition"
          >
            {mobileOpen ? (
              <svg className="w-6 h-6 text-slate-700 dark:text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-slate-700 dark:text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="md:hidden fixed top-0 right-0 bottom-0 w-72 bg-white dark:bg-slate-900 z-50 flex flex-col shadow-2xl">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <Logo />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="إغلاق"
              >
                <svg className="w-5 h-5 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <SidebarSearch value={search} onChange={setSearch} />
            <nav className="flex-1 overflow-y-auto p-3">
              {groupedSections.length === 0 && q ? (
                <SearchEmptyState query={search} />
              ) : (
                groupedSections.map((s) => (
                  <NavSection
                    key={s.label || "home"}
                    label={s.label}
                    items={s.items}
                    isActive={isActive}
                    plan={plan}
                    featureOverrides={featureOverrides}
                    collapsible={!!s.label}
                    open={sectionOpen(s.key)}
                    onToggle={() => toggleSection(s.key)}
                  />
                ))
              )}
            </nav>
            <UserFooter
              userName={userName}
              userEmail={userEmail}
              companyName={companyName}
              isSuperAdmin={isSuperAdmin}
              isActive={isActive}
              plan={plan}
              daysLeft={daysLeft}
            />
          </aside>
        </>
      )}

      {/* Desktop sidebar — visible on md+.
          Widened from w-64 → w-72 to give the bumped 14–15px nav text room
          to breathe instead of clipping. Matches the mobile drawer width. */}
      <aside className="hidden md:flex print:hidden w-72 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex-col shrink-0">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <Logo />
          <NotificationBell />
        </div>
        <SidebarSearch value={search} onChange={setSearch} />
        <nav className="flex-1 overflow-y-auto p-3">
          {groupedSections.length === 0 && q ? (
            <SearchEmptyState query={search} />
          ) : (
            groupedSections.map((s) => (
              <NavSection
                key={s.label || "home"}
                label={s.label}
                items={s.items}
                isActive={isActive}
                plan={plan}
                featureOverrides={featureOverrides}
                collapsible={!!s.label}
                open={sectionOpen(s.key)}
                onToggle={() => toggleSection(s.key)}
              />
            ))
          )}
        </nav>
        <UserFooter
          userName={userName}
          userEmail={userEmail}
          companyName={companyName}
          isSuperAdmin={isSuperAdmin}
          isActive={isActive}
        />
      </aside>
    </>
  );
}

// ----------------------------------------------------------------------------
// Module-level helper components.
//
// Defining these inside DashboardSidebar (the previous shape) made React
// rebuild them on every render, blowing away local state and triggering
// the react-hooks/static-components lint rule. Hoisting them here keeps
// them stable across renders.
// ----------------------------------------------------------------------------

function SidebarSearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  // Magnifying glass on the leading (right, RTL) edge; the clear ✕ button
  // shows on the trailing edge only when there is text. type="search"
  // gives mobile keyboards a proper search affordance.
  return (
    <div className="px-3 pt-3 pb-2 border-b border-slate-100 dark:border-slate-800">
      <div className="relative">
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="ابحث في الأدوات…"
          aria-label="ابحث في القائمة"
          className="w-full pr-10 pl-8 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-cairo text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan outline-none transition"
        />
        <svg
          className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="مسح البحث"
            className="absolute left-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 dark:hover:text-slate-200 dark:hover:bg-slate-700 transition"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

function SearchEmptyState({ query }: { query: string }) {
  // Shown inside <nav> when the search filter eliminates every item.
  // Friendly, not scary — empty results are an everyday occurrence.
  return (
    <div className="text-center py-12 px-3">
      <div className="text-4xl mb-3" aria-hidden="true">🔍</div>
      <div className="text-sm text-slate-500 dark:text-slate-400 font-cairo">
        مفيش أداة فيها{" "}
        <span className="font-bold text-slate-700 dark:text-slate-200">
          &ldquo;{query}&rdquo;
        </span>
      </div>
      <div className="text-xs text-slate-400 dark:text-slate-500 font-cairo mt-2">
        جرّب كلمة تانية، أو امسح البحث
      </div>
    </div>
  );
}

function NavSection({
  label,
  items,
  isActive,
  plan,
  featureOverrides,
  collapsible = false,
  open = true,
  onToggle,
}: {
  label: string;
  items: NavItem[];
  isActive: (href: string) => boolean;
  plan?: Plan | null;
  featureOverrides?: Partial<Record<Feature, boolean>>;
  collapsible?: boolean;
  open?: boolean;
  onToggle?: () => void;
}) {
  if (items.length === 0) return null;
  return (
    <>
      {/* Empty label = the "home" link section — no header, always visible.
          Labelled sections are collapsible: the header toggles its items.
          Header text was 10px before — too small to scan; bumped to 14px
          (matches nav-item size) and dropped `uppercase` since Arabic has
          no case so it just spaced glyphs unnaturally. */}
      {label && collapsible ? (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="w-full flex items-center justify-between gap-2 px-3 py-2.5 mb-1 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50 font-bold font-cairo transition"
        >
          <span>{label}</span>
          <svg
            className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      ) : label ? (
        <div className="text-sm text-slate-600 dark:text-slate-300 font-bold mb-2 px-3 font-cairo">
          {label}
        </div>
      ) : null}
      {open && (
      <div className="space-y-1 mb-4">
        {items.map((item) => {
          const active = isActive(item.href);
          const isReport = item.section === "reports";
          // Tier-locking only — explicit override=false items are already
          // filtered out by canSee() above; override=true items pass
          // through here as "unlocked" via hasFeature's overrides arg.
          const locked =
            !!item.feature &&
            !hasFeature(plan, item.feature, featureOverrides);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-cairo text-[15px] transition ${
                active
                  ? isReport
                    ? "bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 font-bold border-r-4 border-amber-500"
                    : "bg-brand-cyan/10 dark:bg-brand-cyan/20 text-brand-cyan-dark dark:text-brand-cyan font-bold border-r-4 border-brand-cyan-dark"
                  : locked
                    ? "text-slate-400 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-400"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {locked && (
                <span
                  className="text-xs opacity-70"
                  title="يتطلب ترقية الاشتراك"
                >
                  🔒
                </span>
              )}
            </Link>
          );
        })}
      </div>
      )}
    </>
  );
}

function UserFooter({
  userName,
  userEmail,
  companyName,
  isSuperAdmin,
  isActive,
  plan,
  daysLeft,
}: {
  userName: string;
  userEmail: string;
  companyName: string;
  isSuperAdmin?: boolean;
  isActive: (href: string) => boolean;
  plan?: Plan | null;
  daysLeft?: number;
}) {
  return (
    <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-1">
      {plan && (
        <div className="flex justify-center pb-1">
          <TierBadge plan={plan} daysLeft={daysLeft} />
        </div>
      )}
      {isSuperAdmin && (
        <Link
          href="/admin"
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/30 dark:to-yellow-900/30 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 font-cairo text-sm font-bold hover:from-amber-100 hover:to-yellow-100 dark:hover:from-amber-900/50 dark:hover:to-yellow-900/50 transition"
        >
          <span>👑</span>
          <span>Super Admin Panel</span>
        </Link>
      )}
      <Link
        href="/dashboard/subscription"
        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition font-cairo text-sm ${
          isActive("/dashboard/subscription")
            ? "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-bold"
            : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
        }`}
      >
        <span>💎</span>
        <span>خطتك واشتراكك</span>
      </Link>
      <Link
        href="/dashboard/profile"
        className={`block px-3 py-2 rounded-lg transition ${
          isActive("/dashboard/profile") ? "bg-brand-cyan/10 dark:bg-brand-cyan/20" : "hover:bg-slate-100 dark:hover:bg-slate-800"
        }`}
      >
        <div className="text-[10px] text-brand-gold font-bold tracking-wider mb-1 font-cairo uppercase">
          {companyName}
        </div>
        <div className="text-sm font-bold text-slate-800 dark:text-slate-100 font-cairo">{userName}</div>
        <div className="text-xs text-slate-500 dark:text-slate-400 truncate font-mono">{userEmail}</div>
        <div className="text-[10px] text-brand-cyan-dark dark:text-brand-cyan font-cairo font-bold mt-1">
          ⚙ الإعدادات الشخصية ←
        </div>
      </Link>
      <div className="flex items-center justify-between gap-2 pt-1">
        <form action={logout} className="flex-1">
          <button
            type="submit"
            className="w-full px-3 py-2 text-right text-sm text-red-600 hover:bg-red-50 dark:text-rose-400 dark:hover:bg-rose-900/20 rounded-lg font-cairo font-medium transition"
          >
            🚪 تسجيل الخروج
          </button>
        </form>
        <ThemeToggle size="sm" />
      </div>
    </div>
  );
}

function Logo() {
  return (
    <Link href="/dashboard" className="flex items-center gap-3 group">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-cyan to-brand-navy flex items-center justify-center shadow-md shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition">
        <span className="text-xl font-black text-white font-display">ن</span>
      </div>
      <div>
        <div className="text-lg font-black font-display bg-gradient-to-r from-brand-cyan-dark to-brand-navy bg-clip-text text-transparent leading-none">
          نِظام
        </div>
        <div className="text-[10px] tracking-widest text-brand-gold font-semibold">
          NIDHAM
        </div>
      </div>
    </Link>
  );
}
