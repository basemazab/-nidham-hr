import { createPublicClient } from "@/lib/supabase/public";
import type { NextRequest } from "next/server";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const jobSlug = formData.get("job_slug") as string;
    const fullName = formData.get("full_name") as string;
    const email = formData.get("email") as string;
    const phone = (formData.get("phone") as string) || "";
    const city = (formData.get("city") as string) || "";
    const answersRaw = formData.get("answers") as string;
    const coverMessage = (formData.get("cover_message") as string) || "";
    const resumeFile = formData.get("resume") as File | null;

    if (!jobSlug || !fullName || !email) {
      return Response.json({ error: "الاسم والبريد الإلكتروني مطلوبان" }, { status: 400 });
    }

    let answers: Record<string, string> = {};
    if (answersRaw) {
      try { answers = JSON.parse(answersRaw); } catch { /* ignore */ }
    }

    let cvText: string | null = null;
    if (resumeFile && resumeFile.size > 0) {
      const { extractCvText } = await import("@/lib/pdf-extract");
      cvText = await extractCvText(resumeFile);
    }
    // cvText is allowed to be null — the RPC accepts no-CV submissions

    const supabase = createPublicClient();

    const { data: appId, error: rpcErr } = await supabase.rpc(
      "submit_public_application",
      {
        p_job_slug: jobSlug,
        p_full_name: fullName,
        p_email: email,
        p_phone: phone,
        p_current_title: null,
        p_location: city || null,
        p_years_experience: null,
        p_cv_text: cvText,
        p_cv_pdf_url: null,
        p_cover_letter: coverMessage || null,
        p_answers: answers,
      },
    );

    if (rpcErr || !appId) {
      const message = rpcErr?.message ?? "فشل التقديم";
      return Response.json({ error: message }, { status: 400 });
    }

    try {
      await screenApplicationInline(appId as string);
    } catch {
      // AI error already persisted by the function
    }

    return Response.json({ ok: true, application_id: appId });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "فشل التقديم";
    return Response.json({ error: msg }, { status: 500 });
  }
}

async function screenApplicationInline(applicationId: string) {
  if (!process.env.GEMINI_API_KEY) return;

  const { createGoogleGenerativeAI } = await import("@ai-sdk/google");
  const { generateObject } = await import("ai");
  const { buildScreeningPrompt, screeningSchema } = await import(
    "@/lib/recruitment"
  );

  const MODEL = "gemini-2.5-flash";
  const supabase = createPublicClient();

  const { data: row } = await supabase.rpc("fetch_application_for_screening", {
    p_app_id: applicationId,
  });

  if (!row || !Array.isArray(row) || row.length === 0) return;

  const r = row[0] as {
    cv_text: string | null;
    job_title: string;
    job_department: string | null;
    job_description: string | null;
    job_requirements: string | null;
    job_responsibilities: string | null;
    job_experience_years_min: number | null;
    job_location: string | null;
    job_type: string | null;
    candidate_full_name: string;
    candidate_current_title: string | null;
    candidate_years_experience: number | null;
    candidate_location: string | null;
  };

  if (!r.cv_text || r.cv_text.length < 30) return;

  const prompt = buildScreeningPrompt(
    {
      title: r.job_title,
      department: r.job_department,
      description: r.job_description,
      requirements: r.job_requirements,
      responsibilities: r.job_responsibilities,
      experience_years_min: r.job_experience_years_min,
      location: r.job_location,
      job_type: r.job_type ?? "full_time",
    },
    {
      full_name: r.candidate_full_name,
      current_title: r.candidate_current_title,
      years_experience: r.candidate_years_experience,
      location: r.candidate_location,
    },
    r.cv_text,
  );

  const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });

  try {
    const { object } = await generateObject({
      model: google(MODEL),
      schema: screeningSchema,
      prompt,
      temperature: 0.2,
      providerOptions: {
        google: { responseMimeType: "application/json" },
      },
    });

    await supabase.rpc("save_screening_result", {
      p_app_id: applicationId,
      p_score: object.score,
      p_recommendation: object.recommendation,
      p_summary: object.summary,
      p_strengths: object.strengths,
      p_weaknesses: object.weaknesses,
      p_interview_questions: object.interview_questions,
      p_extracted_skills: object.extracted_skills,
      p_model: MODEL,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await supabase.rpc("save_screening_error", {
      p_app_id: applicationId,
      p_error: message.slice(0, 500),
      p_model: MODEL,
    });
  }
}
