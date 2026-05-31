import { createClient } from "@/lib/supabase/server";
import { getMyProfile } from "@/lib/permissions";
import { readFileSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { profile } = await getMyProfile();
    if (!profile || profile.role !== "admin") {
      return Response.json({ error: "Admin only" }, { status: 403 });
    }

    const { migration } = await req.json();
    if (!migration) return Response.json({ error: "Migration name required" }, { status: 400 });

    const safeName = migration.replace(/[^a-zA-Z0-9_-]/g, "");
    if (!safeName.startsWith("077") && !safeName.startsWith("079") && !safeName.startsWith("080")) {
      return Response.json({ error: "Only migration 077, 079, or 080 allowed via this endpoint" }, { status: 400 });
    }

    const sql = readFileSync(join(process.cwd(), "db/migrations", `${safeName}.sql`), "utf8");

    const { data, error } = await supabase.rpc("exec_sql", { sql: sql });

    if (error) {
      return Response.json({ ok: false, error: error.message }, { status: 500 });
    }

    return Response.json({ ok: true, result: data });
  } catch (e) {
    return Response.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
