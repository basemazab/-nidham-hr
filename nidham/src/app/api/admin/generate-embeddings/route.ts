import { createClient } from "@supabase/supabase-js";
import { generateEmbedding } from "@/lib/ai/embeddings";

export const maxDuration = 300;

export async function POST(req: Request) {
  const auth = req.headers.get("authorization")?.replace("Bearer ", "");
  const expected = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!expected || auth !== expected) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    expected,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

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

  let success = 0, fail = 0;
  for (const doc of docs) {
    try {
      const text = `${doc.title}\n${(doc.content ?? "").slice(0, 2000)}`;
      const embedding = await generateEmbedding(text);
      await supabase
        .from("ai_knowledge_base")
        .update({ embedding: `[${embedding.join(",")}]` })
        .eq("id", doc.id);
      success++;
    } catch { fail++; }
  }

  return Response.json({ message: `تم ${success}، فشل ${fail}`, success, failed: fail });
}
