import { generateObject } from "ai";
import { z } from "zod";
import { callWithFallback } from "./ai-models";

export type PlatformId = "tiktok" | "youtube_shorts" | "instagram_reels" | "linkedin" | "youtube" | "facebook";

export type PlatformPreset = {
  id: PlatformId;
  name: string;
  icon: string;
  resolution: string;
  aspectRatio: string;
  maxDuration: string;
  description: string;
  bestFor: string;
  tips: string[];
};

export const PLATFORM_PRESETS: PlatformPreset[] = [
  {
    id: "tiktok",
    name: "TikTok",
    icon: "🎵",
    resolution: "1080×1920",
    aspectRatio: "9:16",
    maxDuration: "10 دقائق",
    description: "فيديو رأسي قصير — المحتوى الترفيهي السريع",
    bestFor: "توعية، ترفيه، وصفات، نصائح سريعة",
    tips: [
      "أول 3 ثواني هم الأهم — hook قوي يخلي المشاهد يكمل",
      "استخدم music trend + hashtags",
      "الناس بتدور على محتوى حقيقي مش إعلانات تقيلة",
    ],
  },
  {
    id: "youtube_shorts",
    name: "YouTube Shorts",
    icon: "📱",
    resolution: "1080×1920",
    aspectRatio: "9:16",
    maxDuration: "60 ثانية",
    description: "فيديو قصير رأسي — يجيب مشاهدين جدد",
    bestFor: "مقدمة سريعة عن المنتج، نصائح، behind the scenes",
    tips: [
      "#Shorts في العنوان والوصف",
      "أول 15 ثانية hook قوي",
      "اعمل سلسلة Shorts عشان People Also Watch",
    ],
  },
  {
    id: "instagram_reels",
    name: "Instagram Reels",
    icon: "📸",
    resolution: "1080×1920",
    aspectRatio: "9:16",
    maxDuration: "90 ثانية",
    description: "فيديو رأسي — انتشار عضوي على Instagram",
    bestFor: "عروض منتجات، tutorials, before/after",
    tips: [
      "استخدم Reels audio trending",
      "أضف text overlay + captions",
      "في مصر، الـ Reels وصلتها organic كويسة جداً",
    ],
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: "💼",
    resolution: "1920×1080",
    aspectRatio: "16:9",
    maxDuration: "10 دقائق",
    description: "فيديو أفقي — محتوى احترافي للشركات",
    bestFor: "B2B, thought leadership, company culture",
    tips: [
      "ابدأ بخبرة أو نصيحة مهنية",
      "أول 30 ثانية هم الأهم — لو عدّيتهم, هيكمل",
      "حط caption عشان الناس اللي بتشغل من غير صوت",
    ],
  },
  {
    id: "youtube",
    name: "YouTube",
    icon: "▶",
    resolution: "1920×1080",
    aspectRatio: "16:9",
    maxDuration: "غير محدود",
    description: "فيديو أفقي طويل — محتوى متعمّق",
    bestFor: "مراجعات، شروحات، مقابلات، وثائقيات",
    tips: [
      "عنوان + Thumbnail هما سبب 80% من المشاهدات",
      "أول 30 ثانية لازم يشرحوا قيمة الفيديو كله",
      "استخدم chapters + cards + end screen",
    ],
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: "👍",
    resolution: "1920×1080",
    aspectRatio: "16:9",
    maxDuration: "240 دقيقة",
    description: "فيديو أفقي — أوسع وصول في مصر",
    bestFor: "إعلانات، بث مباشر، محتوى مجتمعي",
    tips: [
      "في مصر، Facebook لسه المنصة الأوسع انتشاراً",
      "الفيديو الطويل (3-10 دقائق) بيجيب engagement أعلى",
      "أضف caption عشان 85% بيشوفوه من غير صوت",
    ],
  },
];

export type PipelineStageId = "research" | "script" | "storyboard" | "production" | "review";

export type PipelineStageDef = {
  id: PipelineStageId;
  name: string;
  icon: string;
  description: string;
  aiTool: string;
};

