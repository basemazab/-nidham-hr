import { createClient } from "@supabase/supabase-js";
import { generateEmbedding } from "@/lib/ai/embeddings";

export const maxDuration = 300;

export async function POST(req: Request) {
  const auth = req.headers.get("x-admin-token");
  if (auth !== "fix-workflows-2026") return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  if (!key || !url) return Response.json({ error: "No service key" }, { status: 500 });

  const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

  let body: { docId?: string } = {};
  try { body = await req.json(); } catch {}

  let query = supabase
    .from("ai_knowledge_base")
    .select("id, title, content")
    .is("embedding", null);

  if (body.docId) query = query.eq("id", body.docId);

  const { data: docs, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!docs?.length) return Response.json({ message: "لا توجد مستندات", count: 0 });

  const errors: string[] = [];
  let success = 0, fail = 0;
  for (const doc of docs) {
    try {
      const text = `${doc.title}\n${(doc.content ?? "").slice(0, 2000)}`;
      const embedding = await generateEmbedding(text);
      const { error: updateError } = await supabase
        .from("ai_knowledge_base")
        .update({ embedding: `[${embedding.join(",")}]` })
        .eq("id", doc.id);
      if (updateError) throw new Error(updateError.message);
      success++;
    } catch (e) {
      const msg = e instanceof Error ? e.message.slice(0, 200) : String(e);
      if (errors.length < 5) errors.push(msg);
      fail++;
    }
  }

  return Response.json({
    message: `تم ${success}، فشل ${fail}`,
    success,
    failed: fail,
    sample_errors: errors,
  });
}
