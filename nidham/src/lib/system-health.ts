// ============================================================================
// مهندس النظام — live health checks across every critical subsystem
// ============================================================================
// Each check is isolated (its own try/catch) so one dead integration never
// hides the rest. Results are deterministic facts with an Arabic explanation
// and a concrete fix — no AI in the loop here.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { getProviderStatus } from "@/lib/ai-models";

export type HealthCheck = {
  key: string;
  label: string;
  status: "ok" | "warn" | "fail";
  detail: string;
  fix?: string;
};

const SITE = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.nidhamhr.com"
).replace(/\/$/, "");

export async function runSystemHealth(
  supabase: any,
  companyId: string,
): Promise<HealthCheck[]> {
  const checks: HealthCheck[] = [];

  // ── 1) Database ──
  try {
    const t0 = Date.now();
    const { error } = await supabase
      .from("profiles")
      .select("id", { head: true, count: "exact" })
      .eq("company_id", companyId);
    const ms = Date.now() - t0;
    checks.push(
      error
        ? { key: "db", label: "قاعدة البيانات", status: "fail", detail: error.message, fix: "افحص حالة Supabase أو الـ RLS" }
        : { key: "db", label: "قاعدة البيانات", status: ms > 2000 ? "warn" : "ok", detail: `استجابت في ${ms}ms` },
    );
  } catch (e) {
    checks.push({ key: "db", label: "قاعدة البيانات", status: "fail", detail: String(e) });
  }

  // ── 2) AI providers ──
  try {
    const ps = getProviderStatus();
    if (!ps.groq && !ps.gemini) {
      checks.push({ key: "ai", label: "مزودات الذكاء الاصطناعي", status: "fail", detail: "مفيش ولا مفتاح AI متظبط — كل ميزات الذكاء واقفة", fix: "ضيف GROQ_API_KEY و GEMINI_API_KEY في Vercel" });
    } else if (!ps.groq || !ps.gemini) {
      checks.push({ key: "ai", label: "مزودات الذكاء الاصطناعي", status: "warn", detail: `شغال على مزود واحد بس (${ps.groq ? "Groq" : "Gemini"}) — لو ضرب الحد اليومي الميزات هتقف`, fix: `ضيف مفتاح ${ps.groq ? "GEMINI_API_KEY" : "GROQ_API_KEY"} للتكرارية` });
    } else {
      checks.push({ key: "ai", label: "مزودات الذكاء الاصطناعي", status: "ok", detail: `Groq + Gemini شغالين — الأساسي: ${ps.primary}` });
    }
  } catch (e) {
    checks.push({ key: "ai", label: "مزودات الذكاء الاصطناعي", status: "fail", detail: String(e) });
  }

  // ── 3) Meta (Facebook) page token ──
  try {
    const { data: ms } = await supabase
      .from("marketing_inbox_settings")
      .select("meta_page_id, meta_page_token")
      .eq("company_id", companyId)
      .maybeSingle();
    if (!ms?.meta_page_token || !ms?.meta_page_id) {
      checks.push({ key: "meta", label: "ربط فيسبوك (Meta)", status: "warn", detail: "مفيش صفحة فيسبوك مربوطة", fix: "التسويق ← صندوق الرسائل ← الإعدادات" });
    } else {
      const res = await fetch(
        `https://graph.facebook.com/v21.0/me?fields=id&access_token=${encodeURIComponent(ms.meta_page_token)}`,
      );
      const data = (await res.json()) as { id?: string; error?: { code?: number; message?: string } };
      checks.push(
        data.error
          ? { key: "meta", label: "ربط فيسبوك (Meta)", status: "fail", detail: `التوكن مرفوض (#${data.error.code}): ${(data.error.message || "").slice(0, 80)}`, fix: "جدّد Page Access Token من إعدادات صندوق الرسائل (♾️ حوّله لدائم)" }
          : { key: "meta", label: "ربط فيسبوك (Meta)", status: "ok", detail: "توكن الصفحة سليم — الرد الآلي شغال" },
      );
    }
  } catch (e) {
    checks.push({ key: "meta", label: "ربط فيسبوك (Meta)", status: "fail", detail: String(e) });
  }

  // ── 4) LinkedIn token ──
  try {
    const { data: li } = await supabase
      .from("linkedin_connections")
      .select("access_token, token_expires_at, member_name")
      .eq("company_id", companyId)
      .maybeSingle();
    if (!li?.access_token) {
      checks.push({ key: "linkedin", label: "ربط لينكد إن", status: "warn", detail: "مفيش حساب لينكد إن مربوط", fix: "الإعدادات ← ربط لينكد إن" });
    } else {
      const daysLeft = li.token_expires_at
        ? Math.floor((new Date(li.token_expires_at).getTime() - Date.now()) / 86_400_000)
        : null;
      if (daysLeft !== null && daysLeft <= 0) {
        checks.push({ key: "linkedin", label: "ربط لينكد إن", status: "fail", detail: "التوكن انتهى — النشر المجدول هيفشل", fix: "الإعدادات ← ربط لينكد إن ← جدّد الربط" });
      } else if (daysLeft !== null && daysLeft <= 7) {
        checks.push({ key: "linkedin", label: "ربط لينكد إن", status: "warn", detail: `التوكن هينتهي خلال ${daysLeft} يوم`, fix: "جدّد الربط قبل ما البوستات المجدولة تفشل" });
      } else {
        checks.push({ key: "linkedin", label: "ربط لينكد إن", status: "ok", detail: `متصل (${li.member_name || "حسابك"}) — باقي ${daysLeft ?? "؟"} يوم على التوكن` });
      }
    }
  } catch (e) {
    checks.push({ key: "linkedin", label: "ربط لينكد إن", status: "fail", detail: String(e) });
  }

  // ── 5) Email alerts (Resend) ──
  checks.push(
    process.env.RESEND_API_KEY
      ? { key: "resend", label: "تنبيهات الإيميل (Resend)", status: "ok", detail: `المفتاح متظبط — الإرسال من ${process.env.RESEND_FROM_EMAIL || "notifications@nidham.app"}` }
      : { key: "resend", label: "تنبيهات الإيميل (Resend)", status: "fail", detail: "RESEND_API_KEY مش موجود — تنبيهات المبيعات والإشعارات بالإيميل متوقفة", fix: "ضيف المفتاح في Vercel → Environment Variables" },
  );

  // ── 6) OG image generator ──
  try {
    const t0 = Date.now();
    const res = await fetch(`${SITE}/api/og?title=ping`, { signal: AbortSignal.timeout(15000) });
    const ms = Date.now() - t0;
    checks.push(
      res.ok
        ? { key: "og", label: "مولّد صور المشاركة", status: ms > 6000 ? "warn" : "ok", detail: `بيرد في ${ms}ms${ms > 6000 ? " — أبطأ من مهلة فيسبوك" : ""}` }
        : { key: "og", label: "مولّد صور المشاركة", status: "fail", detail: `HTTP ${res.status}`, fix: "افحص /api/og — صور مشاركة الوظائف هتظهر مكسورة" },
    );
  } catch (e) {
    checks.push({ key: "og", label: "مولّد صور المشاركة", status: "fail", detail: String(e).slice(0, 120) });
  }

  // ── 7) Scheduler freshness (daily cron) ──
  try {
    // The publisher runs in the DAILY cron, so a post legitimately waits up to
    // ~24h after its scheduled time before the next run picks it up. Only flag
    // "cron stopped" when a post is overdue beyond a full daily cycle (+2h
    // margin = 26h) — that means the cron genuinely missed a run.
    const staleThreshold = new Date(Date.now() - 26 * 3600_000).toISOString();
    const { data: overdue } = await supabase
      .from("linkedin_scheduled_posts")
      .select("id")
      .eq("company_id", companyId)
      .eq("status", "pending")
      .lt("scheduled_at", staleThreshold);
    const { data: failed } = await supabase
      .from("linkedin_scheduled_posts")
      .select("id, error")
      .eq("company_id", companyId)
      .eq("status", "failed");
    if ((overdue?.length ?? 0) > 0) {
      checks.push({ key: "cron", label: "الجدولة اليومية (Cron)", status: "fail", detail: `${overdue!.length} بوست فات معاده بأكتر من يوم ولسه منتظر — الكرون اليومي غالبًا واقف`, fix: "افحص Vercel → Crons، أو شغّل /api/cron/linkedin-posts يدويًا" });
    } else if ((failed?.length ?? 0) > 0) {
      checks.push({ key: "cron", label: "الجدولة اليومية (Cron)", status: "warn", detail: `${failed!.length} بوست فشل نشره — آخر سبب: ${(failed![0].error || "").slice(0, 80)}` });
    } else {
      checks.push({ key: "cron", label: "الجدولة اليومية (Cron)", status: "ok", detail: "مفيش بوستات متأخرة أو فاشلة" });
    }
  } catch {
    checks.push({ key: "cron", label: "الجدولة اليومية (Cron)", status: "warn", detail: "جدول النشر مش متاح (migration 106 مش متطبق؟)" });
  }

  // ── 8) Inbox delivery failures (last 48h) ──
  try {
    const twoDaysAgo = new Date(Date.now() - 48 * 3600_000).toISOString();
    const { data: convs } = await supabase
      .from("marketing_inbox_conversations")
      .select("id")
      .eq("company_id", companyId);
    const convIds = (convs ?? []).map((c: { id: string }) => c.id);
    if (convIds.length === 0) {
      checks.push({ key: "inbox", label: "صندوق رسائل التسويق", status: "ok", detail: "مفيش محادثات بعد" });
    } else {
      const { data: errs } = await supabase
        .from("marketing_inbox_messages")
        .select("delivery_error")
        .in("conversation_id", convIds.slice(0, 500))
        .not("delivery_error", "is", null)
        .neq("delivery_error", "handoff_flag")
        .gte("created_at", twoDaysAgo);
      const n = errs?.length ?? 0;
      checks.push(
        n > 0
          ? { key: "inbox", label: "صندوق رسائل التسويق", status: "warn", detail: `${n} رسالة فشل إرسالها آخر 48 ساعة — أشهر سبب: نافذة الـ 24 ساعة`, fix: "افتح الصندوق وراجع المحادثات المعلمة" }
          : { key: "inbox", label: "صندوق رسائل التسويق", status: "ok", detail: "مفيش أخطاء إرسال آخر 48 ساعة" },
      );
    }
  } catch (e) {
    checks.push({ key: "inbox", label: "صندوق رسائل التسويق", status: "warn", detail: String(e).slice(0, 120) });
  }

  return checks;
}
