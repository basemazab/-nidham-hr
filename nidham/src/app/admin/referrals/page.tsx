import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { approveReferral } from "./actions";

export const dynamic = "force-dynamic";

type ReferralRow = {
  id: string;
  referrer_company_id: string;
  referred_company_id: string | null;
  referred_company_name: string | null;
  status: "pending" | "approved" | "rejected";
  reward_months: number;
  created_at: string;
};

type SearchParams = Promise<{ ok?: string; error?: string }>;

const STATUS: Record<ReferralRow["status"], { label: string; cls: string }> = {
  pending: { label: "بانتظار التفعيل", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  approved: { label: "مُفعّلة", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  rejected: { label: "مرفوضة", cls: "bg-slate-100 text-slate-600 border-slate-200" },
};

export default async function AdminReferralsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { ok, error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Super-admin gate (same pattern as /admin).
  const { data: superAdmin } = await supabase
    .from("super_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!superAdmin) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
        <div className="max-w-md text-center bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
          <div className="text-5xl mb-3">🔒</div>
          <h1 className="text-2xl font-black font-cairo mb-2 text-slate-800">Access Denied</h1>
          <p className="text-sm text-slate-600 mb-6 font-cairo">الصفحة دي للـ Super-Admin بس.</p>
          <Link href="/dashboard" className="inline-block px-6 py-3 rounded-xl bg-brand-cyan-dark text-white font-bold hover:bg-brand-cyan transition font-cairo">
            الرجوع للـ Dashboard
          </Link>
        </div>
      </main>
    );
  }

  const { data: referralsRaw } = await supabase
    .from("referrals")
    .select("id, referrer_company_id, referred_company_id, referred_company_name, status, reward_months, created_at")
    .order("created_at", { ascending: false })
    .returns<ReferralRow[]>();
  const referrals = referralsRaw ?? [];

  // Resolve company names in JS (two FKs to companies make embedded selects
  // ambiguous; a simple id→name map is robust).
  const { data: companiesRaw } = await supabase
    .from("companies")
    .select("id, name")
    .returns<{ id: string; name: string }[]>();
  const nameById = new Map((companiesRaw ?? []).map((c) => [c.id, c.name]));

  const pending = referrals.filter((r) => r.status === "pending").length;

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black font-cairo text-slate-900">🎁 الإحالات</h1>
            <p className="text-sm text-slate-500 font-cairo">
              {pending} بانتظار التفعيل · الموافقة بتدّي شهر مجاني للطرفين.
            </p>
          </div>
          <Link href="/admin" className="text-sm text-brand-cyan-dark hover:underline font-cairo">
            ← لوحة الأدمن
          </Link>
        </div>

        {ok && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-cairo">
            ✓ تم تفعيل الإحالة — اتضاف شهر مجاني للطرفين.
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-cairo">
            ⚠ {decodeURIComponent(error)}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {referrals.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-slate-500 font-cairo">
              لسه مفيش إحالات.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-right">
                  <th className="px-4 py-3 font-bold font-cairo">المُحيل</th>
                  <th className="px-4 py-3 font-bold font-cairo">الشركة الجديدة</th>
                  <th className="px-4 py-3 font-bold font-cairo">التاريخ</th>
                  <th className="px-4 py-3 font-bold font-cairo">الحالة</th>
                  <th className="px-4 py-3 font-bold font-cairo"></th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((r) => {
                  const badge = STATUS[r.status];
                  return (
                    <tr key={r.id} className="border-t border-slate-100">
                      <td className="px-4 py-3 font-cairo text-slate-800">
                        {nameById.get(r.referrer_company_id) ?? "—"}
                      </td>
                      <td className="px-4 py-3 font-cairo text-slate-800">
                        {r.referred_company_name ||
                          (r.referred_company_id ? nameById.get(r.referred_company_id) : "") ||
                          "—"}
                      </td>
                      <td className="px-4 py-3 font-cairo text-slate-500 whitespace-nowrap">
                        {new Date(r.created_at).toLocaleDateString("ar-EG")}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold font-cairo px-2.5 py-1 rounded-full border ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-end">
                        {r.status === "pending" && r.referred_company_id && (
                          <form action={approveReferral}>
                            <input type="hidden" name="id" value={r.id} />
                            <button
                              type="submit"
                              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold font-cairo text-xs transition"
                            >
                              فعّل الشهر المجاني
                            </button>
                          </form>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  );
}
