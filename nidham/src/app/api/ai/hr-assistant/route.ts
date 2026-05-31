import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/ai/hr-assistant
 * مساعد HR الذكي — يجيب على أسئلة حول الموظفين والرواتب والإجازات
 */
export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid request format" },
        { status: 400 }
      );
    }

    // تحويل الرسائل إلى صيغة Vercel AI SDK
    const formattedMessages = messages.map((msg: any) => ({
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
    console.error("HR Assistant Error:", error);

    return NextResponse.json(
      {
        error: "Failed to generate response",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/hr-assistant/suggestions
 * اقتراحات سريعة للمساعد الذكي
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
