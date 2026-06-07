// ============================================================================
// Outreach AI — generate WhatsApp opener messages for a TENANT's prospects
// ============================================================================
//
// IMPORTANT: Nidham is multi-tenant. Each company uses this tool to market
// THEIR OWN product/service — NOT to market Nidham. So the messages are
// driven entirely by the caller-supplied `business` (the tenant's product).
// The model must never inject Nidham or any other product. If `business` is
// thin, it writes generic professional copy without inventing details.

import { generateObject } from "ai";
import { z } from "zod";
import { callWithFallback } from "./ai-models";

export const outreachMessagesSchema = z.object({
  messages: z
    .array(
      z.object({
        angle: z
          .string()
          .describe("زاوية الرسالة باختصار (مثلاً: توفير، جودة، عرض، فضول)"),
        text: z
          .string()
          .describe(
            "رسالة واتساب قصيرة بالعامية المصرية تبدأ بـ {name}، عن منتج المستخدم، وتنتهي بدعوة + سطر إلغاء",
          ),
      }),
    )
    .min(3)
    .max(5),
});

export type OutreachMessages = z.infer<typeof outreachMessagesSchema>;

const OUTREACH_SYSTEM = `أنت خبير مبيعات B2B (SDR) محترف. مهمتك تكتب رسائل واتساب افتتاحية لصاحب
شغل عشان يبدأ محادثة مع عملاء محتملين.

⚠️ قاعدة أساسية: إنت بتسوّق **لمنتج/خدمة المستخدم** (الموضّحة تحت في «منتج
المستخدم») وبس. ممنوع منعًا باتًا تذكر أي نظام أو منتج أو شركة تانية، وممنوع
تذكر «نِظام» أو أي برنامج HR — إلا لو ده فعلاً منتج المستخدم المكتوب تحت.

قواعد إلزامية:
1. كل الرسائل عن «منتج المستخدم» فقط، وموجّهة للعملاء المستهدفين المذكورين.
2. متخترعش مميزات أو أسعار أو أرقام أو لينكات أو ضمانات مش مكتوبة في وصف
   المنتج. لو الوصف مختصر، اكتب رسائل مهنية عامة عن المنتج من غير تفاصيل ملفّقة.
3. كل رسالة تبدأ بـ {name} (هتتبدل باسم العميل).
4. قصيرة جدًا (3-5 أسطر)، القيمة الأول، واقفل بسؤال بسيط أو دعوة.
5. اختم بسطر إلغاء مهذب، مثل: (لو مش مهتم اكتب «إلغاء» وما هزعّجكش تاني).
6. عامية مصرية محترمة، نبرة طبيعية، من غير مبالغة ولا CAPS.`;

export async function generateOutreachMessages(input: {
  /** The TENANT's own product/service — what THEY sell. Drives everything. */
  business: string;
  /** Target audience / sector the tenant wants to reach. */
  sector: string;
  angle?: string;
  city?: string;
  /** Optional CTA / contact info / link the tenant wants included. */
  contact?: string;
}): Promise<OutreachMessages> {
  const userPrompt = `**منتج المستخدم (اللي بنسوّقله — ركّز عليه هو بس):**
${input.business}

**العملاء المستهدفين:** ${input.sector}
${input.city ? `**المدينة/المنطقة:** ${input.city}` : ""}
${input.angle ? `**زاوية مطلوبة بالذات:** ${input.angle}` : ""}
${input.contact ? `**طريقة التواصل/الدعوة المطلوب ذكرها:** ${input.contact}` : ""}

اكتب 3-5 رسائل واتساب افتتاحية مختلفة الزوايا، كلها عن «منتج المستخدم» فقط،
موجّهة للعملاء المستهدفين. كل رسالة تبدأ بـ {name} وتنتهي بدعوة + سطر إلغاء.`;

  return callWithFallback(async (picked) => {
    const { object } = await generateObject({
      maxRetries: 0, // callWithFallback owns the retry chain
      model: picked.model,
      schema: outreachMessagesSchema,
      system: OUTREACH_SYSTEM,
      prompt: userPrompt,
      temperature: 0.85,
    });
    return object;
  });
}
