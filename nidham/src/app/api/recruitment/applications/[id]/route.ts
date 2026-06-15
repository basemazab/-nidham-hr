import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type Params = Promise<{ id: string }>;

export async function GET(_request: Request, { params }: { params: Params }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single<{ company_id: string }>();
    if (!profile) return NextResponse.json({ error: "لا يوجد حساب" }, { status: 403 });

    const { id } = await params;

    const { data: application, error } = await supabase
      .from("applications")
      .select("*, candidates(*), jobs(title), stage_history(*)")
      .eq("id", id)
      .eq("company_id", profile.company_id)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 404 });
    return NextResponse.json({ application });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, { params }: { params: Params }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single<{ company_id: string }>();
    if (!profile) return NextResponse.json({ error: "لا يوجد حساب" }, { status: 403 });

    const { id } = await params;
    const body = await request.json();

    const allowed = ["status", "hr_notes", "rating", "assigned_to", "interview_at", "ai_score",
      "ai_recommendation", "ai_summary", "ai_strengths", "ai_weaknesses", "ai_interview_questions",
      "ai_extracted_skills", "ai_match_details", "ai_analyzed_at", "ai_error"];

    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key];
    }

    const fromStage = body._from_stage;
    const notes = body._notes;

    updates.last_activity_at = new Date().toISOString();
    if (updates.status && updates.status !== "new") {
      updates.reviewed_at = new Date().toISOString();
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "لا توجد بيانات للتحديث" }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from("applications")
      .update(updates)
      .eq("id", id)
      .eq("company_id", profile.company_id);

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

    if (body.status && body.status !== body._current_status) {
      await supabase.from("stage_history").insert({
        application_id: id,
        from_stage: fromStage || null,
        to_stage: body.status,
        changed_by: user.id,
        notes: notes || null,
      });

      if (body.status === "hired") {
        const { data: app } = await supabase
          .from("applications")
          .select("job_id")
          .eq("id", id)
          .single<{ job_id: string }>();
        if (app) {
          await supabase.from("jobs").update({ status: "filled" }).eq("id", app.job_id);
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}
