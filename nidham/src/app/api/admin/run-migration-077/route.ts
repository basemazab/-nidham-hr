import { createClient } from "@/lib/supabase/server";
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

    const sql = readFileSync(join(process.cwd(), "db/migrations/077_fix_pii_trigger_null_shadow.sql"), "utf8");

    const { data, error } = await supabase.rpc("exec_sql", { sql: sql });

    if (error) {
      return new Response(`خطأ: ${error.message}`, { status: 500 });
    }

    return new Response(`تم تشغيل الترحيل 077 بنجاح!\n\nالنتيجة: ${JSON.stringify(data)}`, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  } catch (e) {
    return new Response(`خطأ غير متوقع: ${e instanceof Error ? e.message : String(e)}`, {
      status: 500,
    });
  }
}
