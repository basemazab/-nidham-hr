import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { readFileSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response("غير مصرح — سجل دخول كـ Admin", { status: 401 });

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (!profile || profile.role !== "admin") {
      return new Response("غير مصرح — يحتاج صلاحية Admin", { status: 403 });
    }

    const svc = createServiceClient();
    const sql = readFileSync(join(process.cwd(), "db/migrations/080_optional_cv.sql"), "utf8");
    const { error } = await svc.rpc("exec_sql", { sql });
    if (error) return new Response(`Migration failed: ${error.message}`, { status: 500 });
    return new Response("Migration 080 completed successfully!", { status: 200 });
  } catch (e) {
    return new Response(`Error: ${e instanceof Error ? e.message : String(e)}`, { status: 500 });
  }
}
