import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CopyLink } from "./copy-link";

export const dynamic = "force-dynamic";

type Profile = {
  company_id: string;
  companies: { name: string | null; referral_code: string | null } | null;
};

type Referral = {
  id: string;
  referred_company_name: string | null;
  status: "pending" | "approved" | "rejected";
  reward_months: number;
  created_at: string;
};

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.nidhamhr.com").replace(/\/$/, "");

const STATUS_BADGE: Record<Referral["status"], { label: string; cls: string }> = {
  pending: { label: "بانتظار التفعيل", cls: "bg-amber-100 text-amber-800 border-amber-300" },
  approved: { label: "تم — شهر مجاني", cls: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  rejected: { label: "مرفوضة", cls: "bg-slate-100 text-slate-600 border-slate-300" },
};

export default async function ReferralsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id, companies(name, referral_code)")
    .eq("id", user.id)
    .single<Profile>();

  const code = profile?.companies?.referral_code ?? "";
  const link = code ? `${SITE}/signup?ref=${code}` : `${SITE}/signup`;

  const { data: referralsRaw } = await supabase
    .from("referrals")
    .select("id, referred_company_name, status, reward_months, created_at")
    .order("created_at", { ascending: false });
  const referrals = (referralsRaw ?? []) as Referral[];

  const approved = referrals.filter((r) => r.status === "approved").length;
  const pending = referrals.filter((r) => r.status === "pending").length;
  const freeMonths = referrals
    .filter((r) => r.status === "approved")
    .reduce((sum, r) => sum + (r.reward_months ?? 1), 0);

  return (
    <main className="flex-1 px-6 py-8 min-h-screen bg-gradient-to-b from-slate-50 via-white to-cyan-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      <div className="max-w-3xl mx-auto">
        {/* Hero */}
        <div className="bg-gradient-to-br from-brand-cyan to-brand-cyan-dark rounded-2xl p-8 text-white shadow-xl mb-6">
          <div className="text-3xl mb-2">🎁</div>
          <h1 className="text-2xl md:text-3xl font-black font-cairo mb-2">
            ادعُ شركة — وكلاكما يكسب شهر مجاني
          </h1>
          <p className="text-cyan-50 font-cairo text-sm leading-relaxed">
            شارك لينك الدعوة الخاص بك. لما أي شركة تسجّل من خلاله، تاخد إنت
            <strong> شهر مجاني</strong> على اشتراكك، وهي كمان <strong>شهر مجاني</strong> —
            بعد ما نراجع الإحالة ونفعّلها.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Stat label="إجمالي الدعوات" value={referrals.length} accent="text-slate-800 dark:text-slate-100" />
          <Stat label="بانتظار التفعيل" value={pending} accent="text-amber-600" />
          <Stat label="شهور مجانية كسبتها" value={freeMonths} accent="text-emerald-600" />
        </div>

        {/* Share link */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm mb-6">
          <h2 className="text-lg font-black font-cairo text-slate-900 dark:text-slate-100 mb-1">
            لينك الدعوة الخاص بك
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-cairo mb-4">
            انسخه أو شاركه على واتساب مباشرةً.
          </p>
          <CopyLink url={link} />
        </div>

        {/* Referrals list */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="font-black font-cairo text-slate-900 dark:text-slate-100">
              دعواتك ({referrals.length})
            </h2>
          </div>
          {referrals.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="text-4xl mb-3">📨</div>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-cairo">
                لسه مفيش دعوات. شارك لينكك مع أصحاب الشركات اللي تعرفهم — أول
                إحالة ممكن تكون شهرك المجاني الأول.
              </p>
            </div>
          ) : (
            <ul>
              {referrals.map((r) => {
                const badge = STATUS_BADGE[r.status];
                return (
                  <li
                    key={r.id}
                    className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 last:border-b-0 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-slate-800 dark:text-slate-100 font-cairo truncate">
                        {r.referred_company_name || "شركة جديدة"}
                      </div>
                      <div className="text-xs text-slate-400 font-cairo">
                        {new Date(r.created_at).toLocaleDateString("ar-EG")}
                      </div>
                    </div>
                    <span
                      className={`shrink-0 text-xs font-bold font-cairo px-3 py-1 rounded-full border ${badge.cls}`}
                    >
                      {badge.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <p className="text-xs text-slate-400 dark:text-slate-500 font-cairo mt-4 text-center">
          الشهر المجاني بيتفعّل بعد مراجعة الإحالة من فريق نِظام (لمنع
          الاستغلال). بنفعّل الدعوات الصحيحة بسرعة.
        </p>
      </div>
    </main>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 text-center shadow-sm">
      <div className={`text-3xl font-black font-cairo tabular-nums ${accent}`}>
        {value.toLocaleString("ar-EG")}
      </div>
      <div className="text-xs text-slate-500 dark:text-slate-400 font-cairo mt-1">
        {label}
      </div>
    </div>
  );
}
