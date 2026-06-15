import OpenAI from "openai";
import Groq from "groq-sdk";

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

function getGroq() {
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

async function callAI(prompt: string, model: string = "gpt-4o") {
  try {
    const groq = getGroq();
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.1-70b-versatile",
      temperature: 0.3,
    });
    return completion.choices[0].message.content;
  } catch (error) {
    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });
    return completion.choices[0].message.content;
  }
}

export async function analyzeCV(cvText: string, jobDescription: string) {
  const prompt = `
أنت خبير توظيف متخصص في السوق المصري. قيّم هذا الـ CV مقابل الوصف الوظيفي التالي.

وصف الوظيفة:
${jobDescription}

نص الـ CV:
${cvText}

أرجع النتيجة بالتنسيق التالي (JSON فقط، لا نص إضافي):
{
  "score": number (0-100),
  "matchPercentage": number,
  "strengths": ["نقطة قوة 1", "نقطة قوة 2"],
  "weaknesses": ["منطقة ضعف 1", "منطقة ضعف 2"],
  "recommendation": "توصية عامة",
  "interviewQuestions": ["سؤال 1", "سؤال 2", "سؤال 3", "سؤال 4", "سؤال 5"]
}
`;

  try {
    const result = await callAI(prompt);
    const jsonMatch = result?.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return null;
  }
}

export async function generateJobDescription(title: string, requirements: string) {
  const prompt = `
اكتب وصف وظيفي احترافي بالعربية الفصحى للوظيفة التالية:

المسمى الوظيفي: ${title}
المتطلبات: ${requirements}

الوصف يجب أن يكون:
- جذاباً للمرشحين الموهوبين
- واضحاً ومحترفاً
- يتضمن مسؤوليات الوظيفة
- يتضمن المؤهلات المطلوبة
- يتضمن ما تقدمه الشركة (فوائد)

اكتب 3 فقرات فقط.
`;

  return await callAI(prompt);
}

export async function matchCandidateToJobs(candidateProfile: string, jobs: any[]) {
  const jobsText = jobs.map((j, i) =>
    `${i + 1}. ${j.title} - ${j.description.substring(0, 200)}`
  ).join("\n");

  const prompt = `
بناءً على بروفايل المرشح التالي، رتّب الوظائف من الأنسب للأقل مناسبة.

بروفايل المرشح:
${candidateProfile}

الوظائف المتاحة:
${jobsText}

أرجع JSON فقط:
{
  "rankings": [
    {"jobIndex": number, "matchScore": number, "reason": "سبب المطابقة"}
  ]
}
`;

  const result = await callAI(prompt);
  try {
    const jsonMatch = result?.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  } catch {
    return null;
  }
}