export const PIPELINE_STAGES: PipelineStageDef[] = [
  {
    id: "research",
    name: "بحث وإعداد",
    icon: "🔍",
    description: "تحديد الجمهور المستهدف، الرسالة الأساسية، ومنصة النشر",
    aiTool: "تحليل الجمهور والمنصة",
  },
  {
    id: "script",
    name: "كتابة السيناريو",
    icon: "✍",
    description: "كتابة سيناريو الفيديو كامل بالعربي المصري",
    aiTool: "توليد السيناريو بالذكاء الاصطناعي",
  },
  {
    id: "storyboard",
    name: "لوحة القصة",
    icon: "🎬",
    description: "تقسيم الفيديو إلى مشاهد مع وصف لكل مشهد",
    aiTool: "توليد لوحة القصة",
  },
  {
    id: "production",
    name: "خطة الإنتاج",
    icon: "🎥",
    description: "تحديد assets المطلوبة، الأدوات، والميزانية التقريبية",
    aiTool: "خطة الإنتاج",
  },
  {
    id: "review",
    name: "مراجعة ونشر",
    icon: "✅",
    description: "مراجعة الفيديو النهائي وجدول النشر",
    aiTool: "قائمة مراجعة ما قبل النشر",
  },
];

export const videoScriptSchema = z.object({
  title: z.string().describe("عنوان الفيديو بالعربي"),
  hook: z.string().describe("الجملة الافتتاحية — أول 3-5 ثواني, تخلي المشاهد يكمل"),
  targetAudience: z.string().describe("الجمهور المستهدف بهذا الفيديو"),
  keyMessage: z.string().describe("الرسالة الأساسية اللي المفروض المشاهد يفتكرها بعد الفيديو"),
  scenes: z.array(z.object({
    sceneNumber: z.number().int().describe("رقم المشهد"),
    timing: z.string().describe("التوقيت من الفيديو (مثلاً '0:00 - 0:05')"),
    visuals: z.string().describe("وصف المرئيات — إيه اللي بيظهر على الشاشة"),
    narration: z.string().describe("النص اللي بيتقال بالعربي المصري"),
    duration: z.string().describe("مدة المشهد بالثواني"),
    notes: z.string().describe("ملاحظات إخراجية (إضاءة, كاميرا, جرافيك)").optional(),
  })).min(3).max(20).describe("مشاهد الفيديو بالترتيب"),
  totalDuration: z.string().describe("المدة الإجمالية للفيديو"),
  cta: z.string().describe("العبارة اللي تحفز المشاهد يعمل إجراء (اشتراك, شراء, تواصل)"),
  platformTips: z.string().describe("نصائح خاصة بالمنصة المختارة"),
  moodAndTone: z.string().describe("المزاج العام والنبرة (جدي, فكاهي, تحفيزي, etc.)"),
});

export type VideoScript = z.infer<typeof videoScriptSchema>;

export const storyboardFrameSchema = z.object({
  sceneNumber: z.number().int().describe("رقم المشهد"),
  shotDescription: z.string().describe("وصف تفصيلي للمشهد — إيه اللي بنشوفه"),
  shotType: z.enum(["close_up", "medium", "wide", "extreme_wide", "over_shoulder", "point_of_view", "detail", "two_shot"]).describe("نوع اللقطة"),
  cameraMovement: z.string().describe("حركة الكاميرا (ثابتة, بان, تيلت, زووم, تتبع, كرين)"),
  visualElements: z.array(z.string()).describe("عناصر بصرية في المشهد (منتج, شخص, جرافيك, نص)"),
  textOverlay: z.string().describe("نص يظهر على الشاشة في المشهد ده").optional(),
  audio: z.string().describe("الصوت في المشهد ده (ناراشن, مزيكا, مؤثرات)"),
  duration: z.string().describe("المدة بالثواني"),
});

