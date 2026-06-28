import { createPublicClient } from "@/lib/supabase/public";
import type { NextRequest } from "next/server";

export const maxDuration = 60;

// Strip NUL + other C0/DEL control characters (keep tab/LF/CR). PDF text
// extraction can leak binary noise that Postgres jsonb/text refuse with
// "unsupported Unicode escape sequence" on insert. Implemented by char code so
// the source carries no binary escape sequences.
function stripCtrl(s: string): string {
  let out = "";
  for (let i = 0; i < s.length; i += 1) {
    const c = s.charCodeAt(i);
    if (c === 9 || c === 10 || c === 13 || (c >= 32 && c !== 127)) out += s[i];
  }
  return out;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const jobSlug = formData.get("job_slug") as string;
    const fullName = formData.get("full_name") as string;
    const email = formData.get("email") as string;
    const phone = (formData.get("phone") as string) || "";
    const city = (formData.get("city") as string) || "";
    const ageRaw = (formData.get("age") as string) || "";
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
      // BEST-EFFORT: a parser hiccup must NEVER block the application. We use
      // the SMART extractor (local parser → Gemini OCR fallback when the local
      // output is garbage/empty, or the file is an image) so HR never sees the
      // binary-salad the byte parser produced on awkward PDFs. Returns null if
      // no clean text could be read — then we just rely on the stored original
      // file instead of persisting garbage.
      try {
        const { extractCvTextSmart } = await import("@/lib/cv-extract");
        cvText = await extractCvTextSmart(resumeFile);
      } catch (e) {
        console.warn("[apply] CV text extraction failed (submitting without it):", e);
        cvText = null;
      }
    }

    // Clean everything that lands in the DB (jsonb + text columns).
    const cvClean = cvText ? stripCtrl(cvText).trim() || null : null;
    const coverClean = coverMessage ? stripCtrl(coverMessage).trim() || null : null;
    const answersClean: Record<string, string> = {};
    for (const [k, v] of Object.entries(answers)) {
      answersClean[k] = stripCtrl(String(v ?? ""));
    }
    // Applicant age (optional) — keep a sane number only; stored inside the
    // answers jsonb under a reserved "__age__" key (no DB migration needed) so
    // HR sees it in the summary email AND on the applicant page.
    const ageDigits = ageRaw.replace(/\D/g, "").slice(0, 3);
    const ageNum = ageDigits ? parseInt(ageDigits, 10) : NaN;
    const ageClean =
      Number.isFinite(ageNum) && ageNum >= 14 && ageNum <= 80 ? String(ageNum) : null;
    if (ageClean) answersClean["__age__"] = ageClean;

    // (أ) Store the ORIGINAL CV file in private storage so HR can download it,
    // not just read the parsed text. Best-effort — never blocks the submit.
    let cvUrl: string | null = null;
    if (resumeFile && resumeFile.size > 0) {
      try {
        const { createServiceClient } = await import("@/lib/supabase/service");
        const svc = createServiceClient();
        const ext =
          (resumeFile.name.split(".").pop() || "pdf")
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "")
            .slice(0, 8) || "pdf";
        const path = `${jobSlug}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const buf = Buffer.from(await resumeFile.arrayBuffer());
        const { error: upErr } = await svc.storage
          .from("application-cvs")
          .upload(path, buf, {
            contentType: resumeFile.type || "application/octet-stream",
            upsert: false,
          });
        if (!upErr) cvUrl = path;
        else console.warn("[apply] CV upload failed:", upErr.message);
      } catch (e) {
        console.warn("[apply] CV upload error:", e);
      }
    }

    const supabase = createPublicClient();

    const { data: appId, error: rpcErr } = await supabase.rpc(
      "submit_public_application",
      {
        p_job_slug: jobSlug,
        p_full_name: stripCtrl(fullName).trim(),
        p_email: stripCtrl(email).trim(),
        p_phone: stripCtrl(phone).trim(),
        p_current_title: null,
        p_location: stripCtrl(city).trim() || null,
        p_years_experience: null,
        p_cv_text: cvClean,
        p_cv_pdf_url: cvUrl,
        p_cover_letter: coverClean,
        p_answers: answersClean,
      },
    );

    if (rpcErr || !appId) {
      const message = rpcErr?.message ?? "فشل التقديم";
      return Response.json({ error: message }, { status: 400 });
    }

    // Instant heads-up for the HR team: candidate name + phone so they can
    // call right away, without waiting to open the applications page.
    // Best-effort — never blocks the application itself.
    try {
      const { createServiceClient } = await import("@/lib/supabase/service");
      const svc = createServiceClient();
      const { data: job } = await svc
        .from("jobs")
        .select("id, company_id, title, application_form")
        .eq("slug", jobSlug)
        .maybeSingle();
      if (job) {
        const { data: hrs } = await svc
          .from("profiles")
          .select("id")
          .eq("company_id", job.company_id)
          .in("role", ["admin", "manager"]);
        if (hrs && hrs.length > 0) {
          await svc.from("notifications").insert(
            hrs.map((p: { id: string }) => ({
              user_id: p.id,
              company_id: job.company_id,
              title: `🎯 متقدم جديد: ${fullName}`,
              body: `قدّم على وظيفة «${job.title}»${phone ? ` — موبايل: ${phone}` : ""}${city ? ` — ${city}` : ""}`,
              type: "recruitment",
              link_url: `/dashboard/jobs/${job.id}`,
            })),
          );

          // (ب) Email the FULL application to the HR team (best-effort).
          try {
            const { sendEmail, emailNewApplication } = await import("@/lib/email");
            const site = (
              process.env.NEXT_PUBLIC_SITE_URL || "https://www.nidhamhr.com"
            ).replace(/\/$/, "");
            const appUrl = `${site}/dashboard/jobs/${job.id}/applications/${appId}`;
            const af = (job as Record<string, unknown>).application_form;
            const qList = Array.isArray(af)
              ? (af as { id: string; label: string }[])
              : [];
            const answerLines = Object.entries(answersClean)
              .filter(([qid, v]) => v.trim() && !qid.startsWith("__"))
              .map(([qid, v]) => ({
                label: qList.find((q) => q.id === qid)?.label ?? "إجابة إضافية",
                value: v,
              }));
            for (const p of hrs as { id: string }[]) {
              const { data: u } = await svc.auth.admin.getUserById(p.id);
              const to = u?.user?.email;
              if (to) {
                await sendEmail(
                  emailNewApplication({
                    to,
                    candidateName: fullName,
                    jobTitle: job.title as string,
                    email,
                    phone,
                    city,
                    age: ageClean,
                    cover: coverClean,
                    answers: answerLines,
                    appUrl,
                  }),
                );
              }
            }
          } catch (e) {
            console.warn("[apply] HR email failed:", e);
          }
        }
      }
    } catch {
      // notifications table missing or transient error — ignore
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
      job_type: r.job_type,
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
