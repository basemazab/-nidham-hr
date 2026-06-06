import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Vendor leads captured from the public free tools (migration 094). Super-admin
// only — these are Nidham's OWN sales leads, not any tenant's customers.
export const dynamic = "force-dynamic";
export const metadata = { title: "Leads من الأدوات | نِظام" };

type Lead = {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  source: string | null;
  message: string | null;
  status: string;
  created_at: string;
};

const SOURCE_LABEL: Record<string, string> = {
  "salary-calculator": "حاسبة المرتب",
  "social-insurance": "حاسبة التأمينات",
  "end-of-service": "حاسبة نهاية الخدمة",
  "income-tax": "حاسبة الضريبة",
  "annual-leave": "حاسبة الإجازات",
  overtime: "حاسبة الأوفر تايم",
};

function waLink(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const intl = digits.startsWith("0") ? "2" + digits : digits.startsWith("20") ? digits : "2" + digits;
  return `https://wa.me/${intl}?text=${encodeURIComponent("أهلاً 👋 شكراً لاهتمامك بنِظام HR — معاك فريق نِظام، نقدر نساعدك بإيه؟")}`;
}

export default async function ToolLeadsPage() {
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
  if (!superAdmin) redirect("/dashboard");

  const { data: leadsData } = await supabase
    .from("nidham_leads")
    .select("id, name, phone, email, source, message, status, created_at")
    .order("created_at", { ascending: false })
    .limit(500)
    .returns<Lead[]>();
  const leads = leadsData ?? [];

  const newCount = leads.filter((l) => l.status === "new").length;

  return (
    <main className="flex-1 px-6 py-8 bg-gradient-to-b from-slate-50 via-white to-cyan-50/30 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/admin" className="text-sm text-slate-500 hover:text-brand-cyan-dark font-cairo">
            ← لوحة الأدمن
          </Link>
        </div>

        <header className="mb-6">
          <h1 className="text-3xl font-black font-cairo text-slate-800 mb-1">📥 Leads من الأدوات المجانية</h1>
          <p className="text-sm text-slate-500 font-cairo">
            ناس استخدمت الحاسبات المجانية وسابت بياناتها — دول leads مهتمين بـ Nidham.
            تواصل معاهم بسرعة! ({leads.length} إجمالي · {newCount} جديد)
          </p>
        </header>

        {leads.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center font-cairo">
            <div className="text-5xl mb-3">🎣</div>
            <p className="text-slate-600 font-bold mb-1">لسه مفيش leads</p>
            <p className="text-sm text-slate-500">
              أول ما حد يستخدم الحاسبات المجانية ويسيب رقمه، هيظهر هنا. وزّع لينكات الأدوات في جروبات HR والمحاسبين.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {leads.map((l) => (
              <div key={l.id} className="rounded-2xl border border-slate-200 bg-white p-4 font-cairo flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-black text-slate-800 mb-0.5">
                    {l.name || "بدون اسم"}
                    {l.status === "new" && (
                      <span className="mr-2 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold align-middle">جديد</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1">
                    {l.phone && <span dir="ltr" className="font-mono">{l.phone}</span>}
                    {l.email && <span dir="ltr">{l.email}</span>}
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px]">
                      {l.source ? SOURCE_LABEL[l.source] ?? l.source : "أداة"}
                    </span>
                    <span className="text-slate-400">{new Date(l.created_at).toLocaleString("ar-EG", { dateStyle: "short", timeStyle: "short" })}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {l.phone && (
                    <a href={waLink(l.phone)} target="_blank" rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold">
                      واتساب
                    </a>
                  )}
                  {l.email && (
                    <a href={`mailto:${l.email}`}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold">
                      إيميل
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
