import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { cacheGet, cacheSet, cacheKey } from "@/lib/cache";

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("job_id");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = parseInt(searchParams.get("limit") ?? "20", 10);
    const offset = (page - 1) * limit;

    const ck = cacheKey(["apps", profile.company_id, jobId ?? "all", status ?? "all", String(page), String(limit)]);
    const cached = await cacheGet<{ applications: unknown; total: number }>(ck);
    if (cached) return NextResponse.json({ ...cached, page, limit, cached: true });

    let query = supabase
      .from("applications")
      .select("*, candidates(full_name, email, phone, current_title, current_company, location, skills, avatar), jobs(title)", { count: "exact" })
      .eq("company_id", profile.company_id)
      .order("applied_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (jobId) query = query.eq("job_id", jobId);
    if (status) query = query.eq("status", status);

    const { data: applications, count, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await cacheSet(ck, { applications, total: count ?? 0 }, 30);
    return NextResponse.json({ applications, total: count ?? 0, page, limit });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}
