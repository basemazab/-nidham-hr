import Link from "next/link";
import { requireHRPage } from "@/lib/permissions";
import { SettingsForm } from "./settings-form";
import {
  addAutoReplyRule,
  deleteAutoReplyRule,
  addInboxAttachment,
  deleteInboxAttachment,
} from "../actions";

export const dynamic = "force-dynamic";

type AutoReplyRuleRow = {
  id: string;
  keywords: string[] | null;
  response: string;
  match_type: string;
  apply_dm: boolean | null;
  apply_comment: boolean | null;
};

type AttachmentRow = {
  id: string;
  label: string;
  url: string;
  type: string;
  triggers?: string[];
  whenToUse?: string;
};

export default async function MarketingInboxSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    rule_added?: string;
    rule_deleted?: string;
    rule_error?: string;
    att_added?: string;
    att_deleted?: string;
    att_error?: string;
  }>;
}) {
  const { supabase, profile } = await requireHRPage();
  const sp = await searchParams;

  const { data: settings } = await supabase
    .from("marketing_inbox_settings")
    .select(
      "channel_messenger, channel_instagram, meta_page_id, meta_page_token, meta_app_secret, meta_verify_token, meta_instagram_id, ai_enabled, ai_system_prompt, ai_business_context, ai_attachments, auto_push_to_crm, auto_reply_comments, comment_public_reply, comment_private_reply, comment_public_text",
    )
    .eq("company_id", profile.company_id)
    .maybeSingle();

  const attachments: AttachmentRow[] = Array.isArray(settings?.ai_attachments)
    ? (settings!.ai_attachments as AttachmentRow[])
    : [];

  const { data: rules } = await supabase
    .from("marketing_auto_reply_rules")
    .select("id, keywords, response, match_type, apply_dm, apply_comment")
    .eq("company_id", profile.company_id)
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false })
    .returns<AutoReplyRuleRow[]>();

  // Compute the webhook URL based on the current site URL
  const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.nidhamhr.com").replace(
    /\/$/,
    "",
  );
  const webhookUrl = `${SITE}/api/webhooks/meta-messages`;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/dashboard/marketing/inbox"
          className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
        >
          ← الصندوق
        </Link>
        <h1 className="text-2xl md:text-3xl font-black text-slate-900">
          ⚙️ إعدادات Marketing Inbox
        </h1>
      </div>

      {/* Setup guide */}
      <div className="mb-6 p-5 rounded-xl bg-cyan-50 border border-cyan-200">
        <div className="font-black text-cyan-900 mb-3">
          📋 خطوات الإعداد في Meta Developer Portal
        </div>
        <ol className="space-y-2 text-sm text-cyan-900 list-decimal pr-5">
          <li>
            افتح{" "}
            <a
              href="https://developers.facebook.com/apps"
              target="_blank"
              rel="noopener"
              className="underline font-bold"
            >
              developers.facebook.com/apps
            </a>{" "}
            وأنشئ App جديد (Type: Business).
          </li>
          <li>
            ضيف Product: <strong>Messenger</strong> +{" "}
            <strong>Instagram</strong> (لو محتاج).
          </li>
          <li>
            في <strong>Webhooks</strong> → ضيف Callback URL:
            <div className="mt-2 p-2 bg-white rounded font-mono text-xs break-all border border-cyan-300">
              {webhookUrl}
            </div>
          </li>
          <li>
            <strong>Verify Token:</strong> اخترعه إنت — أي string عشوائي طويل
            (مثلاً 32 حرف). الصقه في حقل "Meta Verify Token" تحت.
          </li>
          <li>
            اشترك في events:{" "}
            <code className="bg-white px-1 rounded">messages</code>،{" "}
            <code className="bg-white px-1 rounded">messaging_postbacks</code>
            {" "}— وللرد على الكومنتات ضيف كمان{" "}
            <code className="bg-white px-1 rounded">feed</code> (فيسبوك) و{" "}
            <code className="bg-white px-1 rounded">comments</code> (إنستجرام).
          </li>
          <li>
            ارجع لـ Settings → Basic → انسخ <strong>App Secret</strong> هنا.
          </li>
          <li>
            في Messenger → Settings: اختار Facebook Page بتاعتك → انسخ{" "}
            <strong>Page Access Token</strong> + <strong>Page ID</strong>.
          </li>
          <li>
            ارجع هنا، الصقهم في الحقول، احفظ.
          </li>
        </ol>
        <div className="mt-4 text-xs text-cyan-700">
          💡 الـ App في Meta لازم يكون <strong>Live mode</strong> عشان يستقبل
          رسائل من مستخدمين حقيقيين (مش Test mode).
        </div>
      </div>

      {/* The form */}
      <SettingsForm
        defaultValues={{
          channel_messenger: settings?.channel_messenger ?? true,
          channel_instagram: settings?.channel_instagram ?? false,
          meta_page_id: settings?.meta_page_id || "",
          meta_page_token: settings?.meta_page_token || "",
          meta_app_secret: settings?.meta_app_secret || "",
          meta_verify_token: settings?.meta_verify_token || "",
          meta_instagram_id: settings?.meta_instagram_id || "",
          ai_enabled: settings?.ai_enabled ?? false,
          ai_system_prompt: settings?.ai_system_prompt || "",
          ai_business_context: settings?.ai_business_context || "",
          auto_push_to_crm: settings?.auto_push_to_crm ?? true,
          auto_reply_comments: settings?.auto_reply_comments ?? false,
          comment_public_reply: settings?.comment_public_reply ?? true,
          comment_private_reply: settings?.comment_private_reply ?? true,
          comment_public_text: settings?.comment_public_text || "",
        }}
      />

      {/* ── Keyword auto-reply rules (ManyChat-style) ── */}
      <div className="mt-10">
        <h2 className="text-xl font-black text-slate-900 mb-1">
          🤖 قواعد الرد بالكلمات المفتاحية
        </h2>
        <p className="text-sm text-slate-500 mb-4">
          لما رسالة أو كومنت فيه كلمة من دول، النظام يرد بالنص ده فورًا — حتى لو
          الـ AI مقفول. (أول قاعدة تطابق هي اللي ترد.)
        </p>

        {sp.rule_added && (
          <div className="mb-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-800">
            تمت إضافة القاعدة ✓
          </div>
        )}
        {sp.rule_deleted && (
          <div className="mb-3 p-3 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-700">
            تم حذف القاعدة
          </div>
        )}
        {sp.rule_error && (
          <div className="mb-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700">
            {decodeURIComponent(sp.rule_error)}
          </div>
        )}

        <form
          action={addAutoReplyRule}
          className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 mb-5"
        >
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              الكلمات المفتاحية (افصل بفاصلة أو سطر)
            </label>
            <textarea
              name="keywords"
              required
              rows={2}
              placeholder="السعر، بكام، الأسعار، التكلفة"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              الرد
            </label>
            <textarea
              name="response"
              required
              rows={3}
              placeholder="أهلًا 👋 أسعارنا تبدأ من... ابعتلنا رقمك ونكلمك بالتفاصيل."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
            />
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <label className="text-sm flex items-center gap-2 text-slate-700">
              المطابقة:
              <select
                name="match_type"
                className="px-2 py-1 rounded border border-slate-200 text-sm"
              >
                <option value="contains">يحتوي الكلمة</option>
                <option value="exact">مطابقة تامة</option>
              </select>
            </label>
            <label className="text-sm flex items-center gap-1.5 text-slate-700">
              <input type="checkbox" name="apply_dm" defaultChecked /> الرسائل
            </label>
            <label className="text-sm flex items-center gap-1.5 text-slate-700">
              <input type="checkbox" name="apply_comment" defaultChecked /> الكومنتات
            </label>
            <button
              type="submit"
              className="ms-auto px-4 py-2 rounded-lg bg-brand-cyan text-white font-bold text-sm hover:bg-brand-cyan-dark transition"
            >
              + أضف القاعدة
            </button>
          </div>
        </form>

        {rules && rules.length > 0 ? (
          <div className="space-y-2">
            {rules.map((r) => (
              <div
                key={r.id}
                className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-white"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1 mb-1">
                    {(r.keywords || []).map((k, i) => (
                      <span
                        key={i}
                        className="text-xs font-bold px-2 py-0.5 rounded bg-cyan-50 text-brand-cyan-dark border border-cyan-100"
                      >
                        {k}
                      </span>
                    ))}
                    <span className="text-[10px] text-slate-400 px-1.5">
                      {r.match_type === "exact" ? "تام" : "يحتوي"}
                      {r.apply_dm !== false ? " · رسائل" : ""}
                      {r.apply_comment !== false ? " · كومنتات" : ""}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">
                    {r.response}
                  </p>
                </div>
                <form action={deleteAutoReplyRule}>
                  <input type="hidden" name="id" value={r.id} />
                  <button
                    type="submit"
                    className="text-rose-500 hover:text-rose-700 text-sm font-bold shrink-0"
                  >
                    حذف
                  </button>
                </form>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">مفيش قواعد لسه — ضيف أول قاعدة فوق.</p>
        )}
      </div>

      {/* ── Auto-reply files (bot sends these to customers) ── */}
      <div className="mt-10">
        <h2 className="text-xl font-black text-slate-900 mb-1">
          📎 ملفات الرد الآلي (كتالوجات / أسعار / مواصفات)
        </h2>
        <p className="text-sm text-slate-500 mb-4">
          ارفع الملف على أي مكان (موقعك، Google Drive بصلاحية عامة...) وحط
          رابطه هنا. لما العميل يسأل سؤال يخص الملف (مثلاً «عايز أشوف الألوان»)،
          البوت يبعتله الملف نفسه في الماسنجر تلقائيًا — مرة واحدة لكل عميل.
        </p>

        {sp.att_added && (
          <div className="mb-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-800">
            تمت إضافة الملف ✓
          </div>
        )}
        {sp.att_deleted && (
          <div className="mb-3 p-3 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-700">
            تم حذف الملف
          </div>
        )}
        {sp.att_error && (
          <div className="mb-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700">
            {decodeURIComponent(sp.att_error)}
          </div>
        )}

        <form
          action={addInboxAttachment}
          className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 mb-5"
        >
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                اسم الملف (اللي هيظهر)
              </label>
              <input
                name="label"
                required
                placeholder="كتالوج ألوان الأبواب"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                النوع
              </label>
              <select
                name="type"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
              >
                <option value="file">ملف (PDF / مستند)</option>
                <option value="image">صورة</option>
                <option value="video">فيديو</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              رابط الملف (https)
            </label>
            <input
              name="url"
              required
              dir="ltr"
              placeholder="https://www.nidhamhr.com/files/elmasreya/door-colors.pdf"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              كلمات تطلب الملف (افصل بفاصلة — اختياري لكن مفيد)
            </label>
            <input
              name="triggers"
              placeholder="لون، الوان، اشكال، كتالوج"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              امتى يتبعت؟ (وصف للـ AI — اختياري)
            </label>
            <input
              name="when_to_use"
              placeholder="لما العميل يسأل عن الألوان أو الأشكال المتاحة"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
            />
          </div>
          <div className="flex">
            <button
              type="submit"
              className="ms-auto px-4 py-2 rounded-lg bg-brand-cyan text-white font-bold text-sm hover:bg-brand-cyan-dark transition"
            >
              + أضف الملف
            </button>
          </div>
        </form>

        {attachments.length > 0 ? (
          <div className="space-y-2">
            {attachments.map((a) => (
              <div
                key={a.id}
                className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-white"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-bold text-slate-900 text-sm">
                      📎 {a.label}
                    </span>
                    <span className="text-[10px] text-slate-400 px-1.5 border border-slate-200 rounded">
                      {a.type === "image"
                        ? "صورة"
                        : a.type === "video"
                          ? "فيديو"
                          : "ملف"}
                    </span>
                  </div>
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noopener"
                    dir="ltr"
                    className="text-xs text-brand-cyan-dark underline break-all block"
                  >
                    {a.url}
                  </a>
                  {a.triggers && a.triggers.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 mt-1">
                      {a.triggers.map((t, i) => (
                        <span
                          key={i}
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-50 text-brand-cyan-dark border border-cyan-100"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                  {a.whenToUse && (
                    <p className="text-xs text-slate-500 mt-1">{a.whenToUse}</p>
                  )}
                </div>
                <form action={deleteInboxAttachment}>
                  <input type="hidden" name="id" value={a.id} />
                  <button
                    type="submit"
                    className="text-rose-500 hover:text-rose-700 text-sm font-bold shrink-0"
                  >
                    حذف
                  </button>
                </form>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">
            مفيش ملفات لسه — ضيف أول ملف فوق.
          </p>
        )}
      </div>
    </div>
  );
}
