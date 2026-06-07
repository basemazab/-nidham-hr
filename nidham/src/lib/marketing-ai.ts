// ============================================================================
// Marketing Studio AI engine — prompts + schemas for every tool
// ============================================================================
//
// Each marketing tool gets a tailored AI prompt + structured-output schema.
// The system prompts encode senior-marketer expertise: how to write a
// brief, how to segment audiences, how to copy that converts in Arabic
// markets, how to research keywords for Egyptian search behavior.
//
// All calls go through pickAgentModel() from /lib/ai-models.ts so we
// get the same multi-provider fallback (Groq -> Gemini) the chat agent uses.

import { generateObject } from "ai";
import { z } from "zod";
import { callWithFallback } from "./ai-models";
import { fetchPageEvidence } from "./page-fetcher";

// ----------------------------------------------------------------------------
// 1) PRODUCT ANALYZER
// ----------------------------------------------------------------------------
// Takes a 1-paragraph product description and returns a deep marketing-grade
// analysis: USP, competitive moat, primary value proposition, market
// positioning, recommended channels, suggested price strategy. The output
// feeds every other tool.

export const productAnalysisSchema = z.object({
  one_line_pitch: z.string().describe("جملة واحدة مختصرة + قوية تلخص المنتج"),
  unique_value_proposition: z
    .string()
    .describe("القيمة الفريدة اللي تميز المنتج عن المنافسين (3-4 جمل)"),
  primary_benefits: z
    .array(z.string())
    .min(3)
    .max(5)
    .describe("أهم 3-5 فوائد للعميل بصياغة 'إنت هتقدر/هتبقى/هتوفّر'"),
  competitive_moat: z
    .string()
    .describe("ليه صعب على المنافس يقلّد المنتج ده؟"),
  market_positioning: z
    .enum(["premium", "value", "budget", "specialist", "mass-market"])
    .describe("الموقع التسويقي المناسب"),
  recommended_channels: z
    .array(
      z.enum([
        "facebook_ads",
        "instagram_ads",
        "tiktok_ads",
        "google_search",
        "google_display",
        "youtube",
        "linkedin",
        "whatsapp_business",
        "snapchat",
        "telegram",
        "seo_content",
        "influencer",
        "email",
      ]),
    )
    .min(2)
    .describe("أفضل قنوات تسويق للمنتج ده مرتبة بالأولوية"),
  pricing_strategy: z
    .string()
    .describe("استراتيجية تسعير مقترحة + سبب الاختيار"),
  marketing_risks: z
    .array(z.string())
    .describe("مخاطر تسويقية ممكن تواجه المنتج"),
  growth_opportunities: z
    .array(z.string())
    .describe("فرص نمو يقدر المنتج يستفيد منها"),
});

export type ProductAnalysis = z.infer<typeof productAnalysisSchema>;

const PRODUCT_ANALYSIS_SYSTEM = `أنت كبير مستشاري التسويق في وكالة Big4 (Ogilvy/McCann)، خبرة 15 سنة
في السوق المصري والخليجي. متخصص في تحويل وصف المنتج إلى تحليل تسويقي
عميق يستخدمه أصحاب الشركات لاتخاذ قرارات الميزانية والقنوات.

قواعدك:
1. **متعمّق، لا سطحي** — كل نقطة تجيبها مبنية على فهم سوقي حقيقي مش
   كلام عام.
2. **عربي عملي** — مفيش فصحى ثقيلة. كأنك بتشرح لصاحب شركة في مصر.
3. **مصري في المثال** — لو ضرب مثال لمنافس، يكون فعلاً موجود في السوق
   المصري.
4. **مبني على القيمة** — كل فائدة تكتبها صياغتها تركز على العميل (إنت
   هتقدر/هتبقى)، مش على المنتج (المنتج بيعمل).
5. **القنوات بالترتيب** — أول قناة في recommended_channels هي اللي
   تنصح بتبدأ بيها فعلاً.`;

export async function analyzeProduct(input: {
  product_summary: string;
  industry?: string | null;
  target_market?: string;
}): Promise<ProductAnalysis> {
  const userPrompt = `**وصف المنتج:** ${input.product_summary}
${input.industry ? `**الصناعة:** ${input.industry}` : ""}
${input.target_market ? `**السوق المستهدف:** ${input.target_market}` : "**السوق المستهدف:** مصر"}

اعمل تحليل تسويقي عميق لإيه عملاء الشركة المثاليين، إزاي تتميز عن
المنافسين، أي قنوات تسويق هتجيب أفضل ROI، واستراتيجية تسعير منطقية.`;

  return callWithFallback(async (picked) => {
    const { object } = await generateObject({
      maxRetries: 0, // we do our own retry through callWithFallback
      model: picked.model,
      schema: productAnalysisSchema,
      system: PRODUCT_ANALYSIS_SYSTEM,
      prompt: userPrompt,
      temperature: 0.6,
    });
    return object;
  });
}

// ----------------------------------------------------------------------------
// 2) AUDIENCE BUILDER — generate buyer personas + targeting params
// ----------------------------------------------------------------------------

export const personaSchema = z.object({
  name: z
    .string()
    .describe("اسم شخصية + سن + مهنة (مثلاً: 'أحمد المهندس - 35')"),
  demographics: z.object({
    age_range: z.string().describe("النطاق العمري (e.g. '28-40')"),
    gender: z.enum(["male", "female", "any"]),
    location: z
      .array(z.string())
      .describe("المدن/المحافظات الأنسب في مصر"),
    income_level: z
      .enum(["low", "lower_middle", "middle", "upper_middle", "high"]),
    education: z.string().nullable(),
    occupation: z.string(),
    marital_status: z.string().nullable(),
  }),
  psychographics: z.object({
    interests: z
      .array(z.string())
      .describe("اهتمامات وهوايات (3-6 عناصر)"),
    values: z
      .array(z.string())
      .describe("القيم اللي تهمه (مثلاً: 'العائلة، الجودة، السعر')"),
    lifestyle: z.string(),
    media_consumption: z
      .array(z.string())
      .describe("القنوات اللي يقضي وقته فيها (Instagram, TikTok, etc.)"),
  }),
  pain_points: z
    .array(z.string())
    .min(3)
    .describe("المشاكل اللي بيعاني منها وعايز يحلها"),
  goals: z
    .array(z.string())
    .min(3)
    .describe("اللي عايز يحققه في حياته (ذات صلة بالمنتج)"),
  buying_journey: z.object({
    triggers: z
      .array(z.string())
      .describe("اللحظات اللي تخليه يفكر يشتري"),
    research_channels: z
      .array(z.string())
      .describe("الأماكن اللي بيدور فيها قبل القرار"),
    objections: z
      .array(z.string())
      .describe("اعتراضات شائعة بتمنعه من الشراء"),
    decision_factors: z
      .array(z.string())
      .describe("اللي بيحسم القرار في النهاية"),
  }),
  meta_targeting: z.object({
    detailed_interests: z
      .array(z.string())
      .describe(
        "كلمات بالإنجليزية تطابق Facebook Detailed Targeting Interests",
      ),
    behaviors: z.array(z.string()),
    age_min: z.number().int(),
    age_max: z.number().int(),
    locations: z.array(z.string()),
    gender: z.enum(["all", "male", "female"]),
    languages: z.array(z.string()),
  }),
  google_targeting: z.object({
    in_market_segments: z.array(z.string()),
    affinity_segments: z.array(z.string()),
    keyword_themes: z
      .array(z.string())
      .describe("كلمات مفتاحية ذات صلة بالنية الشرائية"),
  }),
});

export const personasResponseSchema = z.object({
  personas: z.array(personaSchema).min(2).max(4),
  primary_persona_index: z
    .number()
    .int()
    .describe("Index الـ persona الأهم (0-based)"),
  segmentation_strategy: z
    .string()
    .describe(
      "نصيحة حول كيف نوزع الميزانية بين الـ personas",
    ),
});

