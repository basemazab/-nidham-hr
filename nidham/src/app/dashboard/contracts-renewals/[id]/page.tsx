import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyProfile } from "@/lib/permissions";
import { formatDateShort, formatEGP } from "@/lib/format";
import { renewContract } from "../actions";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

type Contract = {
  id: string;
  customer_id: string;
  contract_number: string | null;
  service_type: string | null;
  description: string | null;
  start_date: string;
  end_date: string | null;
  contract_value: number | null;
  payment_terms: string | null;
  status: "active" | "expired" | "renewed" | "cancelled";
  assigned_to: string | null;
  notes: string | null;
  created_at: string;
};

function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

export const dynamic = "force-dynamic";

export default async function RenewContractPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { error } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { profile } = await getMyProfile();
  const callerCompanyId = profile?.company_id ?? "";

  const [contractRes, customersRes] = await Promise.all([
    supabase.from("contracts").select("*").eq("id", id).single<Contract>(),
    supabase.from("customers").select("id, full_name").eq("company_id", callerCompanyId).order("full_name"),
  ]);

  if (!contractRes.data) notFound();
  const contract = contractRes.data;
  const customer = customersRes.data?.find((c: { id: string }) => c.id === contract.customer_id);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = contract.end_date ? new Date(contract.end_date + "T00:00:00") : null;
  const daysLeft = endDate ? daysBetween(today, endDate) : null;

  const renewAction = renewContract.bind(null, id);

  return (
    <main className="flex-1 px-6 py-8 bg-gradient-to-b from-slate-50 via-white to-cyan-50/30 min-h-screen">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link
            href="/dashboard/contracts-renewals"
            className="text-sm text-slate-500 hover:text-brand-cyan-dark font-cairo"
          >
            ← الرجوع لشاشة التجديد
          </Link>
        </div>

        <header className="mb-6">
          <div className="inline-block px-2.5 py-0.5 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-700 text-[11px] font-bold mb-2 font-cairo">
            📋 تجديد العقد
          </div>
          <h1 className="text-3xl font-black font-cairo text-slate-800 mb-1">
            تجديد العقد
          </h1>
          <p className="text-sm text-slate-500 font-cairo">
            {contract.contract_number ?? "بدون رقم"}
          </p>
        </header>

        <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-100 mb-6">
          <h2 className="text-sm font-bold text-slate-700 mb-4 font-cairo">بيانات العقد الحالي</h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-400 font-cairo">العميل:</span>
              <span className="mr-2 font-bold text-slate-800 font-cairo">{customer?.full_name ?? "—"}</span>
            </div>
            <div>
              <span className="text-slate-400 font-cairo">نوع الخدمة:</span>
              <span className="mr-2 font-bold text-slate-800 font-cairo">{contract.service_type ?? "—"}</span>
            </div>
            <div>
              <span className="text-slate-400 font-cairo">تاريخ البدء:</span>
              <span className="mr-2 font-bold text-slate-800 font-mono">{formatDateShort(contract.start_date)}</span>
            </div>
            <div>
              <span className="text-slate-400 font-cairo">تاريخ الانتهاء:</span>
              <span className={`mr-2 font-bold font-mono ${daysLeft !== null && daysLeft <= 30 ? "text-red-600" : "text-slate-800"}`}>
                {contract.end_date ? formatDateShort(contract.end_date) : "مفتوح"}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-cairo">قيمة العقد:</span>
              <span className="mr-2 font-bold text-slate-800 font-cairo">{formatEGP(contract.contract_value)}</span>
            </div>
            <div>
              <span className="text-slate-400 font-cairo">شروط الدفع:</span>
              <span className="mr-2 font-bold text-slate-800 font-cairo">
                {contract.payment_terms === "monthly" ? "شهري"
                  : contract.payment_terms === "quarterly" ? "ربع سنوي"
                  : contract.payment_terms === "annual" ? "سنوي"
                  : contract.payment_terms === "one_time" ? "دفعة واحدة"
                  : contract.payment_terms ?? "—"}
              </span>
            </div>
          </div>
          {contract.description && (
            <p className="mt-4 text-sm text-slate-600 font-cairo border-t border-slate-100 pt-4">
              {contract.description}
            </p>
          )}
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-cairo">
              ⚠ {decodeURIComponent(error)}
            </div>
          )}

          <form action={renewAction} className="space-y-5">
            <div>
              <label htmlFor="service_type" className="block text-sm font-bold text-slate-700 mb-2 font-cairo">
                نوع الخدمة
              </label>
              <input
                id="service_type"
                name="service_type"
                type="text"
                defaultValue={contract.service_type ?? ""}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20 outline-none transition text-slate-900"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="start_date" className="block text-sm font-bold text-slate-700 mb-2 font-cairo">
                  تاريخ البدء الجديد <span className="text-red-500">*</span>
                </label>
                <input
                  id="start_date"
                  name="start_date"
                  type="date"
                  defaultValue={contract.end_date ?? contract.start_date}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20 outline-none transition text-slate-900"
                />
              </div>
              <div>
                <label htmlFor="end_date" className="block text-sm font-bold text-slate-700 mb-2 font-cairo">
                  تاريخ الانتهاء الجديد <span className="text-red-500">*</span>
                </label>
                <input
                  id="end_date"
                  name="end_date"
                  type="date"
                  required
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20 outline-none transition text-slate-900"
                />
              </div>
            </div>

            <div>
              <label htmlFor="contract_value" className="block text-sm font-bold text-slate-700 mb-2 font-cairo">
                قيمة العقد الجديدة (جنيه)
              </label>
              <input
                id="contract_value"
                name="contract_value"
                type="number"
                step="0.01"
                min="0"
                defaultValue={contract.contract_value ?? ""}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20 outline-none transition text-slate-900"
              />
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-2 font-cairo">ملاحظات التجديد</label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                placeholder="أي ملاحظات عن التجديد — الخصم، شروط جديدة، إلخ"
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20 outline-none transition text-slate-900 resize-none"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-brand-cyan to-brand-cyan-dark text-white font-bold shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all font-cairo"
              >
                تجديد العقد
              </button>
              <Link
                href="/dashboard/contracts-renewals"
                className="px-6 py-3 rounded-lg border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition font-cairo"
              >
                إلغاء
              </Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
