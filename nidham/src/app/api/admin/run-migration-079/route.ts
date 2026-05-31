import { createServiceClient } from "@/lib/supabase/service";
import { readFileSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createServiceClient();
    const sql = readFileSync(join(process.cwd(), "db/migrations/079_job_application_forms.sql"), "utf8");
    const { error } = await supabase.rpc("exec_sql", { sql });
    if (error) return new Response(`Migration failed: ${error.message}`, { status: 500 });
    return new Response("Migration 079 completed successfully!", { status: 200 });
  } catch (e) {
    return new Response(`Error: ${e instanceof Error ? e.message : String(e)}`, { status: 500 });
  }
}