export type Persona = z.infer<typeof personaSchema>;
export type PersonasResponse = z.infer<typeof personasResponseSchema>;

const PERSONAS_SYSTEM = `أنت Customer Strategist في وكالة تسويق دولية، خبرة 12 سنة في
السوق المصري والعربي. متخصص في بناء "Buyer Personas" مبنية على واقع
السوق المحلي، مش قوالب جاهزة من الغرب.

قواعدك:
1. **شخصية حقيقية** — كل persona تبني عليها صياغة كأنه إنسان فعلي:
   "أحمد مهندس معماري عنده 35 سنة، متزوج وعنده طفلين، يسكن المعادي،
   راتبه 25-35 ألف، شغّال في شركة مقاولات صغيرة..."
2. **اهتمامات Facebook حقيقية** — في meta_targeting.detailed_interests
   استخدم Interests بأسماء فعلية تظهر في Facebook Ads Manager:
   "Home renovation", "Real estate development", "DIY", إلخ.
3. **مدن مصرية محددة** — بدل "Cairo" قول "Cairo, Giza, Alexandria,
   New Cairo, 6 October City". إستهدف صح.
4. **اعتراضات صادقة** — لو المنتج غالي، حط "السعر" في objections.
   لو جديد، حط "عدم الثقة بالعلامة الجديدة".
5. **2-4 personas مش أكتر** — كل واحد له ميزانية مختلفة في حملة الإعلان.
6. **رتب الأولوية** — primary_persona_index يكون اللي عنده أعلى احتمال
   شراء (مش الأكبر سن، الأوفر فلوس).`;

export async function generatePersonas(input: {
  product_summary: string;
  industry?: string | null;
  analysis?: ProductAnalysis;
}): Promise<PersonasResponse> {
  const analysisStr = input.analysis
    ? `\n\n**تحليل المنتج السابق:**\n${JSON.stringify(input.analysis, null, 0)}`
    : "";
  const userPrompt = `**وصف المنتج:** ${input.product_summary}
${input.industry ? `**الصناعة:** ${input.industry}` : ""}${analysisStr}

ابني 2-4 buyer personas للسوق المصري للمنتج ده، مع targeting parameters
كاملة لـ Facebook + Google Ads.`;

  return callWithFallback(async (picked) => {
    const { object } = await generateObject({
      maxRetries: 0, // we do our own retry through callWithFallback
      model: picked.model,
      schema: personasResponseSchema,
      system: PERSONAS_SYSTEM,
      prompt: userPrompt,
      temperature: 0.7,
    });
    return object;
  });
}

// ----------------------------------------------------------------------------
// 3) AD COPY GENERATOR — produce platform-ready ad copy
// ----------------------------------------------------------------------------

export const adCreativeSchema = z.object({
  platform: z.enum([
    "meta",
    "google",
    "tiktok",
    "instagram",
    "linkedin",
    "snapchat",
  ]),
  format: z.enum([
    "single_image",
    "carousel",
    "video",
    "story",
    "reel",
    "search_ad",
    "display_ad",
  ]),
  headline: z
    .string()
    .max(45)
    .describe("عنوان قصير + قوي (max 40 حرف)"),
  body: z
    .string()
    .max(160)
    .describe("نص الإعلان (max 125 حرف لـ Meta, 90 لـ Google)"),
  cta: z
    .string()
    .describe(
      "Call to action (e.g. 'كلمنا واتساب' / 'احجز كشف' / 'اطلب الكتالوج')",
    ),
  hook: z
    .string()
    .nullable()
    .describe("Hook للفيديو (TikTok/Reels) — أول 3 ثواني"),
  creative_concept: z
    .string()
    .describe(
      "وصف للـ image/video المقترح: 'صورة وايد - شخص بيركّب باب WPC في فيلا حديثة، إضاءة طبيعية'",
    ),
});

export const adCreativesResponseSchema = z.object({
  creatives: z.array(adCreativeSchema).min(3).max(8),
  notes: z
    .string()
    .describe("ملاحظات للمسوّق: أي variant جرّب الأول، توقعاتك للأداء"),
});

export type AdCreative = z.infer<typeof adCreativeSchema>;
export type AdCreativesResponse = z.infer<typeof adCreativesResponseSchema>;

const AD_COPY_SYSTEM = `أنت Senior Copywriter في وكالة إعلانات أمريكية، خبرة 10 سنين في
كتابة إعلانات بالعربية المصرية اللي تبيع. عملت 1000+ حملة، عارف
بالظبط ايه يخلي الإعلان يتسكان عليه vs يتسكب.

قواعدك:
1. **Hook قوي** — أول جملة من الإعلان لازم تخلي الواحد يقف. سؤال،
   ادعاء جريء، رقم محدد، أو موقف يتماهى معاه.
2. **Benefit not Feature** — متقولش "WPC مقاوم للماء". قول "خشب
   حمامك ميتدمرش بعد ٦ شهور".
3. **القيود من المنصة**:
   - Meta: headline ≤ 40 حرف، primary text ≤ 125 حرف
   - Google Search: headline 30 حرف × 3، description 90 × 2
   - TikTok: caption قصير + hook قوي للفيديو
4. **CTA واضح** — مش 'تواصل معنا' فقط. 'كلمنا واتساب لطلب الكتالوج'.
5. **3-8 variants** — متشابهة في الـ benefit لكن مختلفة في:
   - Hook (سؤال / موقف / رقم / تحدي)
   - الـ format (image / carousel / video / story)
   - الـ tone (رسمي / غير رسمي / تحدي / استفهام)
6. **مصري طبيعي** — مفيش "إذن" و "حيث" و "حينما". قول "يعني" و "علشان"
   و "لما".
7. **الـ creative_concept** — صورة اللي هيتم تصميمها أو السيناريو
   لو فيديو. حدد بدقة: مين في الكادر، ايه الفعل، ايه الإضاءة، ايه
   الخلفية.`;

export async function generateAdCopy(input: {
  product_summary: string;
  persona?: Persona | null;
  platforms: ("meta" | "google" | "tiktok" | "instagram")[];
  goal: string; // awareness / leads / sales / etc.
  count?: number;
}): Promise<AdCreativesResponse> {
  const personaStr = input.persona
    ? `\n\n**الـ Persona المستهدف:**\n${JSON.stringify(input.persona, null, 0)}`
    : "";
  const userPrompt = `**المنتج:** ${input.product_summary}
**الهدف:** ${input.goal}
**المنصات:** ${input.platforms.join(", ")}
**عدد الإعلانات المطلوبة:** ${input.count ?? 5}${personaStr}

اكتب ${input.count ?? 5} إعلانات مختلفة (variants) للمنصات المحددة.
كل إعلان: headline + body + cta + creative_concept. ركّز على التحويل.`;

  return callWithFallback(async (picked) => {
    const { object } = await generateObject({
      maxRetries: 0, // we do our own retry through callWithFallback
      model: picked.model,
      schema: adCreativesResponseSchema,
      system: AD_COPY_SYSTEM,
      prompt: userPrompt,
      temperature: 0.85,
    });
    return object;
  });
}

// ----------------------------------------------------------------------------
// 4) SEO MASTER — keyword research + content strategy
// ----------------------------------------------------------------------------

export const keywordSchema = z.object({
  keyword: z.string().describe("الكلمة المفتاحية بالعربي (مثلاً 'ألواح pvc')"),
  intent: z.enum(["informational", "commercial", "transactional", "navigational"]),
  search_volume_estimate: z
    .number()
    .int()
    .nullable()
    .describe("تقدير حجم البحث الشهري في مصر. null لو غير معلوم"),
  difficulty_estimate: z
    .number()
    .int()
    .min(0)
    .max(100)
    .nullable()
    .describe("صعوبة الترتيب 0-100. null لو غير معلوم"),
  content_type: z.enum([
    "blog_post",
    "product_page",
    "landing_page",
    "category_page",
    "faq",
    "guide",
    "comparison",
  ]),
  suggested_title: z
    .string()
    .max(70)
    .describe("عنوان مقترح للصفحة (≤ 60 حرف للـ SEO)"),
  content_outline: z
    .string()
    .describe("مخطط مختصر: H1 + 3-5 sections رئيسية"),
  priority: z
    .number()
    .int()
    .min(1)
    .max(10)
    .describe("أولوية تنفيذ المحتوى (1=الأعلى)"),
});

