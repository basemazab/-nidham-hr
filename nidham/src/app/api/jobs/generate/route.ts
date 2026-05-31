import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const MODEL = "gemini-2.5-flash";

const generateSchema = z.object({
  description: z.string().describe("Professional Arabic job description, 2-3 paragraphs, clear Egyptian Arabic"),
  requirements: z.string().describe("Requirements as bullet points, each line starting with '- '"),
  responsibilities: z.string().describe("Responsibilities as bullet points, each line starting with '- '"),
  questions: z.array(z.object({
    id: z.string().describe("Short kebab-case id e.g. 'years-experience', 'computer-skills'"),
    type: z.enum(["text", "multiple_choice", "yes_no", "file"]).describe("Question type"),
    label: z.string().describe("Question text in Egyptian Arabic"),
    required: z.boolean().describe("Whether this question is required"),
    options: z.array(z.string()).optional().describe("Options for multiple_choice questions"),
  })).min(4).max(12).describe("6-10 smart application questions tailored to the job title"),
});

export const maxDuration = 60;

export async function POST(req: Request) {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, department, job_type, location, experience_years_min } = await req.json();
  if (!title || title.trim().length < 2) {
    return Response.json({ error: "المسمى الوظيفي مطلوب" }, { status: 400 });
  }

  if (!process.env.GEMINI_API_KEY) {
    return Response.json({ error: "GEMINI_API_KEY not set" }, { status: 500 });
  }

  const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });

  const prompt = `أنت خبير موارد بشرية متخصص في سوق العمل المصري. المطلوب منك إنك تولّد وصف وظيفي متكامل + أسئلة تقديم ذكية لوظيفة:

المسمى: ${title}
القسم: ${department ?? "غير محدد"}
الخبرة المطلوبة: ${experience_years_min ?? 0} سنين
نوع التعاقد: ${job_type ?? "دوام كامل"}
الموقع: ${location ?? "غير محدد"}

المطلوب:
1. وصف وظيفي احترافي وجذاب بالعربي المصري الواضح (مش فصحى ثقيلة)، 2-3 فقرات.
2. متطلبات واقعية للسوق المصري — متبالغش.
3. مسؤوليات يومية محددة وعملية.
4. أسئلة تقديم ذكية (6-10 أسئلة) مخصصة للوظيفة دي بالضبط:

قواعد الأسئلة:
- كل سؤال لازم يكون ليه علاقة مباشرة بالوظيفة والمجال بتاعها
- types المتاحة: text (إجابة نصية), multiple_choice (اختيار من متعدد), yes_no (نعم/لا), file (رفع ملف)
- الأسئلة تشمل:Skills assessment (text or multiple_choice), Experience evaluation, Availability, Job-specific scenarios, Portfolio/work samples (file)
- خلي في أسئلة required وأسئلة optional
- لو multiple_choice، حط 3-5 خيارات مناسبة
- متنوعش كل الأسئلة text — استعمل yes_no و multiple_choice كمان

استعمل لغة واضحة ومحترمة، مناسبة للمتقدمين المصريين.`;

  try {
    const { object } = await generateObject({
      model: google(MODEL),
      schema: generateSchema,
      prompt,
      temperature: 0.4,
    });

    return Response.json({ ok: true, ...object });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ error: msg.slice(0, 300) }, { status: 500 });
  }
}