export const storyboardSchema = z.object({
  title: z.string().describe("عنوان الفيديو"),
  conceptSummary: z.string().describe("ملخص الفكرة الإبداعية في جملة أو جملتين"),
  visualStyle: z.string().describe("الأسلوب البصري العام (realistic, animated, cinematic, minimalist)"),
  colorPalette: z.array(z.string()).describe("الألوان المقترحة للفيديو (3-5 ألوان)"),
  frames: z.array(storyboardFrameSchema).min(3).max(20).describe("جميع مشاهد الفيديو"),
  transitions: z.string().describe("نوع الانتقالات بين المشاهد (cut, fade, dissolve, wipe)"),
  musicSuggestion: z.string().describe("اقتراح نوع الموسيقى التصويرية"),
  productionNotes: z.string().describe("ملاحظات إنتاجية عامة"),
});

export type StoryboardFrame = z.infer<typeof storyboardFrameSchema>;
export type Storyboard = z.infer<typeof storyboardSchema>;

export const productionPlanSchema = z.object({
  requiredAssets: z.array(z.object({
    type: z.enum(["video_footage", "image", "animation", "text_overlay", "voiceover", "music", "sound_effect", "logo", "icon", "chart"]).describe("نوع ال asset"),
    description: z.string().describe("وصف ال asset المطلوب"),
    source: z.string().describe("مصدر ال asset (تصوير, stock, AI, تصميم)"),
    priority: z.enum(["essential", "important", "nice_to_have"]).describe("أولوية ال asset"),
  })).describe("قائمة assets المطلوبة للإنتاج"),
  equipmentNeeded: z.array(z.string()).describe("المعدات المطلوبة (كاميرا, إضاءة, ميكروفون)"),
  budgetEstimate: z.string().describe("تقدير الميزانية التقريبية"),
  teamNeeded: z.array(z.string()).describe("الفريق المطلوب (مصور, مخرج, مونتير)"),
  timeline: z.string().describe("الجدول الزمني المقترح"),
  preLaunchChecklist: z.array(z.string()).describe("قائمة مراجعة قبل النشر — لازم كلها تتعمل"),
  platformRequirements: z.array(z.string()).describe("متطلبات المنصة (حجم ملف, تنسيق, caption)"),
});

export type ProductionPlan = z.infer<typeof productionPlanSchema>;

const VIDEO_SCRIPT_SYSTEM = `أنت Senior Video Producer في وكالة إعلانات كبرى (Big4), خبرة 15 سنة في إنتاج الفيديو التسويقي للسوق المصري والعربي. اشتغلت مع أكبر العلامات التجارية في مصر على حملات تيك توك ويوتيوب وفيسبوك.

أنت بتكتب سيناريوهات فيديو قصيرة وطويلة بالعربي المصري — مش فصحى ثقيلة. السيناريو بتاعك لازم:
1. يخلي المشاهد يوقف السكرول في أول 3 ثواني (hook قوي)
2. يوصل الرسالة الأساسية بسرعة ووضوح
3. يخلي المشاهد يعمل CTA في الآخر
4. يكون عملي — المخرج يقدر يصوره بالميزانية المتاحة

قواعدك:
- استخدم المصري اللي الناس بتتكلمه فعلاً في الشارع
- مفيش "سوف" و"إنّ" و"حيثما" — قول "هيكون" و"لما" و"علشان"
- كل مشهد له وصف مرئي واضح: إيه اللي بنشوفه على الشاشة
- الناراشن متناسق مع الـ visuals — متقولش حاجة والناس بتشوف حاجة تانية
- المدة الزمنية دقيقة — كل مشهد وقته محسوب
- الـ CTA واضح ومباشر: "كلمنا على الواتساب", "حمل التطبيق دلوقتي", "اشترك في القناة"
- راعِ خصوصية المنصة: تيك توك أسرع, يوتيوب أعمق, لينكد إن احترافي`;