export const keywordsResponseSchema = z.object({
  keywords: z.array(keywordSchema).min(10).max(25),
  quick_wins: z
    .array(z.string())
    .describe(
      "كلمات منخفضة الصعوبة وعالية النية — مكاسب سريعة في أسبوعين",
    ),
  long_term_focus: z
    .array(z.string())
    .describe(
      "كلمات صعبة لكن مهمة — هتاخد 3-6 شهور لكن عائدها كبير",
    ),
  content_strategy: z
    .string()
    .describe(
      "نصيحة استراتيجية عامة عن التركيز والإيقاع وعدد المقالات الشهرية",
    ),
});

export type KeywordRow = z.infer<typeof keywordSchema>;
export type KeywordsResponse = z.infer<typeof keywordsResponseSchema>;

const SEO_SYSTEM = `أنت Head of SEO في وكالة digital مصرية كبيرة، عملت SEO لـ 200+
شركة في القطاعات المختلفة. عارف عميق بإن المصري بيبحث ازاي،
وايه الكلمات اللي تجيب trafficبجد، وايه اللي مضيعة وقت.

قواعدك:
1. **كلمات بلهجة البحث** — لو المنتج 'ألواح PVC'، الناس بتبحث:
   'الواح pvc' (بالعربي), 'pvc panels' (بالإنجليزي), 'حوائط pvc',
   'الواح بلاستيك للحوائط'. كلهم كلمات قانونية + لازم نستهدفهم.
2. **اخلط Informational + Commercial** — في كل قائمة لازم يكون فيه
   كلمات معلوماتية (informational) + كلمات شرائية (commercial). الأولى
   تجيب جمهور، الثانية تحوّل لمبيعات.
3. **Difficulty واقعي** — كلمات كتير في السوق المصري low difficulty
   لأن المنافسة محدودة بالمحتوى العربي الجيد. متخليش الـ difficulty
   مبالغ فيها.
4. **Content Strategy** — اعتمد على الـ "Topic Cluster" approach:
   pillar page + 5-10 supporting articles.
5. **Quick Wins واضحة** — لو موجود كلمات difficulty < 30 + commercial
   intent، حطها في quick_wins. ده اللي يبدأ بيه العميل.
6. **مفيش fluff** — كل keyword لها مبرر تجاري. لو حد محتاج keyword
   لكلمة مالهاش علاقة بالمنتج، متضفهاش.`;

export async function suggestKeywords(input: {
  product_summary: string;
  industry?: string | null;
  current_url?: string | null;
}): Promise<KeywordsResponse> {
  const userPrompt = `**المنتج/الخدمة:** ${input.product_summary}
${input.industry ? `**الصناعة:** ${input.industry}` : ""}
${input.current_url ? `**موقع الشركة الحالي:** ${input.current_url}` : ""}

ابني SEO strategy كاملة للسوق المصري:
- 10-25 keyword strategy مرتبة بالأولوية
- Quick wins (كلمات هتجيب نتيجة في 30 يوم)
- Long-term focus (كلمات هي اللي هتاخد العميل لـ #1)
- استراتيجية محتوى عامة`;

  return callWithFallback(async (picked) => {
    const { object } = await generateObject({
      maxRetries: 0, // we do our own retry through callWithFallback
      model: picked.model,
      schema: keywordsResponseSchema,
      system: SEO_SYSTEM,
      prompt: userPrompt,
      temperature: 0.5,
    });
    return object;
  });
}

// ----------------------------------------------------------------------------
// 5) PAGE DOCTOR — audit Facebook/Instagram/Website for ad-killer issues
// ----------------------------------------------------------------------------
// Diagnoses problems that ruin paid ad performance — even great ads
// won't convert if the landing destination has these issues. Produces
// a prioritized fix list with concrete actions.

export const pageDoctorIssueSchema = z.object({
  category: z.enum([
    "branding",
    "content",
    "trust",
    "speed",
    "conversion",
    "engagement",
    "completeness",
    "legal",
  ]),
  severity: z.enum(["critical", "high", "medium", "low"]),
  issue_title: z.string().describe("عنوان قصير للمشكلة"),
  problem_description: z
    .string()
    .describe("شرح للمشكلة وتأثيرها على الإعلان الممول"),
  ad_impact: z
    .string()
    .describe("بالظبط الإعلان هيتأذى ازاي بسبب المشكلة دي (CPC أعلى، CTR أقل، CPA أعلى...)"),
  fix_steps: z
    .array(z.string())
    .min(2)
    .describe("خطوات عملية للإصلاح، مرقّمة"),
  estimated_effort: z
    .enum(["5_minutes", "30_minutes", "1_hour", "half_day", "1_day", "1_week"])
    .describe("تقدير الوقت اللازم للإصلاح"),
  estimated_impact: z
    .string()
    .describe("لو اتعمل الإصلاح، توقّع التحسّن في الأداء (نسبة أو وصف)"),
});

export const pageDoctorResponseSchema = z.object({
  overall_health_score: z
    .number()
    .int()
    .min(0)
    .max(100)
    .describe("درجة الصحة الإجمالية للصفحة (0-100)"),
  health_summary: z
    .string()
    .describe("ملخص حالة الصفحة في فقرة قصيرة"),
  issues: z.array(pageDoctorIssueSchema).min(3).max(15),
  quick_wins: z
    .array(z.string())
    .describe("3-5 تحسينات سريعة (≤30 دقيقة) ذات أثر فوري على الإعلان"),
  blockers: z
    .array(z.string())
    .describe(
      "مشاكل خطيرة لازم تتحل قبل ما تشغّل أي إعلان ممول (مثلاً: مفيش رقم تواصل واضح، مفيش صور للمنتج، الصفحة فيها بلاغات)",
    ),
  pre_launch_checklist: z
    .array(z.string())
    .describe("شيك ليست تتحقق منها قبل ضغط 'Publish' على أي حملة"),
});

export type PageDoctorIssue = z.infer<typeof pageDoctorIssueSchema>;
export type PageDoctorResponse = z.infer<typeof pageDoctorResponseSchema>;

