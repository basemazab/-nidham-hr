// ============================================================================
// /api/ai/support — المساعد الفني الفوري (لكل مستخدمي النظام)
// ============================================================================
// A support agent that solves users' problems WITHOUT going back to the
// founder: it knows every setup flow (SUPPORT_KB), can run LIVE diagnostics
// on the caller's company (same engine as مهندس النظام), and files a ticket
// with full context when human/dev intervention is needed.
//
// Open to ALL roles (employees ask "إزاي أسجل حضور؟" too); the diagnostics
// tool itself is admin/manager-gated since it reads tenant settings.

import { streamText, stepCountIs, tool } from "ai";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { pickAgentModelLargeContext } from "@/lib/ai-models";
import { runSystemHealth } from "@/lib/system-health";
import { SUPPORT_KB } from "@/lib/support-kb";

export const maxDuration = 60;

type UIMessagePart = { type: string; text?: string };
type IncomingMessage = {
  role: "user" | "assistant" | "system";
  parts?: UIMessagePart[];
  content?: string;
};

function normalizeMessages(
  raw: unknown,
): { role: "user" | "assistant" | "system"; content: string }[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((m): m is IncomingMessage => m && typeof m === "object" && "role" in m)
    .map((m) => {
      let content = "";
      if (Array.isArray(m.parts)) {
        content = m.parts
          .filter((p) => p && p.type === "text" && typeof p.text === "string")
          .map((p) => p.text!)
          .join("");
      } else if (typeof m.content === "string") {
        content = m.content;
      }
      return { role: m.role, content };
    })
    .filter((m) => m.content.length > 0);
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, company_id, full_name, role")
    .eq("id", user.id)
    .single<{ id: string; company_id: string; full_name: string | null; role: string }>();
  if (!profile) {
    return new Response(JSON.stringify({ error: "Profile not found" }), { status: 401 });
  }

  const rl = checkRateLimit(`ai-support:${profile.id}`, 30, 10 * 60_000);
  if (!rl.ok) {
    return new Response(
      JSON.stringify({
        error: `كتر شوية — جرّب تاني بعد ${Math.ceil(rl.retryAfterSeconds / 60)} دقيقة`,
      }),
      { status: 429 },
    );
  }

  let body: { messages?: unknown };
  try {
    body = (await req.json()) as { messages?: unknown };
  } catch {
    return new Response(JSON.stringify({ error: "Bad request" }), { status: 400 });
  }
  const messages = normalizeMessages(body.messages).slice(-12);
  if (messages.length === 0) {
    return new Response(JSON.stringify({ error: "No message" }), { status: 400 });
  }

  const isHR = profile.role === "admin" || profile.role === "manager";

  const systemPrompt = `إنت «مساعد نِظام الفني» — موظف دعم فني شاطر وودود بالعامية المصرية، شغال جوه نظام نِظام (Nidham HR).
المستخدم: ${profile.full_name || "مستخدم"} — دوره: ${profile.role}.

مهمتك: تحل مشكلة المستخدم أو تعلّمه يستخدم أي حاجة في النظام — بنفسك ومن غير ما يحتاج يكلم حد.

قواعدك:
1. **شخّص قبل ما تفتي**: لو المستخدم بيشتكي من حاجة مش شغالة (فيسبوك، لينكد إن، إيميلات، AI، نشر...) ${isHR ? "نادي أداة run_diagnostics الأول — بتفحص نظامه فعليًا وبترجعلك مكان العطل بالظبط، وساعتها حلّك يبقى مبني على الواقع مش تخمين." : "اشرحله الحل من الدليل، ولو المشكلة في إعدادات الشركة قوله إنها محتاجة الأدمن."}
2. **اشرح خطوة بخطوة**: بالمسارات وأسماء الزراير الفعلية من الدليل تحت — متخترعش صفحات أو زراير مش موجودة.
3. **لو المشكلة محتاجة تدخل المطور** (عطل مش في الدليل، حاجة باينة باجّة، أو طلب فيتشر): نادي create_support_ticket بعنوان واضح وملخص المحادثة — وقوله إن الطلب اتسجل وهيتم متابعته.
4. رد مختصر وعملي — فقرات قصيرة وخطوات مرقمة. ممنوع تقول إنك AI، إنت من فريق دعم نِظام.
5. متجاوبش على حاجة بره النظام (سياسة، دين، برامج تانية...) — رجّع الكلام بأدب لموضوع النظام.

● دليل النظام الكامل (مصدرك الوحيد للمعلومات):
${SUPPORT_KB}`;

  const tools = {
    ...(isHR
      ? {
          run_diagnostics: tool({
            description:
              "افحص نظام شركة المستخدم فحص حي شامل (قاعدة البيانات، AI، توكن فيسبوك، لينكد إن، الإيميل، الكرون، الصندوق). استخدمها أول ما المستخدم يشتكي إن حاجة مش شغالة — النتيجة بتحدد مكان العطل بالظبط.",
            // NOTE: Gemini rejects function declarations whose OBJECT schema
            // has zero properties — keep at least one (optional) field.
            inputSchema: z.object({
              reason: z
                .string()
                .optional()
                .describe("سبب الفحص باختصار (اختياري)"),
            }),
            execute: async () => {
              try {
                const checks = await runSystemHealth(supabase, profile.company_id);
                return { ok: true, checks };
              } catch (err) {
                return {
                  ok: false,
                  error: err instanceof Error ? err.message : String(err),
                };
              }
            },
          }),
        }
      : {}),
    create_support_ticket: tool({
      description:
        "سجّل تذكرة لفريق التطوير لما المشكلة تحتاج تدخل بشري أو المستخدم يطلب فيتشر جديدة. بتتسجل بتشخيص حي مرفق تلقائيًا.",
      inputSchema: z.object({
        kind: z.enum(["bug", "feature"]).describe("bug = مشكلة، feature = طلب فيتشر"),
        title: z.string().min(5).max(150).describe("عنوان واضح ومحدد للمشكلة/الطلب"),
        details: z
          .string()
          .min(10)
          .max(2000)
          .describe("ملخص المشكلة من كلام المستخدم + أي تفاصيل مهمة من المحادثة"),
      }),
      execute: async ({ kind, title, details }) => {
        let diagnostics = null;
        if (isHR) {
          try {
            diagnostics = await runSystemHealth(supabase, profile.company_id);
          } catch {
            diagnostics = null;
          }
        }
        const { error } = await supabase.from("dev_requests").insert({
          company_id: profile.company_id,
          kind,
          title,
          details: `${details}\n\n[سُجلت بواسطة المساعد الفني نيابة عن ${profile.full_name || "مستخدم"}]`,
          diagnostics,
          created_by: profile.id,
        });
        if (error) {
          return { ok: false, error: error.message };
        }
        return {
          ok: true,
          note: "التذكرة اتسجلت بنجاح ومعاها تشخيص كامل — فريق نِظام هيتابعها.",
        };
      },
    }),
  };

  const picked = pickAgentModelLargeContext();
  const result = streamText({
    model: picked.model,
    system: systemPrompt,
    messages,
    tools,
    stopWhen: stepCountIs(5),
    temperature: 0.3,
    maxRetries: 1,
    onError: ({ error }) => {
      console.error(
        "[support-agent] stream error:",
        error instanceof Error ? error.message : error,
      );
    },
  });

  return result.toUIMessageStreamResponse();
}
