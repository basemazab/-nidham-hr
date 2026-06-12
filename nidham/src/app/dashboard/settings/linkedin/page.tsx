import Link from "next/link";
import { requireHRPage } from "@/lib/permissions";
import { saveLinkedInApp, disconnectLinkedIn } from "./actions";

export const metadata = {
  title: "ربط لينكد إن | الإعدادات",
};

export const dynamic = "force-dynamic";

type ConnRow = {
  client_id: string | null;
  access_token: string | null;
  token_expires_at: string | null;
  member_name: string | null;
};

type ScheduledRow = {
  id: string;
  post_text: string;
  scheduled_at: string;
  status: string;
  post_url: string | null;
  error: string | null;
};

const STATUS_UI: Record<string, { label: string; cls: string }> = {
  pending: { label: "⏳ في الانتظار", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  posted: { label: "✅ اتنشر", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  failed: { label: "❌ فشل", cls: "bg-rose-50 text-rose-700 border-rose-200" },
  cancelled: { label: "ملغي", cls: "bg-slate-50 text-slate-500 border-slate-200" },
};

export default async function LinkedInSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    saved?: string;
    connected?: string;
    disconnected?: string;
    error?: string;
  }>;
}) {
  const { supabase, profile } = await requireHRPage();
  const sp = await searchParams;

  const { data: conn } = await supabase
    .from("linkedin_connections")
    .select("client_id, access_token, token_expires_at, member_name")
    .eq("company_id", profile.company_id)
    .maybeSingle<ConnRow>();

  const { data: scheduled } = await supabase
    .from("linkedin_scheduled_posts")
    .select("id, post_text, scheduled_at, status, post_url, error")
    .eq("company_id", profile.company_id)
    .order("scheduled_at", { ascending: true })
    .limit(20)
    .returns<ScheduledRow[]>();

  const SITE = (
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.nidhamhr.com"
  ).replace(/\/$/, "");
  const callbackUrl = `${SITE}/api/linkedin/callback`;

  const isConnected =
    !!conn?.access_token &&
    !!conn?.token_expires_at &&
    new Date(conn.token_expires_at) > new Date();

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/dashboard"
          className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
        >
          ← الرئيسية
        </Link>
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100 font-cairo">
          💼 ربط لينكد إن
        </h1>
      </div>

      <p className="text-sm text-slate-600 dark:text-slate-300 font-cairo mb-6 leading-relaxed">
        اربط حسابك على لينكد إن عشان المساعد الذكي يقدر ينشر إعلانات الوظائف
        <strong> بوست رسمي على بروفايلك</strong> — بموافقتك على كل بوست.
      </p>

      {sp.saved && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-800 font-cairo">
          تم حفظ بيانات التطبيق ✓ — كمّل بزرار «اربط حسابك» تحت.
        </div>
      )}
      {sp.connected && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-800 font-cairo">
          🎉 اتربط حسابك بنجاح! روح للمساعد الذكي وقوله «انشر الوظيفة على لينكد إن».
        </div>
      )}
      {sp.disconnected && (
        <div className="mb-4 p-3 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-700 font-cairo">
          تم فصل الحساب.
        </div>
      )}
      {sp.error && (
        <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700 font-cairo">
          ⚠️ {decodeURIComponent(sp.error)}
        </div>
      )}

      {/* Connection status */}
      <section className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 mb-6">
        <h2 className="font-black text-lg text-slate-900 dark:text-slate-100 font-cairo mb-3">
          حالة الربط
        </h2>
        {isConnected ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-cairo">
              <span>✅</span>
              <span className="font-bold">
                متصل كحساب: {conn?.member_name || "حسابك"}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-cairo">
              التوكن صالح حتى{" "}
              {new Date(conn!.token_expires_at!).toLocaleDateString("ar-EG", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}{" "}
              — بعدها اضغط «اربط حسابك» تاني (سياسة لينكد إن: التوكن بيتجدد كل ٦٠ يوم).
            </p>
            <div className="flex gap-2">
              <a
                href="/api/linkedin/authorize"
                className="px-4 py-2 rounded-lg bg-brand-cyan-dark hover:bg-brand-cyan text-white font-bold font-cairo text-sm transition"
              >
                🔄 جدّد الربط
              </a>
              <form action={disconnectLinkedIn}>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-bold font-cairo text-sm hover:bg-rose-100 transition"
                >
                  فصل الحساب
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-sm text-slate-600 dark:text-slate-300 font-cairo">
              {conn?.client_id
                ? "بيانات التطبيق محفوظة — اضغط الزرار وامنح الموافقة على لينكد إن:"
                : "احفظ بيانات التطبيق تحت الأول، وبعدها الزرار ده هيشتغل."}
            </div>
            <a
              href="/api/linkedin/authorize"
              className={`inline-block px-5 py-2.5 rounded-xl font-bold font-cairo text-sm transition ${
                conn?.client_id
                  ? "bg-[#0a66c2] hover:bg-[#084d92] text-white shadow-lg"
                  : "bg-slate-200 text-slate-400 pointer-events-none"
              }`}
            >
              💼 اربط حسابك على لينكد إن
            </a>
          </div>
        )}
      </section>

      {/* Scheduled posts queue */}
      {scheduled && scheduled.length > 0 && (
        <section className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 mb-6">
          <h2 className="font-black text-lg text-slate-900 dark:text-slate-100 font-cairo mb-1">
            📅 بوستات مجدولة (بتتنشر تلقائيًا)
          </h2>
          <p className="text-xs text-slate-500 font-cairo mb-4">
            البوست بيتنشر على بروفايلك المربوط في معاد كل بوست تلقائيًا — من غير
            أي تدخل منك. النشر بيتم مع الدورة اليومية حوالي ١٢ الظهر بتوقيت مصر.
          </p>
          <div className="space-y-2">
            {scheduled.map((p) => {
              const ui = STATUS_UI[p.status] ?? STATUS_UI.pending;
              return (
                <div
                  key={p.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800"
                >
                  <span
                    className={`text-[11px] font-bold px-2 py-1 rounded-full border font-cairo shrink-0 ${ui.cls}`}
                  >
                    {ui.label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 dark:text-slate-200 font-cairo truncate">
                      {p.post_text.split("\n")[0]}
                    </p>
                    <p className="text-[11px] text-slate-400 font-cairo mt-0.5">
                      {new Date(p.scheduled_at).toLocaleString("ar-EG", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "Africa/Cairo",
                      })}
                      {p.error ? ` — ${p.error}` : ""}
                    </p>
                  </div>
                  {p.post_url && (
                    <a
                      href={p.post_url}
                      target="_blank"
                      rel="noopener"
                      className="text-xs font-bold text-brand-cyan-dark hover:underline font-cairo shrink-0"
                    >
                      شوف البوست ←
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* App credentials */}
      <section className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 mb-6">
        <h2 className="font-black text-lg text-slate-900 dark:text-slate-100 font-cairo mb-3">
          🔐 بيانات تطبيق لينكد إن
        </h2>
        <form action={saveLinkedInApp} className="space-y-3">
          <div>
            <label className="block text-sm font-bold text-slate-900 dark:text-slate-100 mb-1 font-cairo">
              Client ID
            </label>
            <input
              name="client_id"
              defaultValue={conn?.client_id || ""}
              dir="ltr"
              required
              placeholder="86xxxxxxxx"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg font-mono text-sm focus:border-brand-cyan outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-900 dark:text-slate-100 mb-1 font-cairo">
              Client Secret
            </label>
            <input
              name="client_secret"
              type="password"
              dir="ltr"
              required
              placeholder={conn?.client_id ? "•••••••• (اكتبه تاني لو هتغيّره)" : "WPL_AP1..."}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg font-mono text-sm focus:border-brand-cyan outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-brand-cyan-dark hover:bg-brand-cyan text-white font-bold font-cairo text-sm transition"
          >
            💾 احفظ بيانات التطبيق
          </button>
        </form>
      </section>

      {/* Setup guide */}
      <section className="p-5 rounded-xl bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800">
        <h2 className="font-black text-cyan-900 dark:text-cyan-200 font-cairo mb-3">
          📋 خطوات إنشاء التطبيق (مرة واحدة — ١٠ دقايق)
        </h2>
        <ol className="space-y-2 text-sm text-cyan-900 dark:text-cyan-100 list-decimal pr-5 font-cairo">
          <li>
            افتح{" "}
            <a
              href="https://www.linkedin.com/developers/apps"
              target="_blank"
              rel="noopener"
              className="underline font-bold"
            >
              linkedin.com/developers/apps
            </a>{" "}
            → <strong>Create App</strong>
          </li>
          <li>
            الاسم: <code className="bg-white dark:bg-slate-800 px-1 rounded">Nidham HR</code> — واربطه بصفحة
            شركتك على لينكد إن (مطلوب يكون عندك صفحة شركة).
          </li>
          <li>
            من تبويب <strong>Products</strong>: فعّل{" "}
            <strong>Share on LinkedIn</strong> +{" "}
            <strong>Sign In with LinkedIn using OpenID Connect</strong> (بيتفعلوا فورًا).
          </li>
          <li>
            من تبويب <strong>Auth</strong>: في خانة{" "}
            <strong>Authorized redirect URLs</strong> ضيف:
            <div className="mt-1 p-2 bg-white dark:bg-slate-800 rounded font-mono text-xs break-all border border-cyan-300" dir="ltr">
              {callbackUrl}
            </div>
          </li>
          <li>
            انسخ <strong>Client ID</strong> و <strong>Client Secret</strong> من نفس
            التبويب → الصقهم فوق → احفظ → اضغط «اربط حسابك».
          </li>
        </ol>
      </section>
    </div>
  );
}