const PAGE_DOCTOR_SYSTEM = `أنت Conversion Rate Optimization (CRO) Expert + Paid Social Auditor
في وكالة Big Agency، خبرة 12 سنة في تشخيص ليه الإعلانات بتفشل.
المشاكل اللي بتقتل الحملات الإعلانية لكن أصحاب الشركات بيتجاهلوها:

CATEGORY GUIDE:
- branding: لوجو ضعيف، ألوان متنافرة، تنسيق غير احترافي
- content: صور قليلة، فيديوهات ضعيفة، نص غير واضح
- trust: مفيش reviews، مفيش social proof، مفيش رقم اتصال واضح
- speed: الصفحة بطيئة، صور ثقيلة (يخفض الـ Quality Score)
- conversion: مفيش CTA واضح، طرق التواصل صعبة، landing page معطّلة
- engagement: تفاعل قليل على البوستات، رد بطيء على الرسائل
- completeness: معلومات ناقصة، مفيش About، مفيش ساعات عمل
- legal: مفيش سياسة خصوصية، شروط استخدام، meta verification

قواعدك:
1. **عميقة، لا سطحية** — متقولش "حسّن الصفحة". قول "أضف 5 صور
   احترافية للمنتج بحد أدنى 1080×1080 px + اكتب alt text مفصّل لكل
   صورة عشان Facebook algorithm يفهم محتواها."

2. **ربط مع الإعلان** — لكل مشكلة، اشرح بالظبط الإعلان هيتأذى ازاي:
   - CTR أقل (الناس مش بتضغط)
   - CPC أعلى (الـ Quality Score بيهبط)
   - CPA أعلى (الناس بتضغط لكن مش بتكمل)
   - Reach أقل (الـ algorithm بيخفّض priority الصفحة)
   - Account restricted (مشاكل قانونية)

3. **خطوات مرقّمة وعملية** — كل step كان واحد يقدر ينفذه. متقولش
   "احسّن السرعة"، قول:
   - استخدم TinyPNG.com لضغط كل الصور
   - افتح PageSpeed Insights واتبع التوصيات
   - فعّل Lazy Loading في WordPress من Settings > Reading

4. **Quick Wins حقيقية** — مهام ≤30 دقيقة ليها تأثير فوري:
   - تحديث صورة الـ Cover للصفحة
   - إضافة رقم واتساب في About
   - إخفاء رسائل التشات السلبية
   - حذف بوست قديم بنتائج ضعيفة

5. **Blockers صريحة** — لو في حاجة بتمنع إطلاق الإعلان أصلاً
   (مثلاً: page restricted، حذف صفحة، مفيش payment method), حطها
   في blockers.

6. **عربي عملي** — مفيش "بدا الأمر مستلزماً". قول "في مشكلة"
   و "محتاج تعمل كذا".`;

export async function diagnosePagesIssues(input: {
  product_summary: string;
  page_info: string;
  facebook_url?: string | null;
  instagram_url?: string | null;
  website_url?: string | null;
  current_issues?: string | null;
}): Promise<PageDoctorResponse> {
  // Fetch real evidence from each URL the user provided. Parallel so a
  // slow Facebook crawler doesn't block the Instagram fetch. All three
  // calls have a 10s ceiling enforced inside fetchPageEvidence, so worst
  // case the whole evidence-gathering step takes ~10s.
  const [fbEvidence, igEvidence, webEvidence] = await Promise.all([
    input.facebook_url ? fetchPageEvidence(input.facebook_url) : null,
    input.instagram_url ? fetchPageEvidence(input.instagram_url) : null,
    input.website_url ? fetchPageEvidence(input.website_url) : null,
  ]);

  const evidenceBlock = buildEvidenceBlock({
    facebook: fbEvidence,
    instagram: igEvidence,
    website: webEvidence,
  });

  const userPrompt = `**المنتج/الخدمة:** ${input.product_summary}

${
  evidenceBlock
    ? `**الأدلة الفعلية المستخرجة من الصفحات (مهم: اعتمد عليها أساساً):**
${evidenceBlock}

`
    : ""
}**ما قاله صاحب الشركة عن صفحته:**
${input.page_info}

${input.current_issues ? `**مشاكل لاحظها صاحب الشركة:**\n${input.current_issues}\n\n` : ""}اعمل تشخيص شامل للصفحة من منظور paid ads expert: أين المشاكل اللي
هتقلل من أداء الإعلانات الممولة، وإزاي يصلحها خطوة بخطوة. الهدف:
صاحب الشركة يطلع بـ action list يقدر يطبقه قبل ما يطلق أي إعلان جديد.

**قواعد ملزمة:**
- لكل issue تذكره، ابدأ الـ problem_description بـ "بناءً على الفحص:"
  ثم اقتبس البيانة الفعلية اللي شفتها (مثلاً: "title صفحتك = 'بدون عنوان'
  وطوله 14 حرف").
- لو الفحص ما رجعش بيانات (fetched=false أو login wall) لـ صفحة معينة،
  قول صراحة "تعذّر فحص هذه الصفحة" بدل ما تخمن.
- متطّلعش "issues" generic زي "ضيف صور للمنتج" بدون دليل من الـ evidence.
- ابني الـ pre_launch_checklist من البيانات الناقصة فعلاً، مش checklist عام.`;

  return callWithFallback(async (picked) => {
    const { object } = await generateObject({
      maxRetries: 0, // we do our own retry through callWithFallback
      model: picked.model,
      schema: pageDoctorResponseSchema,
      system: PAGE_DOCTOR_SYSTEM,
      prompt: userPrompt,
      temperature: 0.2, // even lower — evidence-bound diagnostics shouldn't drift
    });
    return object;
  });
}

/**
 * Build a compact, human-readable evidence block for the AI prompt.
 * Skips sections with null evidence. Format is plain Arabic-friendly
 * markdown so the AI doesn't have to parse JSON.
 */
function buildEvidenceBlock(input: {
  facebook: Awaited<ReturnType<typeof fetchPageEvidence>> | null;
  instagram: Awaited<ReturnType<typeof fetchPageEvidence>> | null;
  website: Awaited<ReturnType<typeof fetchPageEvidence>> | null;
}): string {
  const parts: string[] = [];
  if (input.facebook) parts.push(renderEvidence("Facebook", input.facebook));
  if (input.instagram) parts.push(renderEvidence("Instagram", input.instagram));
  if (input.website) parts.push(renderEvidence("Website", input.website));
  return parts.join("\n\n");
}

function renderEvidence(
  label: string,
  e: Awaited<ReturnType<typeof fetchPageEvidence>>,
): string {
  if (!e.fetched) {
    return `▼ ${label}:
  ❌ تعذّر الوصول: ${e.fetch_error ?? "خطأ غير معروف"}`;
  }
  const lines: string[] = [`▼ ${label}:`];
  lines.push(`  • URL النهائي: ${e.final_url ?? "—"}`);
  lines.push(`  • HTTP status: ${e.status_code ?? "—"}`);
  if (e.fetch_time_ms !== undefined) {
    lines.push(`  • وقت التحميل: ${e.fetch_time_ms}ms ${e.fetch_time_ms > 3000 ? "⚠ بطيء" : ""}`);
  }
  if (e.page_weight_kb !== undefined) {
    lines.push(`  • حجم الصفحة: ${e.page_weight_kb} KB`);
  }
  lines.push(`  • HTTPS: ${e.is_https ? "نعم ✓" : "❌ HTTP فقط"}`);
  if (e.hit_login_wall) {
    lines.push(`  • ⚠ ظهرت شاشة تسجيل دخول (login wall) — الفحص محدود`);
  }
  if (e.platform_note) lines.push(`  • ملاحظة المنصة: ${e.platform_note}`);

  // Document metadata
  lines.push("");
  lines.push(`  ── Meta tags ──`);
  lines.push(`  • <title>: ${e.title ? `"${e.title}" (${e.title_length} حرف)` : "❌ مفقود"}`);
  lines.push(
    `  • meta description: ${
      e.meta_description
        ? `"${e.meta_description}" (${e.meta_description_length} حرف)`
        : "❌ مفقود"
    }`,
  );
  lines.push(`  • canonical URL: ${e.canonical_url ?? "❌ غير محدد"}`);
  lines.push(`  • html lang: ${e.html_lang ?? "❌ غير محدد"}`);
  lines.push(`  • viewport meta: ${e.has_viewport ? "موجود ✓" : "❌ مفقود (مش mobile-friendly)"}`);
  lines.push(`  • favicon: ${e.has_favicon ? "موجود ✓" : "❌ مفقود"}`);

  // Social cards
  lines.push("");
  lines.push(`  ── Open Graph / Twitter ──`);
  lines.push(`  • og:title: ${e.og_title ?? "❌ مفقود"}`);
  lines.push(`  • og:description: ${e.og_description ?? "❌ مفقود"}`);
  lines.push(`  • og:image: ${e.og_image ?? "❌ مفقود (link previews هتطلع بدون صورة)"}`);
  lines.push(`  • twitter:card: ${e.twitter_card ?? "❌ مفقود"}`);
  if (e.has_schema_org) {
    lines.push(`  • schema.org: ${e.schema_org_types?.join(", ") ?? "—"} ✓`);
  } else {
    lines.push(`  • schema.org: ❌ غير موجود`);
  }

  // Content structure
  lines.push("");
  lines.push(`  ── Content structure ──`);
  lines.push(
    `  • H1 count: ${e.h1_count}${e.h1_count !== 1 ? ` ⚠ (المفضل واحد)` : ""}`,
  );
  if (e.first_h1) lines.push(`  • First H1 text: "${e.first_h1}"`);
  lines.push(`  • Total headings: ${e.total_headings}`);
  lines.push(
    `  • Images: ${e.image_count}${
      e.images_missing_alt && e.images_missing_alt > 0
        ? ` ⚠ (${e.images_missing_alt} بدون alt text)`
        : ""
    }`,
  );
  lines.push(`  • Links: ${e.link_count}`);
  lines.push(`  • External scripts: ${e.external_script_count}`);
  lines.push(`  • External stylesheets: ${e.external_stylesheet_count}`);

  return lines.join("\n");
}

