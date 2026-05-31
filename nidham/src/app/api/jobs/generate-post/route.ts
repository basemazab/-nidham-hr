import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const MODEL = "gemini-2.5-flash";

const postSchema = z.object({
  facebook: z.object({
    caption: z.string().describe("Arabic Facebook post caption, 2-3 paragraphs, engaging tone, emojis, ~200 chars"),
    hashtags: z.string().describe("10-15 relevant Arabic + English hashtags space-separated"),
  }).describe("Facebook style — warm, engaging, community tone"),
  linkedin: z.object({
    caption: z.string().describe("Arabic LinkedIn post, professional tone, ~200 chars, bullet points for highlights"),
    hashtags: z.string().describe("8-12 professional hashtags space-separated"),
  }).describe("LinkedIn professional style"),
  whatsapp: z.object({
    caption: z.string().describe("Brief Arabic WhatsApp message, 3-5 lines, direct and friendly"),
    hashtags: z.string().describe("3-5 hashtags space-separated"),
  }).describe("WhatsApp brief style"),
});

export const maxDuration = 60;

export async function POST(req: Request) {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, department, location, job_type, salary_min, salary_max, description, requirements } = await req.json();
  if (!title) {
    return Response.json({ error: "Job title required" }, { status: 400 });
  }

  if (!process.env.GEMINI_API_KEY) {
    return Response.json({ error: "GEMINI_API_KEY not set" }, { status: 500 });
  }

  const salaryText = salary_min && salary_max
    ? `من ${Number(salary_min).toLocaleString("ar-EG")} لـ ${Number(salary_max).toLocaleString("ar-EG")} ج`
    : salary_min
      ? `من ${Number(salary_min).toLocaleString("ar-EG")} ج`
      : "حسب الخبرة";

  const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });

  const prompt = `أنت أخصائي توظيف وتسويق على السوشيال ميديا. عندك وظيفة شاغرة وعاوز تنشرها على منصات مختلفة.

بيانات الوظيفة:
- المسمى: ${title}
- القسم: ${department ?? "—"}
- المكان: ${location ?? "—"}
- نوع الوظيفة: ${job_type ?? "دوام كامل"}
- المرتب: ${salaryText}
- ملخص الوصف: ${(description ?? "—").slice(0, 300)}
- المتطلبات: ${(requirements ?? "—").slice(0, 300)}

المطلوب:
ولّد 3 نصوص إعلان توظيف مختلفة:

### 1. Facebook Style
- نبرة دافئة، مش فورمال
- استخدم emojis
- ابدأ بسؤال أو حاجة تجذب الانتباه
- 2-3 فقرات قصيرة
- Call to action واضح (قدم دلوقتي/ابعت السيرة الذاتية)
- 10-15 هاشتاج في النهاية

### 2. LinkedIn Style
- نبرة مهنية محترمة
- ابدأ بـ "نحن نبحث عن..."
- Bullet points لأهم المتطلبات
- خليها قصيرة ومباشرة
- 8-12 هاشتاج مهنية في النهاية

### 3. WhatsApp Style
- قصيرة جدًا، 3-5 أسطر
- لغة مباشرة، عربي مصري
- تنتهي بإنشاء دعوة للتواصل
- 3-5 هاشتاجات

كل النصوص بالعربي المصري الواضح.`;

  try {
    const { object } = await generateObject({
      model: google(MODEL),
      schema: postSchema,
      prompt,
      temperature: 0.7,
    });

    return Response.json({ ok: true, variants: object });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ error: msg.slice(0, 300) }, { status: 500 });
  }
}
