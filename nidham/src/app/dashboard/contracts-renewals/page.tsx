import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyProfile } from "@/lib/permissions";
import { formatDateShort } from "@/lib/format";

type Contract = {
  id: string;
  contract_number: string | null;
  service_type: string | null;
  start_date: string;
  end_date: string | null;
  contract_value: number | null;
  payment_terms: string | null;
  status: "active" | "expired" | "renewed" | "cancelled";
  customers: { full_name: string } | null;
  employees: { full_name: string } | null;
};

function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

export const dynamic = "force-dynamic";

export default async function ContractsRenewalsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { profile } = await getMyProfile();
  const callerCompanyId = profile?.company_id ?? "";

  const { data: contracts, error: fetchError } = await supabase
    .from("contracts")
    .select(
      "id, contract_number, service_type, start_date, end_date, contract_value, payment_terms, status, customers:customer_id(full_name), employees:assigned_to(full_name)",
    )
    .eq("company_id", callerCompanyId)
    .order("end_date", { ascending: true, nullsFirst: false })
    .returns<Contract[]>();

  const tableMissing =
    !!fetchError &&
    /relation .* does not exist|42P01|schema cache|PGRST205/i.test(
      fetchError.message ?? "",
    );

  const list = contracts ?? [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const thirtyDaysFromNow = new Date(today);
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const enriched = list.map((c) => {
    const endDate = c.end_date ? new Date(c.end_date + "T00:00:00") : null;
    const daysLeft = endDate ? daysBetween(today, endDate) : null;
    let renewalStatus: "open-ended" | "active" | "expiring-soon" | "expired" = "active";
    if (!endDate) {
      renewalStatus = "open-ended";
    } else if (daysLeft! < 0) {
      renewalStatus = "expired";
    } else if (daysLeft! <= 30) {
      renewalStatus = "expiring-soon";
    }
    return { ...c, daysLeft, renewalStatus };
  });

  const aboutToExpire = enriched.filter((c) => c.renewalStatus === "expiring-soon");
  const expired = enriched.filter((c) => c.renewalStatus === "expired");
  const active = enriched.filter((c) => c.renewalStatus === "active" || c.renewalStatus === "open-ended");

  return (
    <main className="flex-1 px-6 py-8 bg-gradient-to-b from-slate-50 via-white to-cyan-50/30 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="text-sm text-slate-500 hover:text-brand-cyan-dark font-cairo"
          >
            ← الرجوع للـ Dashboard
          </Link>
        </div>

        <header className="flex items-center justify-between mb-8">
          <div>
            <div className="inline-block px-2.5 py-0.5 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-700 text-[11px] font-bold mb-2 font-cairo">
              📋 تجديد العقود
            </div>
            <h1 className="text-3xl font-black font-cairo text-slate-800 mb-1">
              تجديد العقود
            </h1>
            <p className="text-sm text-slate-500 font-cairo">
              {list.length === 0
                ? "لسه مفيش عقود"
                : `${list.length} عقد · ${aboutToExpire.length} محتاج تجديد`}
            </p>
          </div>
          <Link
            href="/dashboard/contracts/new"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-cyan-dark text-white font-bold shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:-translate-y-0.5 transition-all font-cairo"
          >
            <span className="text-lg leading-none">+</span>
            <span>عقد جديد</span>
          </Link>
        </header>

        {tableMissing && (
          <div className="mb-5 bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 font-cairo">
            <div className="flex items-start gap-3">
              <span className="text-3xl">⚠</span>
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-amber-900 mb-2 text-base">
                  جدول العقود مش موجود في قاعدة البيانات
                </h3>
                <p className="text-sm text-amber-800 leading-relaxed">
                  لازم تطبق آخر Migration على Supabase عشان تشوف الصفحة دي.
                </p>
              </div>
            </div>
          </div>
        )}

        {!tableMissing && list.length === 0 && (
          <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-16 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-xl font-bold font-cairo mb-2 text-slate-700">
              مفيش عقود بعد
            </h2>
            <p className="text-slate-500 mb-6 font-cairo">
              ضيف عقود الأول عشان تشوف شاشة التجديد هنا
            </p>
            <Link
              href="/dashboard/contracts/new"
              className="inline-block px-6 py-3 rounded-xl bg-brand-cyan-dark text-white font-bold hover:bg-brand-cyan transition font-cairo"
            >
              ضيف أول عقد
            </Link>
          </div>
        )}

        {!tableMissing && list.length > 0 && (
          <>
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 p-5 rounded-xl border border-amber-200">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs font-bold text-amber-700 font-cairo">على وشك الانتهاء</span>
                </div>
                <div className="text-3xl font-black text-amber-700">{aboutToExpire.length}</div>
                <p className="text-[11px] text-amber-600 mt-1 font-cairo">خلال 30 يوم</p>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-rose-50 p-5 rounded-xl border border-red-200">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs font-bold text-red-700 font-cairo">منتهية</span>
                </div>
                <div className="text-3xl font-black text-red-700">{expired.length}</div>
                <p className="text-[11px] text-red-600 mt-1 font-cairo">عقد منتهي</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-5 rounded-xl border border-emerald-200">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs font-bold text-emerald-700 font-cairo">نشطة</span>
                </div>
                <div className="text-3xl font-black text-emerald-700">{active.length}</div>
                <p className="text-[11px] text-emerald-600 mt-1 font-cairo">عقد نشط</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden">
              <div className="border-b border-slate-200">
                <div className="flex gap-1 p-1" role="tablist">
                  <button
                    role="tab"
                    aria-selected="true"
                    className="flex-1 py-2.5 px-4 rounded-lg text-sm font-bold bg-brand-cyan text-white font-cairo transition"
                  >
                    على وشك الانتهاء ({aboutToExpire.length})
                  </button>
                  <button
                    role="tab"
                    aria-selected="false"
                    className="flex-1 py-2.5 px-4 rounded-lg text-sm font-bold text-slate-500 hover:bg-slate-50 font-cairo transition"
                  >
                    منتهية ({expired.length})
                  </button>
                  <button
                    role="tab"
                    aria-selected="false"
                    className="flex-1 py-2.5 px-4 rounded-lg text-sm font-bold text-slate-500 hover:bg-slate-50 font-cairo transition"
                  >
                    كل النشطة ({active.length})
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-xs font-bold text-slate-600 font-cairo">العميل</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-600 font-cairo">المسؤول</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-600 font-cairo">نوع العقد</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-600 font-cairo">تاريخ البدء</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-600 font-cairo">تاريخ الانتهاء</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-600 font-cairo">المتبقي</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-600 font-cairo">الحالة</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {enriched.map((c) => {
                      const statusBadge = (() => {
                        if (c.renewalStatus === "expired")
                          return { text: "منتهي", classes: "bg-red-50 text-red-700 border-red-200" };
                        if (c.renewalStatus === "expiring-soon")
                          return { text: "على وشك الانتهاء", classes: "bg-amber-50 text-amber-700 border-amber-200" };
                        if (c.renewalStatus === "open-ended")
                          return { text: "مفتوح", classes: "bg-blue-50 text-blue-700 border-blue-200" };
                        return { text: "نشط", classes: "bg-emerald-50 text-emerald-700 border-emerald-200" };
                      })();

                      const daysClass =
                        c.renewalStatus === "expired" ? "text-red-700 font-black"
                        : c.renewalStatus === "expiring-soon" ? "text-amber-600 font-bold"
                        : "text-slate-500";

                      return (
                        <tr key={c.id} className="hover:bg-slate-50 transition">
                          <td className="px-4 py-3 text-sm text-slate-800 font-cairo">
                            {c.customers?.full_name ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600 font-cairo">
                            {c.employees?.full_name ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700 font-cairo">
                            {c.service_type ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500 font-mono whitespace-nowrap">
                            {formatDateShort(c.start_date)}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500 font-mono whitespace-nowrap">
                            {c.end_date ? formatDateShort(c.end_date) : "—"}
                          </td>
                          <td className={`px-4 py-3 text-sm font-cairo ${daysClass}`}>
                            {c.renewalStatus === "open-ended" ? "—"
                              : c.renewalStatus === "expired"
                                ? `منتهي من ${Math.abs(c.daysLeft!)} يوم`
                                : `${c.daysLeft} يوم`}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold border ${statusBadge.classes} font-cairo`}>
                              {statusBadge.text}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Link
                              href={`/dashboard/contracts-renewals/${c.id}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-brand-cyan to-brand-cyan-dark text-white text-xs font-bold hover:shadow-md transition font-cairo"
                            >
                              تجديد
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