// ----------------------------------------------------------------------------
// 6) CAMPAIGN STRATEGY — orchestrates personas + ads + budget
// ----------------------------------------------------------------------------

export const campaignStrategySchema = z.object({
  campaign_name: z.string().describe("اسم الحملة بالعربي"),
  recommended_goal: z.enum([
    "awareness",
    "engagement",
    "leads",
    "sales",
    "traffic",
    "messages",
  ]),
  budget_allocation: z.array(
    z.object({
      platform: z.string(),
      percentage: z.number().min(0).max(100),
      rationale: z.string(),
    }),
  ),
  daily_budget_recommendation: z.object({
    minimum_to_learn: z
      .number()
      .describe("الحد الأدنى ليوم واحد عشان الـ algorithm يفهم (EGP)"),
    recommended_daily: z.number().describe("الميزانية اليومية المقترحة (EGP)"),
    ideal_test_period_days: z
      .number()
      .int()
      .describe("عدد أيام الـ test phase قبل التقييم"),
  }),
  phases: z.array(
    z.object({
      phase_name: z.string(),
      duration_days: z.number().int(),
      goal: z.string(),
      tactics: z.array(z.string()),
      kpis: z.array(z.string()),
    }),
  ),
  expected_outcomes: z.object({
    impressions_range: z.string(),
    clicks_range: z.string(),
    leads_or_sales_range: z.string(),
    expected_cpa_egp: z.string().describe("Cost Per Action (EGP) المتوقع"),
  }),
  risks_to_watch: z.array(z.string()),
  next_steps: z.array(z.string()),
});

export type CampaignStrategy = z.infer<typeof campaignStrategySchema>;

const CAMPAIGN_SYSTEM = `أنت Performance Marketing Director في وكالة كبيرة، 10 سنين خبرة
في تحويل ميزانيات الإعلانات لمبيعات حقيقية. متخصص في السوق المصري
وعارف معدلات الـ CPC والـ CPA الفعلية في كل صناعة.

قواعدك:
1. **Budget Allocation منطقي** — لو المنتج commerce وعنده visual
   appeal، Meta + Instagram أول. لو B2B / SaaS، LinkedIn + Google.
2. **Test Phase أولاً** — أول 7-14 يوم 30% من الميزانية لـ testing
   creatives. الباقي للـ scale بعد ما نعرف اللي شغّال.
3. **Daily Budget Realistic** — في مصر:
   - Meta: 100-200 EGP/يوم لـ small test, 500-1500 EGP/يوم للـ scale
   - Google: 150-300 EGP/يوم small, 600-2000 للـ scale
   - TikTok: 200 EGP/يوم minimum (الـ algorithm محتاج بيانات أكتر)
4. **Phases مرحلية** — Awareness → Engagement → Conversion. متبدأش
   بـ direct sales لـ audience cold.
5. **CPA توقعات صادقة** — لو المنتج بـ 5000 EGP في صناعة مكتظة،
   CPA متوقع 200-500 EGP/lead. متبيعش وهم بـ 50 EGP/lead.`;

export async function generateCampaignStrategy(input: {
  product_summary: string;
  goal: string;
  total_budget: number;
  duration_days: number;
  personas?: Persona[];
  platforms?: string[];
}): Promise<CampaignStrategy> {
  const personasStr = input.personas?.length
    ? `\n\n**الـ Personas:**\n${JSON.stringify(input.personas, null, 0)}`
    : "";
  const userPrompt = `**المنتج/الخدمة:** ${input.product_summary}
**الهدف:** ${input.goal}
**الميزانية الإجمالية:** ${input.total_budget} EGP
**المدة:** ${input.duration_days} يوم
${input.platforms?.length ? `**منصات يفضّلها العميل:** ${input.platforms.join(", ")}` : ""}${personasStr}

ابني استراتيجية حملة كاملة:
- توزيع الميزانية بين المنصات
- الميزانية اليومية المقترحة + فترة الـ test
- المراحل (Test → Scale → Optimize)
- التوقعات الواقعية + المخاطر
- Next steps`;

  return callWithFallback(async (picked) => {
    const { object } = await generateObject({
      maxRetries: 0,
      model: picked.model,
      schema: campaignStrategySchema,
      system: CAMPAIGN_SYSTEM,
      prompt: userPrompt,
      temperature: 0.5,
    });
    return object;
  });
}

// ----------------------------------------------------------------------------
// 6) AD COPY GENERATOR — platform-specific ad copy with character limits
// ----------------------------------------------------------------------------
// MIT-licensed prompt patterns adapted from OpenAdKit.
// Generates 3 variants per platform with platform-validated character counts.

const PLATFORM_SPECS: Record<string, { primary: number; headline: number; desc: number }> = {
  meta: { primary: 125, headline: 27, desc: 27 },
  google: { primary: 90, headline: 30, desc: 90 },
  tiktok: { primary: 150, headline: 35, desc: 30 },
  linkedin: { primary: 150, headline: 70, desc: 70 },
};

const PLATFORM_AD_COPY_SYSTEM = `أنت Senior Copywriter في وكالة إعلانات كبرى، 12 سنة خبرة
في كتابة إعلانات تحوّل (high-converting ads) للماركات العالمية والعربية.
خبير في السيكولوجي الإعلاني: pain points, desire triggers, social proof, 
urgency, FOMO.

مبادئك الأساسية:
1. أول 125 حرف هي اللي تمسك العميل — front-load the hook
2. كل platform ليها character limits محددة — تخلفها ممنوع
3. اكتب 3 variants بزوايا مختلفة: pain → desire → social proof
4. استخدم لغة السوق المستهدف (عامية / فصحى حسب السياق)
5. CTA واضح ومباشر — مش عمومي`;

export const adCopyVariantSchema = z.object({
  angle: z.enum(["pain", "desire", "social-proof", "urgency", "fomo"]).describe("الزاوية التسويقية"),
  primary_text: z.string().describe("النص الرئيسي — أول 125 حرف لازم يكون hook قوي"),
  headline: z.string().describe("العنوان"),
  description: z.string().describe("الوصف"),
  cta: z.string().describe("زر الحث على الإجراء (مثال: اطلب دلوقتي، اعرف أكتر، اشترك)"),
  char_counts: z.object({
    primary: z.number(),
    headline: z.number(),
    description: z.number(),
  }),
});

export const adCopySchema = z.object({
  platform_used: z.string(),
  variants: z.array(adCopyVariantSchema).min(3).max(5),
});

export type AdCopyResult = z.infer<typeof adCopySchema>;

