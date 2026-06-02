import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * POST /api/ai/hr-assistant
 * مساعد HR الذكي — يجيب على أسئلة حول الموظفين والرواتب والإجازات
 *
 * SECURITY: this hits the paid OpenAI API, so it MUST be gated. It was
 * previously wide open (no auth, no rate-limit) — anyone could drive
 * unlimited gpt-4-turbo calls on our key. Now: HR-role only + per-user
 * rate-limit, mirroring /api/ai/chat.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single<{ role: string }>();
    if (!profile || (profile.role !== "admin" && profile.role !== "manager")) {
      return NextResponse.json({ error: "غير مصرح — للـ HR فقط" }, { status: 403 });
    }

    const rl = checkRateLimit(`hr-assistant:${user.id}`, 30, 10 * 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: `حاولت كتير — جرّب بعد ${Math.ceil(rl.retryAfterSeconds / 60)} دقيقة` },
        { status: 429 },
      );
    }

    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid request format" },
        { status: 400 }
      );
    }

    // تحويل الرسائل إلى صيغة Vercel AI SDK
    const formattedMessages = messages.map((msg: { role: string; content: string }) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }));

    // نظام الأوامر للمساعد الذكي
    const systemPrompt = `أنت مساعد HR متخصص في نظام إدارة الموارد البشرية المصري.

    تخصصاتك:
    1. معلومات الموظفين: عدد الموظفين، البيانات الشخصية، الأقسام
    2. الرواتب والتأمينات: حساب الرواتب، التأمينات الاجتماعية (11%)، ضريبة الدخل
    3. الإجازات: الإجازات المتبقية، الإجازات المرضية، الإجازات الاستثنائية
    4. الحضور والغياب: تقارير الحضور، الغيابات غير المبررة
    5. الامتثال القانوني: قانون العمل المصري رقم 12 لسنة 2003

    الإرشادات:
    - كن مختصراً وعملياً
    - استخدم اللغة العربية الفصحى والعامية المصرية بتوازن
    - قدم أرقام دقيقة عند الطلب
    - اقترح الحلول العملية
    - اذكر المراجع القانونية عند الحاجة

    ملاحظة: أنت تعمل مع نظام نيدهام HR الذي يدعم الشركات الصناعية المصرية.`;

    // استدعاء نموذج OpenAI
    const response = await generateText({
      model: openai("gpt-4-turbo"),
      system: systemPrompt,
      messages: formattedMessages,
    });

    return NextResponse.json({
      content: response.text,
    });
  } catch (error) {
    // Log server-side; never return the raw error message to the client.
    console.error("HR Assistant Error:", error);

    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/hr-assistant/suggestions
 * اقتراحات سريعة للمساعد الذكي (محتوى ثابت — مش بيمس بيانات)
 */
export async function GET() {
  const suggestions = [
    "كم عدد الموظفين الحاليين؟",
    "ما هي الإجازات المتبقية لهذا الشهر؟",
    "احسب راتب موظف براتب أساسي 5000 جنيه",
    "ما هي متطلبات قانون العمل للإجازة السنوية؟",
    "أين يمكنني العثور على تقارير الحضور؟",
    "كيف أحسب نهاية الخدمة؟",
  ];

  return NextResponse.json({ suggestions });
}
