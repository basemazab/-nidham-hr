import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const department = searchParams.get("department");
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = parseInt(searchParams.get("limit") ?? "20", 10);
    const offset = (page - 1) * limit;

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single<{ company_id: string }>();

    if (!profile) return NextResponse.json({ error: "لا يوجد حساب" }, { status: 403 });

    let query = supabase
      .from("jobs")
      .select("*", { count: "exact" })
      .eq("company_id", profile.company_id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq("status", status);
    if (department) query = query.eq("department", department);

    const { data: jobs, count, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ jobs, total: count ?? 0, page, limit });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
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

    const body = await request.json();
    const { title, department, description, requirements, responsibilities, benefits,
      job_type, level, location, remote_ok, salary_min, salary_max, is_salary_visible,
      experience_years_min, is_public, status } = body;

    if (!title) return NextResponse.json({ error: "المسمى الوظيفي مطلوب" }, { status: 400 });

    let slug = title
      .trim().toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-")
      .replace(/-+/g, "-").replace(/^-|-$/g, "").substring(0, 80);

    const { data: existing } = await supabase.from("jobs").select("slug").eq("slug", slug).maybeSingle();
    if (existing) slug = slug + "-" + Date.now().toString(36);

    const { data: job, error } = await supabase.from("jobs").insert({
      company_id: profile.company_id, title, department, description, requirements,
      responsibilities, benefits, job_type: job_type ?? "full_time", level: level ?? "mid",
      location, remote_ok: remote_ok ?? false, salary_min, salary_max,
      is_salary_visible: is_salary_visible ?? true, experience_years_min: experience_years_min ?? 0,
      status: status ?? "draft", is_public: is_public ?? false, slug, created_by: user.id,
      posted_at: status === "open" ? new Date().toISOString() : null,
    }).select("id").single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ job }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}