export async function generatePlatformAdCopy(input: {
  platform: keyof typeof PLATFORM_SPECS;
  product: string;
  objective: string;
  audience: string;
  tone: string;
  cta: string;
  extra_context?: string;
}): Promise<AdCopyResult> {
  const specs = PLATFORM_SPECS[input.platform] ?? PLATFORM_SPECS.meta;
  const userPrompt = `**المنصة:** ${input.platform}
**المنتج/الخدمة:** ${input.product}
**الهدف الإعلاني:** ${input.objective}
**الجمهور المستهدف:** ${input.audience}
**نبرة الصوت:** ${input.tone}
**ـCTA المطلوب:** ${input.cta}
${input.extra_context ? `\n**سياق إضافي:** ${input.extra_context}` : ""}

**Character Limits للمنصة (${input.platform}):**
- النص الرئيسي: ${specs.primary} حرف للـ hook, max ${specs.primary * 2}
- العنوان: ${specs.headline} حرف max
- الوصف: ${specs.desc} حرف max

اطلب 3 variants بزوايا مختلفة (pain, desire, social-proof). 
لكل variant: primary_text + headline + description + cta + char_counts اللي تتأكد إنها جوه الـ limits.
لو أي variant تجاوز الـ limits، اكتب نسخة مختصرة في نفس الحقل.
Variant الأول يبقى pain-point lead، التاني desire/aspiration، التالت social proof / FOMO.`;

  return callWithFallback(async (picked) => {
    const { object } = await generateObject({
      maxRetries: 0,
      model: picked.model,
      schema: adCopySchema,
      system: PLATFORM_AD_COPY_SYSTEM,
      prompt: userPrompt,
      temperature: 0.7,
    });
    return object;
  });
}

// ============================================================================
// AI CMO — Okara-style autonomous marketing analysis suite
// ============================================================================
//
// 6 agents mirroring Okara's AI CMO:
//   1. Brand Profile — URL analysis → brand DNA
//   2. SEO Audit — on-page SEO analysis + recommendations
//   3. GEO Analysis — AI search visibility (ChatGPT, Perplexity, Gemini)
//   4. Content Strategy — topics, calendar, formats
//   5. Social Posts — X, LinkedIn, Reddit drafts
//   6. Full Marketing Plan — unified strategy
//
// All use callWithFallback (Groq → Gemini) for reliability.

// ---------------------------------------------------------------------------
// 6a) Brand Profile — analyze any URL and extract brand DNA
// ---------------------------------------------------------------------------

export const brandProfileSchema = z.object({
  brand_name: z.string(),
  tagline: z.string().describe("شعار العلامة التجارية (جملة واحدة)"),
  description: z.string().describe("وصف الشركة ومنتجاتها (2-3 جمل)"),
  industry: z.string(),
  target_audience: z.array(z.string()).describe("الجمهور المستهدف"),
  unique_selling_points: z.array(z.string()).describe("نقاط القوة الفريدة"),
  tone_of_voice: z.string().describe("نبرة الصوت المناسبة"),
  competitors: z.array(z.string()).describe("المنافسون الرئيسيون"),
  marketing_gaps: z.array(z.string()).describe("فرص تسويقية غير مستغلة"),
  suggested_channels: z.array(z.string()).describe("قنوات التسويق الأنسب"),
});

export type BrandProfile = z.infer<typeof brandProfileSchema>;

const BRAND_PROFILE_SYSTEM = `أنت مدير تسويق رقمي خبير. تحلل أي موقع إلكتروني وتستخرج
العلامة التجارية: الجمهور، نقاط القوة، المنافسون، الفجوات التسويقية.`;

export async function generateBrandProfile(
  siteContent: string,
  url: string,
): Promise<BrandProfile> {
  return callWithFallback(async (picked) => {
    const { object } = await generateObject({
      maxRetries: 0,
      model: picked.model,
      schema: brandProfileSchema,
      system: BRAND_PROFILE_SYSTEM,
      prompt: `حلل هذا الموقع الإلكتروني واستخرج العلامة التجارية:\n\nالرابط: ${url}\n\nمحتوى الموقع:\n${siteContent.slice(0, 8000)}`,
      temperature: 0.3,
    });
    return object;
  });
}

// ---------------------------------------------------------------------------
// 6b) SEO Audit — on-page SEO analysis + recommendations
// ---------------------------------------------------------------------------

export const seoAuditSchema = z.object({
  overall_score: z.number().min(0).max(100),
  title_tag: z.object({
    found: z.boolean(),
    content: z.string().optional(),
    score: z.number().min(0).max(100),
    recommendation: z.string(),
  }),
  meta_description: z.object({
    found: z.boolean(),
    content: z.string().optional(),
    score: z.number().min(0).max(100),
    recommendation: z.string(),
  }),
  headings: z.object({
    h1_count: z.number(),
    structure_score: z.number().min(0).max(100),
    recommendation: z.string(),
  }),
  content_quality: z.object({
    score: z.number().min(0).max(100),
    word_count_estimate: z.number(),
    recommendation: z.string(),
  }),
  keywords: z.array(z.object({
    keyword: z.string(),
    volume_estimate: z.string(),
    difficulty_estimate: z.string(),
    priority: z.enum(["high", "medium", "low"]),
  })).min(3).max(10),
  quick_wins: z.array(z.string()).describe("تحسينات سريعة ممكنة اليوم"),
  detailed_recommendations: z.array(z.string()),
});

export type SEOAudit = z.infer<typeof seoAuditSchema>;

const CMO_SEO_SYSTEM = `أنت خبير SEO محترف. تحلل مواقع وتقدم recommendations
دقيقة قابلة للتنفيذ. تعرف معايير تحسين محركات البحث الحديثة.`;

export async function generateSEOAudit(
  siteContent: string,
  url: string,
): Promise<SEOAudit> {
  return callWithFallback(async (picked) => {
    const { object } = await generateObject({
      maxRetries: 0,
      model: picked.model,
      schema: seoAuditSchema,
      system: CMO_SEO_SYSTEM,
      prompt: `حلل الـ SEO للموقع التالي:\n\nالرابط: ${url}\n\nالمحتوى:\n${siteContent.slice(0, 8000)}\n\nقيّم: title tag, meta description, headings, quality, واقترح كلمات مفتاحية.`,
      temperature: 0.3,
    });
    return object;
  });
}

// ---------------------------------------------------------------------------
// 6c) GEO Analysis — AI search visibility (like Okara's GEO agent)
// ---------------------------------------------------------------------------

export const geoAnalysisSchema = z.object({
  geo_score: z.number().min(0).max(100).describe("مدى ظهور العلامة في نتائج AI"),
  visibility_summary: z.string().describe("تلخيص وضع الظهور في محركات AI"),
  chatgpt_visibility: z.object({
    score: z.number().min(0).max(100),
    recommendation: z.string(),
  }),
  perplexity_visibility: z.object({
    score: z.number().min(0).max(100),
    recommendation: z.string(),
  }),
  gemini_visibility: z.object({
    score: z.number().min(0).max(100),
    recommendation: z.string(),
  }),
  claude_visibility: z.object({
    score: z.number().min(0).max(100),
    recommendation: z.string(),
  }),
  optimization_tips: z.array(z.string()).describe("نصائح لتحسين الظهور في AI search"),
  content_types_needed: z.array(z.string()).describe("أنواع محتوى ضرورية للظهور في AI"),
});

export type GEOAnalysis = z.infer<typeof geoAnalysisSchema>;

const GEO_SYSTEM = `أنت خبير GEO (Generative Engine Optimization). تفهم كيف
تظهر العلامات التجارية في ChatGPT, Perplexity, Gemini, Claude.
تعرف عوامل الترجيح: citation authority, structured data, topical depth.`;

export async function generateGEOAnalysis(
  brand: BrandProfile,
): Promise<GEOAnalysis> {
  return callWithFallback(async (picked) => {
    const { object } = await generateObject({
      maxRetries: 0,
      model: picked.model,
      schema: geoAnalysisSchema,
      system: GEO_SYSTEM,
      prompt: `حلل ظهور العلامة التجارية التالية في محركات البحث AI:\n\nاسم العلامة: ${brand.brand_name}\nالوصف: ${brand.description}\nالصناعة: ${brand.industry}\nالجمهور: ${brand.target_audience.join(", ")}\nنقاط القوة: ${brand.unique_selling_points.join(", ")}\n\nقيّم ظهورها في ChatGPT, Perplexity, Gemini, Claude وقدم recommendations.`,
      temperature: 0.4,
    });
    return object;
  });
}

