import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { groq } from "@ai-sdk/groq";
import { z } from "zod";
import { checkRateLimitRedis } from "@/lib/rate-limit";

const AnalyzeSchema = z.object({
  resumeText: z.string().min(30, "النص قصير جداً"),
  jobDescription: z.string().min(10, "وصف الوظيفة مطلوب"),
  jobRequirements: z.string().optional(),
  jobTitle: z.string().optional(),
});

const AnalysisResult = z.object({
  score: z.number().min(0).max(100),
  recommendation: z.enum(["strong_yes", "yes", "maybe", "no"]),
  summary: z.string(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  interviewQuestions: z.array(z.string()),
  extractedSkills: z.array(z.string()),
  matchDetails: z.object({
    skills: z.number().min(0).max(100),
    experience: z.number().min(0).max(100),
    education: z.number().min(0).max(100),
  }),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const rl = await checkRateLimitRedis(`ai:${user.id}`, 15, 10 * 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: `استخدمت الكوتا بتاعتك — حاول بعد ${Math.ceil(rl.retryAfterSeconds / 60)} دقيقة` },
        { status: 429 },
      );
    }

    const body = await request.json();
    const parsed = AnalyzeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "بيانات ناقصة" }, { status: 400 });
    }

    const { resumeText, jobDescription, jobRequirements, jobTitle } = parsed.data;

    const prompt = `أنت خبير توظيف مصري متخصص في تحليل السير الذاتية. حلل السيرة الذاتية التالية مقابل متطلبات الوظيفة.

المسمى الوظيفي: ${jobTitle ?? "غير محدد"}
وصف الوظيفة:
${jobDescription}
${jobRequirements ? `\nمتطلبات الوظيفة:\n${jobRequirements}` : ""}

السيرة الذاتية للمتقدم:
${resumeText}

قم بتحليل شامل وأخرج النتيجة بهذا التنسيق JSON:
- score: درجة من 0-100 (مدى تطابق المتقدم مع الوظيفة)
- recommendation: توصية (strong_yes = ممتاز, yes = مناسب, maybe = يمكن, no = غير مناسب)
- summary: ملخص التحليل بالعربية (جملة أو جملتين)
- strengths: قائمة نقاط القوة (كل نقطة باختصار بالعربية)
- weaknesses: قائمة نقاط الضعف (كل نقطة باختصار بالعربية)
- interviewQuestions: 3-5 أسئلة مقابلة مقترحة بالعربية مبنية على السيرة والوظيفة
- extractedSkills: المهارات المستخرجة من السيرة الذاتية (بالإنجليزية)
- matchDetails: تفاصيل التطابق (skills نسبة تطابق المهارات, experience نسبة الخبرة, education نسبة التعليم)`;

    const useGroq = !!process.env.GROQ_API_KEY;

    try {
      let result;
      if (useGroq) {
        result = await generateObject({
          model: groq("llama-3.1-70b-versatile"),
          schema: AnalysisResult,
          prompt,
          temperature: 0.3,
          maxRetries: 1,
        });
      } else {
        result = await generateObject({
          model: google("gemini-2.5-flash"),
          schema: AnalysisResult,
          prompt,
          temperature: 0.3,
          maxRetries: 1,
        });
      }

      return NextResponse.json(result.object);
    } catch (aiError) {
      // Fallback to Gemini if Groq fails
      if (useGroq) {
        try {
          const result = await generateObject({
            model: google("gemini-2.5-flash"),
            schema: AnalysisResult,
            prompt,
            temperature: 0.3,
          });
          return NextResponse.json(result.object);
        } catch (fallbackError) {
          return NextResponse.json(
            { error: fallbackError instanceof Error ? fallbackError.message : "AI analysis failed" },
            { status: 500 },
          );
        }
      }
      return NextResponse.json(
        { error: aiError instanceof Error ? aiError.message : "AI analysis failed" },
        { status: 500 },
      );
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}
