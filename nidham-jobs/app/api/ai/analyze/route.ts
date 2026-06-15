import { NextRequest, NextResponse } from "next/server";
import { analyzeCV } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { resumeText, jobDescription } = body;

    if (!resumeText || !jobDescription) {
      return NextResponse.json(
        { error: "resumeText و jobDescription مطلوبان" },
        { status: 400 }
      );
    }

    const result = await analyzeCV(resumeText, jobDescription);

    if (!result) {
      return NextResponse.json(
        { error: "فشل تحليل السيرة الذاتية" },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("AI Analyze Error:", error);
    return NextResponse.json(
      { error: "خطأ في تحليل السيرة الذاتية" },
      { status: 500 }
    );
  }
}