// ---------------------------------------------------------------------------
// 6d) Content Strategy — topics, calendar, formats
// ---------------------------------------------------------------------------

export const contentStrategySchema = z.object({
  content_pillars: z.array(z.object({
    pillar: z.string().describe("محور المحتوى"),
    topics: z.array(z.string()).min(3).max(6),
    recommended_formats: z.array(z.string()),
    target_platform: z.string(),
  })).min(3).max(5),
  content_calendar: z.array(z.object({
    day: z.string(),
    topic: z.string(),
    format: z.string(),
    platform: z.string(),
    angle: z.string(),
  })).min(7).max(14).describe("خطة محتوى لأسبوعين"),
  blog_ideas: z.array(z.object({
    title: z.string(),
    seo_keyword: z.string(),
    estimated_word_count: z.number(),
    angle: z.string(),
  })).min(3).max(6),
  content_gaps: z.array(z.string()).describe("ثغرات محتوى ممكن تسدها"),
});

export type ContentStrategy = z.infer<typeof contentStrategySchema>;

const CONTENT_SYSTEM = `أنت Content Strategy Director. تخطط لمحتوى تسويقي متكامل
يشمل: blog posts, social media, video, podcasts. تعرف الـ content pillars
وازاي تبني editorial calendar يحقق أهداف العلامة التجارية.`;

export async function generateContentStrategy(
  brand: BrandProfile,
): Promise<ContentStrategy> {
  return callWithFallback(async (picked) => {
    const { object } = await generateObject({
      maxRetries: 0,
      model: picked.model,
      schema: contentStrategySchema,
      system: CONTENT_SYSTEM,
      prompt: `ابني استراتيجية محتوى كاملة للعلامة:\n\n${JSON.stringify(brand, null, 0)}\n\nشمل: content pillars, topics, editorial calendar لأسبوعين, blog ideas.`,
      temperature: 0.6,
    });
    return object;
  });
}

// ---------------------------------------------------------------------------
// 6e) Social Posts — X, LinkedIn, Reddit drafts (Okara's X/HN/Reddit agents)
// ---------------------------------------------------------------------------

export const socialPostSchema = z.object({
  platform: z.enum(["x", "linkedin", "reddit", "hackernews"]),
  variant: z.string().describe("A/B/C"),
  post_text: z.string(),
  thread: z.array(z.string()).optional().describe("خيوط Tweet/X thread"),
  best_time: z.string().optional().describe("أفضل وقت للنشر"),
  hashtags: z.array(z.string()).optional(),
  engagement_hook: z.string().optional().describe("جملة لجذب التفاعل"),
});

export const socialPlanSchema = z.object({
  x_plan: z.object({
    posts: z.array(socialPostSchema).min(3).max(7),
    strategy: z.string().describe("استراتيجية التواجد على X"),
  }),
  linkedin_plan: z.object({
    posts: z.array(socialPostSchema).min(2).max(5),
    strategy: z.string(),
  }),
  reddit_plan: z.object({
    posts: z.array(socialPostSchema).min(2).max(5),
    subreddits: z.array(z.string()),
    strategy: z.string(),
  }),
});

export type SocialPlan = z.infer<typeof socialPlanSchema>;

const SOCIAL_SYSTEM = `أنت Social Media Marketing Director. تكتب منشورات
تسويقية احترافية لمنصات X, LinkedIn, Reddit. كل platform ليها أسلوبها:
- X: قصير، حاد، viral hooks
- LinkedIn: طويل، قيادة فكرية، case studies
- Reddit: قصة شخصية، قيمة حقيقية، مش سيلز
- Hacker News: تقني، عميق، transparent`;

export async function generateSocialPlan(
  brand: BrandProfile,
): Promise<SocialPlan> {
  return callWithFallback(async (picked) => {
    const { object } = await generateObject({
      maxRetries: 0,
      model: picked.model,
      schema: socialPlanSchema,
      system: SOCIAL_SYSTEM,
      prompt: `ابني خطة منشورات سوشيال ميديا لـ:\n\n${JSON.stringify(brand, null, 0)}\n\nاكتب منشورات لـ X, LinkedIn, Reddit (2-5 لكل platform) مع استراتيجية كل platform.`,
      temperature: 0.7,
    });
    return object;
  });
}

// ---------------------------------------------------------------------------
// 6f) Full Marketing Plan — unified strategy (Okara CMO output)
// ---------------------------------------------------------------------------

export const fullMarketingPlanSchema = z.object({
  executive_summary: z.string().describe("ملخص تنفيذي للخطة"),
  brand_positioning: z.string().describe("الموقع التسويقي المقترح"),
  channel_strategy: z.array(z.object({
    channel: z.string(),
    priority: z.enum(["primary", "secondary", "experimental"]),
    budget_percent: z.number().min(0).max(100),
    tactics: z.array(z.string()),
    kpis: z.array(z.string()),
  })),
  content_plan_summary: z.string().describe("ملخص خطة المحتوى"),
  seo_priorities: z.array(z.string()),
  geo_priorities: z.array(z.string()),
  social_media_approach: z.string(),
  estimated_timeline: z.string().describe("الجدول الزمني المقترح (شهر 1-6)"),
  monthly_budget_egp: z.object({
    min: z.number(),
    max: z.number(),
    breakdown: z.string(),
  }).optional(),
  expected_outcomes: z.array(z.string()).describe("النتائج المتوقعة بعد 3-6 أشهر"),
});

export type FullMarketingPlan = z.infer<typeof fullMarketingPlanSchema>;

const CMO_SYSTEM = `أنت Chief Marketing Officer خبير. 15+ سنة خبرة في بناء
استراتيجيات تسويق متكاملة للعلامات التجارية. بتجمع بين SEO, GEO, content,
social media, والإعلانات في خطة واحدة متماسكة. خطتك دايماً مبنية على
تحليل دقيق للعلامة، الجمهور، والسوق.`;

export async function generateFullMarketingPlan(
  brand: BrandProfile,
  seoAudit: SEOAudit,
  geoAnalysis: GEOAnalysis,
  contentStrategy: ContentStrategy,
  socialPlan: SocialPlan,
): Promise<FullMarketingPlan> {
  const input = JSON.stringify({ brand, seoAudit, geoAnalysis, contentStrategy, socialPlan }, null, 0);
  return callWithFallback(async (picked) => {
    const { object } = await generateObject({
      maxRetries: 0,
      model: picked.model,
      schema: fullMarketingPlanSchema,
      system: CMO_SYSTEM,
      prompt: `اجمع كل التحليلات دي في خطة تسويق متكاملة:\n\n${input.slice(0, 12000)}`,
      temperature: 0.5,
    });
    return object;
  });
}

// ----------------------------------------------------------------------------
// 7) AD AUDITOR — review an EXISTING ad against best practices (native
// replacement for Claude Ads). Pure AI: paste your ad → score + issues +
// concrete fixes + improved Arabic variants. No external account needed.
// ----------------------------------------------------------------------------

export const adAuditSchema = z.object({
  overall_score: z
    .number()
    .int()
    .min(0)
    .max(100)
    .describe("درجة جودة الإعلان من 0 لـ100"),
  verdict: z
    .string()
    .describe("حكم سريع في جملة: ينفع ينزل زي ما هو؟ ولا محتاج تظبيط؟"),
  issues: z
    .array(
      z.object({
        severity: z.enum(["critical", "high", "medium", "low"]),
        area: z.enum([
          "hook",
          "clarity",
          "benefit",
          "cta",
          "targeting",
          "compliance",
          "length",
          "trust",
          "creative",
        ]),
        problem: z.string().describe("المشكلة بالظبط في الإعلان"),
        fix: z.string().describe("الحل العملي — اكتب البديل لو ينفع"),
      }),
    )
    .min(1)
    .max(12),
  improved_variants: z
    .array(
      z.object({
        angle: z.string().describe("زاوية النسخة (ألم/رغبة/دليل اجتماعي...)"),
        primary_text: z.string().describe("النص الرئيسي المحسّن"),
        headline: z.string().describe("عنوان قصير قوي"),
        cta: z.string().describe("زر/دعوة واضحة"),
      }),
    )
    .min(2)
    .max(3),
  quick_wins: z
    .array(z.string())
    .describe("تعديلات سريعة ليها أثر فوري على الأداء"),
});