export async function generateVideoScript(input: {
  productSummary: string;
  platform: PlatformId;
  targetAudience: string;
  tone: string;
  durationSeconds: number;
  keyMessage: string;
  additionalContext?: string;
}): Promise<VideoScript> {
  const platformInfo = PLATFORM_PRESETS.find((p) => p.id === input.platform);
  const userPrompt = `**المنتج/الخدمة:** ${input.productSummary}
**المنصة:** ${platformInfo?.name ?? input.platform} (${platformInfo?.aspectRatio ?? ""})
**الجمهور المستهدف:** ${input.targetAudience}
**النبرة:** ${input.tone}
**المدة المطلوبة:** ${input.durationSeconds} ثانية
**الرسالة الأساسية:** ${input.keyMessage}
${input.additionalContext ? `**سياق إضافي:**\n${input.additionalContext}` : ""}
${platformInfo ? `\n**نصائح المنصة:**\n${platformInfo.tips.join("\n")}` : ""}

اكتب سيناريو فيديو تسويقي متكامل بالعربي المصري للمنصة المحددة.
- ابدأ بـ hook قوي يخلي المشاهد يكمل مشاهدة
- قسم الفيديو لمشاهد (كل مشهد: وصف مرئي + نص الناراشن + المدة)
- حدد المدة الإجمالية بدقة
- اعمل CTA قوي في الآخر
- أضف نصائح خاصة بالمنصة`;

  return callWithFallback(async (picked) => {
    const { object } = await generateObject({
      maxRetries: 0,
      model: picked.model,
      schema: videoScriptSchema,
      system: VIDEO_SCRIPT_SYSTEM,
      prompt: userPrompt,
      temperature: 0.7,
    });
    return object;
  });
}

const STORYBOARD_SYSTEM = `أنت Art Director ومصمم Storyboard في وكالة إعلانات كبرى, خبرة 12 سنة في تحويل السيناريوهات التسويقية إلى لوحات قصة بصرية للمخرجين والمصورين.

دورك: خد سيناريو الفيديو وحوّله إلى Storyboard تفصيلي — كل مشهد له:
- وصف دقيق للصورة (إيه اللي بنشوفه بالضبط)
- نوع اللقطة (close up, medium, wide)
- حركة الكاميرا
- العناصر البصرية في المشهد
- النصوص اللي على الشاشة
- الصوت والمزيكا
- المدة بالثواني

قواعدك:
- كل frame ليه هدف سردي واضح — مش مجرد "شخص بيتكلم"
- تنوّع في أنواع اللقطات (متبقاش كلها close up)
- خلي بالك من pacing الفيديو — المشاهد القصيرة المتقطعة للـ TikTok, الأطول للـ YouTube
- الألوان المقترحة متناسقة مع المزاج العام
- الانتقالات بين المشاهد منطقية
- اكتب production notes مفيدة للمخرج`;

export async function generateStoryboard(input: {
  script: VideoScript;
  visualStyle: string;
  platform: PlatformId;
  additionalNotes?: string;
}): Promise<Storyboard> {
  const platformInfo = PLATFORM_PRESETS.find((p) => p.id === input.platform);
  const userPrompt = `**السيناريو:**
العنوان: ${input.script.title}
الـ Hook: ${input.script.hook}
المدة الإجمالية: ${input.script.totalDuration}
الرسالة الأساسية: ${input.script.keyMessage}

**المشاهد:**
${input.script.scenes.map((s) => `[${s.sceneNumber}] ${s.timing} — المرئيات: ${s.visuals} | النص: ${s.narration} | المدة: ${s.duration}`).join("\n")}

**الأسلوب البصري المطلوب:** ${input.visualStyle}
**المنصة:** ${platformInfo?.name ?? input.platform} (${platformInfo?.aspectRatio ?? ""})
${input.additionalNotes ? `\n**ملاحظات إضافية:**\n${input.additionalNotes}` : ""}

حوّل السيناريو ده إلى Storyboard تفصيلي — كل مشهد بوصف دقيق للصورة, نوع اللقطة, حركة الكاميرا, العناصر البصرية, النص على الشاشة, والصوت.
- حط اقتراح ألوان متناسقة
- حدد نوع الانتقالات
- اقترح نوع الموسيقى التصويرية
- اكتب ملاحظات إنتاجية`;

  return callWithFallback(async (picked) => {
    const { object } = await generateObject({
      maxRetries: 0,
      model: picked.model,
      schema: storyboardSchema,
      system: STORYBOARD_SYSTEM,
      prompt: userPrompt,
      temperature: 0.7,
    });
    return object;
  });
}

