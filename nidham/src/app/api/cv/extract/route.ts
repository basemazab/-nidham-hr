// /api/cv/extract — pull raw text from an uploaded PDF/Word/txt for the CV
// builder. PDF first via the local byte-level parser (instant, no AI), DOCX via
// mammoth. HR-gated.

import { createClient } from "@/lib/supabase/server";
import { extractPdfText } from "@/lib/pdf-extract";

export const maxDuration = 30;
const MAX = 5 * 1024 * 1024;

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let file: File | null = null;
  try {
    const form = await req.formData();
    const f = form.get("file");
    if (f instanceof File && f.size > 0) file = f;
  } catch {
    return Response.json({ error: "فشل قراءة الطلب" }, { status: 400 });
  }
  if (!file) return Response.json({ error: "مفيش ملف" }, { status: 400 });
  if (file.size > MAX) return Response.json({ error: "الملف كبير (الحد 5 MB)" }, { status: 400 });

  const lower = file.name.toLowerCase();
  try {
    if (lower.endsWith(".txt") || file.type.startsWith("text/")) {
      return Response.json({ text: (await file.text()).slice(0, 18000) });
    }
    if (lower.endsWith(".docx") || file.type.includes("wordprocessingml")) {
      const mammoth = (await import("mammoth")).default;
      const buf = Buffer.from(await file.arrayBuffer());
      const { value } = await mammoth.extractRawText({ buffer: buf });
      return Response.json({ text: (value ?? "").slice(0, 18000) });
    }
    if (lower.endsWith(".pdf") || file.type === "application/pdf") {
      const text = await extractPdfText(file);
      return Response.json({ text: text.slice(0, 18000) });
    }
    return Response.json({ error: "النوع مش مدعوم — PDF أو Word أو نص" }, { status: 400 });
  } catch (err) {
    return Response.json(
      { error: `تعذّر قراءة الملف — الصق النص يدويًا. (${err instanceof Error ? err.message.slice(0, 100) : ""})` },
      { status: 502 },
    );
  }
}
