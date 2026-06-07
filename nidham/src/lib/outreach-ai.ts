// ============================================================================
// Outreach AI — generate WhatsApp opener messages for cold B2B prospects
// ============================================================================
//
// The "create the content" half of the growth tool. Given a target sector
// (and optional angle), produces a few short, value-first WhatsApp openers
// that personalize with {name} — the same merge tag Bot X uses — and end
// with a soft CTA + an opt-out line (anti-ban + anti-spam hygiene).
//
// Goes through callWithFallback (Groq → Gemini) like the rest of the
// Marketing Studio so it inherits the multi-provider resilience.

import { generateObject } from "ai";
import { z } from "zod";
import { callWithFallback } from "./ai-models";

export const outreachMessagesSchema = z.object({
  messages: z
    .array(
      z.object({
        angle: z
          .string()
          .describe("زاوية الرسالة باختصار (مثلاً: توفير وقت، خوف من الغرامات، فضول)"),
        text: z
          .string()
          .describe(
            "رسالة واتساب قصيرة بالعامية المصرية تبدأ بـ {name}، فيها قيمة وسؤال، وتنتهي بدعوة + سطر إلغاء",
          ),
      }),
    )
    .min(3)
    .max(5),
});

export type OutreachMessages = z.infer<typeof outreachMessagesSchema>;

const OUTREACH_SYSTEM = `أنت خبير مبيعات B2B (SDR) للسوق المصري بتسوّق لنظام «نِظام HR» —
نظام مصري سحابي لإدارة الموارد البشرية والمرتبات + CRM، بيحسب المرتبات
والتأمينات (11% موظف / 18.75% شركة) والضريبة والأوفر تايم والإجازات
ونهاية الخدمة أوتوماتيك، ويربط أجهزة البصمة. الباقات 750 / 2,500 / 6,000
جنيه شهريًا، وفيه تجربة مجانية 14 يوم. الموقع nidhamhr.com والتجربة
nidhamhr.com/signup

مهمتك: تكتب رسائل واتساب افتتاحية لعملاء جدد (شركات/مصانع) عشان تبدأ
محادثة، مش عشان تبيع في أول رسالة.

قواعد إلزامية:
1. **قصيرة جدًا** — 3 لـ 5 أسطر بحد أقصى. الناس مش بتقرا رسائل طويلة من رقم غريب.
2. **تبدأ بـ {name}** — استخدم العلامة دي حرفيًا عشان البرنامج يستبدلها باسم الشركة/العميل.
3. **القيمة الأول** — اذكر ألم حقيقي (غرامات تأمينات، وقت آخر الشهر، أخطاء إكسل) قبل ما تذكر النظام.
4. **سؤال يفتح حوار** — اقفل بسؤال بسيط (مثلاً: حضرتك كام موظف؟) أو دعوة للتجربة.
5. **سطر إلغاء** — اختم بجملة مهذبة زي: (لو مش مهتم اكتب «إلغاء» وما هزعّجكش تاني).
6. **مفيش مبالغة ولا CAPS ولا وعود كاذبة** — نبرة محترمة وطبيعية.
7. **عامية مصرية** — مفيش فصحى ثقيلة.`;

export async function generateOutreachMessages(input: {
  sector: string;
  angle?: string;
  city?: string;
}): Promise<OutreachMessages> {
  const userPrompt = `**القطاع المستهدف:** ${input.sector}
${input.city ? `**المدينة/المنطقة:** ${input.city}` : ""}
${input.angle ? `**زاوية مطلوبة بالذات:** ${input.angle}` : ""}

اكتب 3-5 رسائل واتساب افتتاحية مختلفة الزوايا لعملاء في القطاع ده،
كل رسالة تبدأ بـ {name} وتنتهي بدعوة + سطر إلغاء. خليها طبيعية وقصيرة.`;

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