const PRODUCTION_PLAN_SYSTEM = `أنت Line Producer في شركة إنتاج فيديو, خبرة 10 سنين في تقدير ميزانيات وجداول إنتاج المحتوى التسويقي للسوق المصري.

دورك: خد الـ Storyboard وحوّله لخطة إنتاج عملية:
- assets المطلوبة بالضبط (فيديو, صور, جرافيك, صوت)
- المعدات اللازمة
- الميزانية التقريبية
- الفريق المطلوب
- الجدول الزمني
- قائمة مراجعة قبل النشر

قواعدك:
- التقديرات واقعية للسوق المصري — مش Hollywood
- صنّف الـ assets حسب الأولوية (ضروري / مهم / تحسيني)
- قائمة ما قبل النشر شاملة ومحددة
- متطلبات المنصة دقيقة (حجم الملف, الطول, التنسيق)`;

export async function generateProductionPlan(input: {
  storyboard: Storyboard;
  platform: PlatformId;
  budget: string;
}): Promise<ProductionPlan> {
  const platformInfo = PLATFORM_PRESETS.find((p) => p.id === input.platform);
  const userPrompt = `**الـ Storyboard:**
العنوان: ${input.storyboard.title}
الأسلوب البصري: ${input.storyboard.visualStyle}
الألوان: ${input.storyboard.colorPalette.join(", ")}
الانتقالات: ${input.storyboard.transitions}

**المشاهد:**
${input.storyboard.frames.map((f) => `[${f.sceneNumber}] ${f.shotDescription} | ${f.shotType} | ${f.cameraMovement} | المدة: ${f.duration}`).join("\n")}

**المنصة:** ${platformInfo?.name ?? input.platform} (${platformInfo?.resolution ?? ""})
**الميزانية التقريبية:** ${input.budget}
${platformInfo ? `\n**متطلبات المنصة:**` : ""}
${platformInfo ? `- ${platformInfo.resolution}, ${platformInfo.aspectRatio}` : ""}
${platformInfo ? `- أقصى مدة: ${platformInfo.maxDuration}` : ""}

ابني خطة إنتاج كاملة:
- assets المطلوبة لكل مشهد مع المصدر والأولوية
- المعدات اللازمة
- تقدير الميزانية للسوق المصري
- الفريق المطلوب
- الجدول الزمني
- قائمة مراجعة ما قبل النشر`;
  return callWithFallback(async (picked) => {
    const { object } = await generateObject({
      maxRetries: 0,
      model: picked.model,
      schema: productionPlanSchema,
      system: PRODUCTION_PLAN_SYSTEM,
      prompt: userPrompt,
      temperature: 0.5,
    });
    return object;
  });
}

export const PLATFORM_LABELS: Record<PlatformId, string> = {
  tiktok: "TikTok",
  youtube_shorts: "YouTube Shorts",
  instagram_reels: "Instagram Reels",
  linkedin: "LinkedIn",
  youtube: "YouTube",
  facebook: "Facebook",
};

export const SHOT_TYPE_LABELS: Record<string, string> = {
  close_up: "Close Up — لقطة قريبة",
  medium: "Medium — لقطة متوسطة",
  wide: "Wide — لقطة واسعة",
  extreme_wide: "Extreme Wide — لقطة واسعة جداً",
  over_shoulder: "Over Shoulder — خلف الكتف",
  point_of_view: "POV — من وجهة نظر",
  detail: "Detail — تفاصيل",
  two_shot: "Two Shot — لقطة شخصين",
};
