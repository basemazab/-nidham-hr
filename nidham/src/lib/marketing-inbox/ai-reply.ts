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
الشركة: نِظام (Nidham) — أول نظام HR + Payroll + CRM مصري متكامل بالذكاء الاصطناعي.
متوافق مع قانون العمل 12/2003، والتأمينات الاجتماعية 148/2019، وحماية البيانات 151/2020.

الأسعار بالجنيه المصري:
  - مجانية: حتى 5 موظفين
  - Starter: 750 جنيه/شهر (حتى 25 موظف)
  - Pro: 2,500 جنيه/شهر (حتى 100 موظف) — يشمل درع الامتثال + المساعد الذكي + بوت واتساب للموظفين
  - Business: 6,000 جنيه/شهر (حتى 500 موظف) — يشمل استوديو التسويق بالـ AI
  - الاشتراك السنوي = شهرين هدية. 14 يوم تجربة مجانية بدون بطاقة ائتمان.

أهم المميزات (محدّثة):
  🛡️ درع الامتثال (حصري في مصر): بيفحص بيانات شركتك ويحذّرك من أي غرامة من مكتب العمل أو التأمينات قبل ما تحصل — بالقيمة بالجنيه والمادة القانونية.
  🧑‍💼 إدارة الموظفين: ملف شامل (مرتب، تأمينات، رقم قومي، بنك)، رفع Excel/PDF بالـ AI، أكواد QR للدعوة، هيكل تنظيمي.
  ⏰ الحضور: تثبيت بالـ GPS + سيلفي، Geofence حول الموقع، استيراد من بصمة ZKTeco.
  💰 المرتبات المصرية: تأمينات اجتماعية 11% على الموظف على الأجر التأميني بين 2,700 و16,700 جنيه (قيم 2026)، ضريبة كسب العمل بالشرائح بعد إعفاء 20,000 جنيه سنويًا (حتى 27.5%)، خصم السلف والغياب تلقائيًا (مع تحديد «قيمة اليوم» لكل موظف لحساب الغياب بدقة)، قسيمة راتب قابلة للتخصيص (تتحكم في البنود الظاهرة وتخفي مثلاً الضريبة/التأمينات)، نماذج 1 و2 و6 ومكافأة نهاية الخدمة.
  📨 طلبات الموظفين: 8 أنواع إجازة + سلف + استئذان من الموبايل، واعتماد HR، ورصيد يتحدّث تلقائيًا.
  💼 CRM: Pipeline، عقود، تفاعلات، تنبيهات تجديد.
  🎯 التوظيف الذكي: محلّل سيرة ذاتية بالـ AI — يرفع الـ CV ويرشّح أنسب وظيفة من وظائف الشركة، ويجهّز اختبار للمرشّح وأسئلة مقابلة لـ HR مخصصة لنشاط الشركة. + مولّد توصيف وظيفي ومهام واقعية لأي وظيفة (قابل للطباعة وتسليمه للموظف).
  🤖 مساعد ذكي بالعربي: يسأل عن قانون العمل والتأمينات والضرائب أو عن بيانات شركتك.
  💬 بوت واتساب للموظفين: الموظف يسأل عن رصيد إجازاته أو مرتبه أو حضوره من واتساب ويرد عليه تلقائيًا.
  ✦ استوديو التسويق (Business): أدوات AI للحملات و ad copy و SEO، Landing Pages، التقاط Leads، تصميم بوستات، وتحليلات.
  📊 التقارير + Bridge Analytics (الالتزام × الإنتاجية لكل موظف).
  🖥️ تطبيق سطح المكتب (ويندوز): نزّله من الموقع وثبّته كبرنامج — يشتغل أونلاين على السحابة، أو أوفلاين بالكامل على سيرفر شركتك الداخلي.
  🏢 نسخة Enterprise (On-Premise): تثبيت كامل على سيرفر الشركة، يشتغل بدون إنترنت (Air-gapped) مع عزل بيانات كامل.
  ✍️ توقيع إلكتروني للعقود.
  🔒 الأمان: تشفير AES-256، صلاحيات RLS متعددة المستويات، تحقق بخطوتين (2FA)، Audit Log، توافق PDPL 151/2020.

الروابط الرسمية (استخدمها بالحرف زي ما هي — وممنوع تخترع أي رابط تاني):
  - الموقع الرئيسي: https://www.nidhamhr.com
  - تجربة مجانية / تسجيل: https://www.nidhamhr.com/signup
  - الأسعار: https://www.nidhamhr.com/pricing
  - كتيب / بروشور النظام: https://www.nidhamhr.com/brochure
  - المميزات الكاملة: https://www.nidhamhr.com/features
  - مقارنة بالمنافسين: https://www.nidhamhr.com/compare
  - تحميل تطبيق سطح المكتب: https://www.nidhamhr.com/download
  - نسخة Enterprise (سيرفر داخلي): https://www.nidhamhr.com/enterprise
  - تواصل معنا: https://www.nidhamhr.com/contact
`;

// Real public sections on nidhamhr.com. If the model emits a nidhamhr.com link
// whose first path segment isn't here, it's a hallucinated URL (e.g. the
// invented /kiteb) — we collapse it to the homepage so a customer never gets a
// broken/404 link. Hard guarantee, independent of the prompt (and survives a
// per-tenant prompt/context override).
const VALID_SITE_PATHS = new Set<string>([
  "", "signup", "login", "pricing", "features", "compare", "why-nidham",
  "brochure", "sales-brochure", "download", "enterprise", "contact", "faq",
  "about", "blog", "tools", "compliance-shield", "product", "industries",
  "ai", "crm", "security", "integrations", "help", "developers", "api-docs",
]);

export function sanitizeReplyLinks(text: string): string {
  return text.replace(
    /https?:\/\/(?:www\.)?nidhamhr\.com(\/[^\s)]*)?/gi,
    (full: string, path?: string) => {
      const seg = (path ?? "").replace(/^\//, "").split(/[/?#]/)[0].toLowerCase();
      return VALID_SITE_PATHS.has(seg) ? full : "https://www.nidhamhr.com";
    },
  );
}

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
6. الروابط: استخدم **الروابط الرسمية المذكورة تحت بالحرف فقط**. ممنوع منعًا باتًا تخترع أي رابط أو مسار من دماغك (زي /kiteb أو /brochure-pdf). لو مفيش رابط مناسب للي العميل طلبه، قول "هخلي الفريق يبعتهولك" واطلب رقمه، أو وجّهه للموقع الرئيسي — متخترعش لينك أبدًا.

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

  // Final guard: never let a hallucinated/broken nidhamhr.com link reach a
  // customer — unknown paths collapse to the homepage.
  reply = sanitizeReplyLinks(reply);

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
