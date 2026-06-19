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

    const { data: job, error } = await supabase
      .from("jobs")
      .select("*, job_skills(*)")
      .eq("id", id)
      .eq("company_id", profile.company_id)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 404 });
    return NextResponse.json({ job });
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

    const allowed = ["title", "department", "description", "requirements", "responsibilities",
      "benefits", "job_type", "level", "location", "remote_ok", "salary_min", "salary_max",
      "is_salary_visible", "experience_years_min", "status", "is_public", "closes_at"];

    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key];
    }

    if (updates.status === "open") {
      updates.posted_at = new Date().toISOString();
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "لا توجد بيانات للتحديث" }, { status: 400 });
    }

    const { error } = await supabase
      .from("jobs")
      .update(updates)
      .eq("id", id)
      .eq("company_id", profile.company_id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: { params: Params }) {
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

    const { error } = await supabase
      .from("jobs")
      .delete()
      .eq("id", id)
      .eq("company_id", profile.company_id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}
