import { z } from "zod";
import { generateText } from "ai";
import { callWithFallback } from "@/lib/ai-models";

export const AiReplyResultSchema = z.object({
  reply: z
    .string()
    .min(1)
    .max(400)
    .describe(
      "Reply text in Egyptian Arabic. Short, friendly, ≤ 60 words. End with a CTA.",
    ),
  intent: z.enum([
    "pricing_inquiry",
    "demo_request",
    "feature_question",
    "support_request",
    "complaint",
    "spam",
    "greeting",
    "other",
  ]),
  leadQuality: z.enum(["hot", "warm", "cold", "spam"]).describe(
    "hot = clear buying intent, asks pricing/demo. warm = interested but exploring. cold = vague. spam = irrelevant/insult/ad.",
  ),
  shouldHandoff: z
    .boolean()
    .describe(
      "True when the conversation should be handed to a human — complex pricing, complaint, lawsuit talk, or after 4+ turns without resolution.",
    ),
  handoffReason: z
    .string()
    .max(120)
    .describe(
      "Short Arabic note for the sales rep — why this lead is hot or needs human attention. Empty string if not needed.",
    ),
});

export type AiReplyResult = z.infer<typeof AiReplyResultSchema>;

// Lenient mirror used ONLY to parse the model's raw output. Every field has a
// .catch() fallback, so a missing or odd field can never throw — the inbox
// degrades to a graceful human-handoff instead of surfacing an "ai_error".
const LenientReplySchema = z.object({
  reply: z.string().catch(""),
  intent: z
    .enum([
      "pricing_inquiry",
      "demo_request",
      "feature_question",
      "support_request",
      "complaint",
      "spam",
      "greeting",
      "other",
    ])
    .catch("other"),
  leadQuality: z.enum(["hot", "warm", "cold", "spam"]).catch("warm"),
  shouldHandoff: z.boolean().catch(false),
  handoffReason: z.string().catch(""),
});

const DEFAULT_BUSINESS_CONTEXT = `
الشركة: نِظام HR — أول نظام HR + Payroll + CRM مصري متكامل بالذكاء الاصطناعي.
متوافق مع قانون العمل 12/2003 وقانون التأمينات 148/2019.

الأسعار بالجنيه المصري:
  - Starter: 750 جنيه/شهر (حتى 25 موظف)
  - Pro: 2,500 جنيه/شهر (حتى 100 موظف) — يشمل درع الامتثال + AI Assistant + بوت واتساب
  - Business: 6,000 جنيه/شهر (حتى 500 موظف) — يشمل استوديو تسويق AI

قائمة المميزات التفصيلية:
  🧑‍💼 إدارة الموظفين: بيانات شاملة (مرتب، تأمينات، قومي، بنك)، رفع Excel أو PDF بالـ AI، أكواد QR
  ⏰ حضور GPS: تثبيت حضور بالـ GPS + سيلفي، Geofence قابل للتعديل، استيراد من بصمة ZKTeco
  💰 المرتبات: حساب التأمينات 14% (حد أقصى 11,700 جنيه)، ضريبة الدخل بشرائح (10%–27.5%)، نماذج 1 و 2 و 6
  📨 طلب إجازات: 8 أنواع إجازة، سلف، استئذان — من الموبايل
  💼 CRM: Pipeline متكامل، عقود، تفاعلات، تنبيهات تجديد
  🎯 توظيف ذكي: فحص CVs بالذكاء الاصطناعي (درجة 0–100)، أسئلة مقابلة مقترحة
  🤖 AI: يسأل بالعربي عن قانون العمل أو بيانات الشركة (مشترك مع Gemini)
  📊 التقارير: تقارير الحضور الشهري + Bridge Analytics
  ✦ استوديو تسويق: 6 أدوات AI تسويق، Landing Pages، إدارة حملات، تصميم بوستات، Leads pipeline
  💬 بوت واتساب: الموظفين يقدروا يطلبوا إجازة ويشوفوا قسيمة الراتب من واتساب
  ✍️ توقيع إلكتروني: توقيع العقود إلكترونياً
  🔒 متوافق مع PDPL 151/2020، تشفير AES-256، Audit Log

14 يوم تجربة مجانية بدون credit card.
الموقع: https://www.nidhamhr.com
`;

export type ConversationTurn = {
  role: "user" | "assistant";
  body: string;
};

