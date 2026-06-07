// ============================================================================
// /dashboard/marketing/broadcast — send a message to a segment of subscribers
// ============================================================================
// ManyChat-style broadcast over the Meta inbox conversations. Enterprise-gated.

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyProfile } from "@/lib/permissions";
import { canUseFeature } from "@/lib/subscriptions-server";
import { UpgradeRequired } from "@/components/upgrade-required";
import { BroadcastClient } from "./broadcast-client";

export const dynamic = "force-dynamic";

type BroadcastRow = {
  id: string;
  message: string;
  recipients: number;
  sent: number;
  failed: number;
  created_at: string;
};

export default async function BroadcastPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (!(await canUseFeature("marketing_studio"))) {
    return <UpgradeRequired feature="marketing_studio" />;
  }

  const { profile } = await getMyProfile();
  const companyId = profile?.company_id ?? "";

  const { data: recent } = await supabase
    .from("marketing_broadcasts")
    .select("id, message, recipients, sent, failed, created_at")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(8)
    .returns<BroadcastRow[]>();

  return (
    <main className="flex-1 px-4 md:px-6 py-6 bg-gradient-to-b from-slate-50 via-white to-fuchsia-50/20 min-h-screen">
      <div className="max-w-3xl mx-auto">
        <div className="mb-4 flex items-center justify-between">
          <Link
            href="/dashboard/marketing"
            className="text-sm text-slate-500 hover:text-brand-cyan-dark font-cairo"
          >
            ← استوديو التسويق
          </Link>
          <Link
            href="/dashboard/marketing/inbox"
            className="text-sm text-violet-600 hover:text-violet-800 font-cairo font-bold"
          >
            📥 الصندوق
          </Link>
        </div>

        <header className="mb-6">
          <div className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-fuchsia-100 to-violet-100 border border-fuchsia-300 text-fuchsia-800 text-xs font-bold mb-2 font-cairo">
            📣 البثّ (Broadcast)
          </div>
          <h1 className="text-3xl font-black font-cairo text-slate-800 mb-1">
            ابعت رسالة لشريحة من عملائك
          </h1>
          <p className="text-sm text-slate-500 font-cairo leading-relaxed max-w-2xl">
            اختار شريحة من محادثات الصندوق (قناة/حالة/جودة/تاج)، وابعتلهم رسالة
            واحدة بضغطة — مع احترام نافذة الـ 24 ساعة الخاصة بـ Meta.
          </p>
        </header>

        <BroadcastClient />

        {recent && recent.length > 0 && (
          <section className="mt-6">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 font-cairo">
              آخر الحملات
            </h2>
            <div className="space-y-2">
              {recent.map((b) => (
                <div
                  key={b.id}
                  className="bg-white border border-slate-200 rounded-lg p-3 text-sm font-cairo"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-700 truncate flex-1">{b.message}</span>
                    <span className="text-xs text-emerald-600 font-bold shrink-0">
                      ✓ {b.sent}
                      {b.failed ? ` · ✗ ${b.failed}` : ""}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {new Date(b.created_at).toLocaleString("ar-EG")}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