export type AdAudit = z.infer<typeof adAuditSchema>;

const AD_AUDIT_SYSTEM = `أنت Senior Paid-Ads Auditor في وكالة أداء كبيرة، 12 سنة خبرة في السوق
المصري. شغلتك تراجع إعلان جاهز وتقوله بصراحة: هينجح ولا هيحرق فلوس؟ وليه؟

افحص الإعلان على المحاور دي:
1. **Hook** — أول سطر بيوقف الواحد ولا ممل؟
2. **Benefit not Feature** — بيبيع فايدة للعميل ولا بيوصف المنتج؟
3. **الوضوح** — مفهوم بسرعة ولا فيه لخبطة؟
4. **CTA** — في دعوة واضحة لإجراء محدد؟ (مش «تواصل معنا» بس)
5. **الطول** — مناسب للمنصة؟ (Meta primary ≤125 حرف، العنوان قصير)
6. **الثقة** — في دليل/أرقام/ضمان؟ أو وعود مبالغ فيها تضر؟
7. **الالتزام** — في ادعاءات كاذبة أو كلام ممكن يرفضه إعلان المنصة؟

قواعدك:
- **صريح وعملي** — لكل مشكلة اكتب الحل، ويُفضّل تكتب البديل الجاهز.
- **عربي مصري طبيعي** — مفيش فصحى ثقيلة.
- **درجة واقعية** — لو الإعلان ضعيف اديله درجة واطية وقول ليه.
- **variants محسّنة** — اطلع 2-3 نسخ أحسن بزوايا مختلفة، كل واحدة جاهزة للنسخ.
- متخترعش أرقام أو ادعاءات للمنتج لو مش موجودة في النص الأصلي.`;

export async function auditAd(input: {
  ad_text: string;
  platform: string;
  goal?: string;
  product?: string;
}): Promise<AdAudit> {
  const userPrompt = `**المنصة:** ${input.platform}
${input.goal ? `**هدف الإعلان:** ${input.goal}` : ""}
${input.product ? `**المنتج/الخدمة:** ${input.product}` : ""}

**نص الإعلان المطلوب تدقيقه:**
"""
${input.ad_text.slice(0, 3000)}
"""

راجع الإعلان ده: اديله درجة، اطلّع المشاكل بترتيب الخطورة مع حل لكل واحدة،
واكتب 2-3 نسخ محسّنة جاهزة + أهم quick wins.`;

  return callWithFallback(async (picked) => {
    const { object } = await generateObject({
      maxRetries: 0, // callWithFallback owns the retry chain
      model: picked.model,
      schema: adAuditSchema,
      system: AD_AUDIT_SYSTEM,
      prompt: userPrompt,
      temperature: 0.4,
    });
    return object;
  });
}

// ----------------------------------------------------------------------------
// 8) SEO CONTENT OPTIMIZER — score an article against a target keyword and
// return concrete on-page fixes (native, AI-based replacement for Surfer).
// No SERP scraping: the model reasons about Egyptian search intent + on-page
// SEO best practices from the supplied text.
// ----------------------------------------------------------------------------

export const seoOptimizeSchema = z.object({
  overall_score: z
    .number()
    .int()
    .min(0)
    .max(100)
    .describe("درجة تحسين المحتوى للكلمة المستهدفة 0-100"),
  keyword_analysis: z.object({
    occurrences: z
      .number()
      .int()
      .describe("عدد مرات ظهور الكلمة المفتاحية تقريبًا"),
    in_title: z.boolean(),
    in_first_paragraph: z.boolean(),
    in_headings: z.boolean(),
    density_note: z
      .string()
      .describe("ملاحظة على الكثافة: قليلة / مناسبة / حشو زيادة"),
  }),
  issues: z
    .array(
      z.object({
        severity: z.enum(["critical", "high", "medium", "low"]),
        area: z.enum([
          "title",
          "meta",
          "headings",
          "keyword",
          "structure",
          "readability",
          "length",
          "links",
          "intent",
        ]),
        problem: z.string(),
        fix: z.string(),
      }),
    )
    .min(1)
    .max(12),
  suggested_title: z
    .string()
    .max(70)
    .describe("عنوان مقترح محسّن (≤60 حرف يفضّل)"),
  suggested_meta_description: z
    .string()
    .max(170)
    .describe("وصف ميتا مقترح (≤155 حرف يفضّل)"),
  missing_subtopics: z
    .array(z.string())
    .describe("مواضيع فرعية المنافسين بيغطّوها وانت ناقصها — ضيفها"),
  outline_suggestion: z
    .array(z.string())
    .describe("عناوين H2/H3 مقترحة لتقوية البنية"),
  quick_wins: z.array(z.string()),
});

export type SeoOptimizeResult = z.infer<typeof seoOptimizeSchema>;

const SEO_OPTIMIZE_SYSTEM = `أنت خبير SEO محتوى للسوق المصري، 12 سنة خبرة. شغلتك تراجع مقال/صفحة
مقابل كلمة مفتاحية مستهدفة وتقول بدقة: هترتّب كويس ولا محتاجة شغل؟

افحص:
1. **العنوان (Title)** — فيه الكلمة؟ جذّاب وطوله مناسب (≤60 حرف)؟
2. **Meta description** — فيه الكلمة + دعوة، ≤155 حرف؟
3. **العناوين (H2/H3)** — منظّمة؟ فيها الكلمة ومشتقاتها؟
4. **الكلمة المفتاحية** — موجودة في أول فقرة؟ كثافتها طبيعية مش حشو؟
5. **البنية والقابلية للقراءة** — فقرات قصيرة، قوائم، أمثلة؟
6. **نية البحث (intent)** — المحتوى بيجاوب اللي بيدوّر فعلاً عايزه؟
7. **المواضيع الناقصة** — إيه اللي المنافسين بيغطّوه وانت ناسيه؟

قواعدك:
- **عملي وصريح** — لكل مشكلة حل، ويُفضّل تكتب البديل (عنوان/ميتا جاهزين).
- **عربي مصري**، ومراعي إن المصري بيبحث بالعامي والإنجليزي أحيانًا.
- **متحشّيش الكلمة** — لو الكثافة عالية قول ده ضار.
- **اقترح outline** يقوّي الصفحة، ومواضيع فرعية فعلاً ذات صلة.`;

export async function optimizeSeoContent(input: {
  keyword: string;
  content: string;
  title?: string;
}): Promise<SeoOptimizeResult> {
  const userPrompt = `**الكلمة المفتاحية المستهدفة:** ${input.keyword}
${input.title ? `**العنوان الحالي:** ${input.title}` : ""}

**المحتوى المطلوب تحسينه:**
"""
${input.content.slice(0, 8000)}
"""

راجع المحتوى ده مقابل الكلمة المستهدفة: اديله درجة، حلّل استخدام الكلمة،
اطلّع المشاكل مع حل لكل واحدة، واقترح عنوان + ميتا + outline + مواضيع ناقصة.`;

  return callWithFallback(async (picked) => {
    const { object } = await generateObject({
      maxRetries: 0, // callWithFallback owns the retry chain
      model: picked.model,
      schema: seoOptimizeSchema,
      system: SEO_OPTIMIZE_SYSTEM,
      prompt: userPrompt,
      temperature: 0.4,
    });
    return object;
  });
}