export async function generateMarketingReply(input: {
  userMessage: string;
  history?: ConversationTurn[];
  businessContext?: string;
  systemPromptOverride?: string;
}): Promise<AiReplyResult> {
  const businessContext =
    input.businessContext?.trim() || DEFAULT_BUSINESS_CONTEXT.trim();

  const systemPrompt =
    input.systemPromptOverride?.trim() ||
    `أنت مساعد مبيعات خبير وودود بتتكلم بالعامية المصرية.
شغلك إنك ترد على رسائل واردة من إعلانات Facebook و Instagram 
وتحولهم لـ Lead مؤهل للنظام.

● قواعد الرد الأساسية:
1. رد قصير محترم (≤ 60 كلمة) — عملي مش تسويقي زايد.
2. عامية مصرية واضحة — مش فصحى ولا خليجي.
3. كل رد ينتهي بـ CTA واحد: لينك أو سؤال.
4. ممنوع الكذب. لو مش متأكد من حاجة، قول "هخلي فريق المبيعات يتواصل معاك".
5. ممنوع تستخدم أكتر من 2 emoji.

● تصنيف النية (intent):
  • pricing_inquiry: بيسأل عن السعر أو المقارنة بين الباقات — دايماً hot.
  • demo_request: عايز تجربة أو يشوف النظام — دايماً hot.
  • feature_question: بيسأل عن ميزة معينة (حضور GPS، مرتبات، AI، CRM، الخ) — جاوب بالتفصيل المختصر من معلومات الشركة تحت، واعرض تجربة مجانية.
  • support_request: عنده مشكلة أو استفسار دعم — حول للبشر (shouldHandoff: true).
  • complaint: شاكي أو متضايق — حول للبشر بسرعة.
  • spam: مش مفهوم أو إعلان — رد مهذب short وخلاص.
  • greeting: "السلام عليكم" أو "صباح الخير" — رد ترحيب قصير واسأله إزاي تقدر تساعده.
  • other: مش عارف تصنفه — رد عام واسأله.

● معايير leadQuality:
  • hot: عنده نية شراء واضحة (سأل عن سعر، عايز demo، مقارنة).
  • warm: مهتم ومستفسر عن ميزة أو فكرة عامة.
  • cold: فضول بس لسه مش جاد — أو "بعدين إن شاء الله".
  • spam: مش relevant خالص.

● معلومات الشركة (استخدمها للرد):
${businessContext}

● IMPORTANT: ردّ بجسون ONLY — أي كلام برة الـ JSON هيكسر النظام.
اكتب JSON بالشكل ده بالظبط:
{
  "reply": "ردك بالعامية المصرية",
  "intent": "pricing_inquiry | demo_request | feature_question | support_request | complaint | spam | greeting | other",
  "leadQuality": "hot | warm | cold | spam",
  "shouldHandoff": true أو false,
  "handoffReason": "سبب التحويل لبشر (أو نص فاضي لو shouldHandoff = false)"
}`.trim();

  const historyTurns = (input.history || []).slice(-5);
  const conversationContext = historyTurns
    .map((t) => `${t.role === "user" ? "العميل" : "المساعد"}: ${t.body}`)
    .join("\n");

  const userPrompt = `
${conversationContext ? `المحادثة قبل كده:\n${conversationContext}\n\n` : ""}الرسالة الجديدة من العميل:
"${input.userMessage}"

اكتب JSON فقط — من غير أي كلام تاني.
  `.trim();

  // Wrapped in callWithFallback so a Groq quota / overload doesn't kill
  // the whole inbox-AI feature — the chain transparently swaps to a
  // smaller Groq model, then Gemini.
  const result = await callWithFallback((picked) =>
    generateText({
      model: picked.model,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.4,
      maxRetries: 0, // we do our own retry through callWithFallback
    }),
  );

  // Parse defensively. The model is told to return JSON, but it sometimes
  // wraps it in ```json fences or drops a field. Strip fences, extract the
  // object, and validate through the lenient schema (every field has a safe
  // fallback). If we still can't get a usable reply, degrade to a polite
  // acknowledgement + human handoff — NEVER throw, so the conversation is
  // never flagged "ai_error" in the inbox.
  const text = result.text.trim();
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "");
  const jsonStart = cleaned.indexOf("{");
  const jsonEnd = cleaned.lastIndexOf("}");

  let raw: unknown = {};
  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    try {
      raw = JSON.parse(cleaned.slice(jsonStart, jsonEnd + 1));
    } catch {
      raw = {};
    }
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) raw = {};

  const data = LenientReplySchema.parse(raw);
  let reply = data.reply.trim();
  let shouldHandoff = data.shouldHandoff;
  let handoffReason = data.handoffReason.trim();

  if (!reply) {
    // Model gave nothing usable — hand off to a human instead of erroring.
    reply =
      "وصلتني رسالتك ✅ فريقنا هيتواصل معاك حالًا. وللاطلاع على النظام: https://www.nidhamhr.com";
    shouldHandoff = true;
    if (!handoffReason) {
      handoffReason = "تعذّر توليد رد آلي منظّم — يحتاج متابعة بشرية";
    }
  }

  return {
    reply: reply.slice(0, 400),
    intent: data.intent,
    leadQuality: data.leadQuality,
    shouldHandoff,
    handoffReason: handoffReason.slice(0, 120),
  };
}

export function tryTemplateMatch(input: {
  userMessage: string;
  templates: Array<{ trigger_keywords: string[]; reply_text: string }>;
}): string | null {
  const msg = input.userMessage.toLowerCase();
  for (const tpl of input.templates) {
    if (tpl.trigger_keywords.some((kw) => msg.includes(kw.toLowerCase()))) {
      return tpl.reply_text;
    }
  }
  return null;
}
