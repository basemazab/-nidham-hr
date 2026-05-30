import { createClient } from "@/lib/supabase/server";
import { generateEmbedding, chunkText } from "@/lib/ai/embeddings";

export const maxDuration = 300;

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, company_id")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return new Response(JSON.stringify({ error: "مخصص للمدير فقط" }), { status: 403 });
  }

  let body: { docId?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }

  let query = supabase
    .from("ai_knowledge_base")
    .select("id, title, content, company_id")
    .is("embedding", null);

  if (body.docId) query = query.eq("id", body.docId);

  const { data: docs, error } = await query;
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
  if (!docs || docs.length === 0) {
    return new Response(JSON.stringify({ message: "لا توجد مستندات تحتاج تضمين", count: 0 }), { status: 200 });
  }

  let success = 0;
  let failed = 0;

  for (const doc of docs) {
    try {
      const textToEmbed = `${doc.title}\n${(doc.content ?? "").slice(0, 2000)}`;
      const embedding = await generateEmbedding(textToEmbed);

      const { error: updErr } = await supabase
        .from("ai_knowledge_base")
        .update({ embedding: `[${embedding.join(",")}]` })
        .eq("id", doc.id);

      if (updErr) {
        failed++;
      } else {
        success++;
      }
    } catch (e) {
      failed++;
    }
  }

  return new Response(
    JSON.stringify({
      message: `تم تضمين ${success} مستند${failed > 0 ? `، فشل ${failed}` : ""}`,
      success,
      failed,
      total: docs.length,
    }),
    { status: 200 },
  );
}
