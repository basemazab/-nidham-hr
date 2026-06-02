import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  // Require an authenticated session (was missing — the route relied solely
  // on RLS, so an anonymous request still reached the query).
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  // Ownership check: the conversation must belong to THIS user. RLS already
  // scopes to the company, but AI chats can contain sensitive payroll/employee
  // queries, so we additionally restrict to the conversation's owner — a
  // coworker in the same tenant shouldn't read someone else's AI history.
  const { data: conv } = await supabase
    .from("ai_conversations")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!conv) {
    return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  }

  const { data: messages, error } = await supabase
    .from("ai_messages")
    .select("id, role, content, created_at")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true });

  if (error) {
    // Log server-side; return a generic message (don't leak DB internals).
    console.error("[ai/conversations] load failed:", error);
    return NextResponse.json({ error: "تعذّر تحميل الرسائل" }, { status: 500 });
  }

  return NextResponse.json({ messages });
}
