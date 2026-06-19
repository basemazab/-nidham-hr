import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id, role")
      .eq("id", user.id)
      .single<{ company_id: string; role: string }>();

    if (!profile || profile.role !== "super_admin") {
      return NextResponse.json({ error: "مشرف فقط" }, { status: 403 });
    }

    const { data, error } = await supabase.rpc("bulk_set_tenant_overrides", {
      p_company_id: profile.company_id,
      p_overrides: JSON.stringify([
        { feature: "marketing_studio", enabled: true },
        { feature: "crm", enabled: true },
      ]),
      p_reason: "Enabled via /api/admin/enable-features by system owner",
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, rowsAffected: data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}
