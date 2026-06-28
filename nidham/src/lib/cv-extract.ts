// ============================================================================
// cv-extract.ts — CLEAN CV text extraction with a Gemini-OCR fallback
// ============================================================================
// The byte-level PDF parser is fast/free but mangles many real CVs (subsetted
// fonts / positioned glyphs come out as binary salad). That garbage was being
// stored as the applicant's cv_text and shown to HR. extractCvTextSmart() runs
// the cheap local parser first, and ONLY when its output is missing/garbage
// (or the file is an image) does it pay for Gemini multimodal OCR — which reads
// the file VISUALLY and returns clean text. Quota-efficient: clean text PDFs
// never hit the AI.

import { generateText } from "ai";
import { extractCvText } from "@/lib/pdf-extract";
import { multimodalModelChain, isRetryableError } from "@/lib/ai-models";
// Corrupt-text detection lives in ONE shared module so every CV flow agrees.
import { looksLikeCorruptText } from "./cv-corrupt";

export { looksLikeCorruptText };

async function ocrFileWithGemini(
  file: File,
  isPdf: boolean,
): Promise<string | null> {
  const chain = multimodalModelChain();
  if (chain.length === 0) return null;
  const bytes = new Uint8Array(await file.arrayBuffer());
  for (const { model } of chain) {
    try {
      const { text } = await generateText({
        model,
        temperature: 0,
        maxRetries: 0,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "اقرأ السيرة الذاتية المرفقة من شكلها المرئي على الصفحة (زي ما العين بتشوفها)، واكتب كل النص الظاهر فيها كما تراه حرفيًا — بدون تلخيص أو تعليق. تجاهل أي رموز غير مفهومة.",
              },
              {
                type: "file",
                data: bytes,
                mediaType: isPdf ? "application/pdf" : file.type || "image/jpeg",
              },
            ],
          },
        ],
      });
      const t = (text ?? "").trim();
      if (t.length >= 30) return t;
    } catch (err) {
      if (!isRetryableError(err)) break; // hard failure — stop trying models
    }
  }
  return null;
}

/**
 * Extract clean CV text from an uploaded file. Local parser first; Gemini OCR
 * fallback when the local result is empty/short/garbage (or the file is an
 * image). Returns null if no clean text could be obtained (caller should then
 * rely on the stored original file rather than persist garbage).
 */
export async function extractCvTextSmart(file: File): Promise<string | null> {
  let local = "";
  try {
    local = (await extractCvText(file))?.trim() || "";
  } catch {
    local = "";
  }
  if (local.length >= 80 && !looksLikeCorruptText(local)) return local;

  const lower = file.name.toLowerCase();
  const isPdf = lower.endsWith(".pdf") || file.type === "application/pdf";
  const isImage =
    file.type.startsWith("image/") || /\.(png|jpe?g|webp|gif)$/.test(lower);

  if ((isPdf || isImage) && process.env.GEMINI_API_KEY) {
    const ocr = await ocrFileWithGemini(file, isPdf);
    if (ocr) return ocr;
  }

  // No clean text available — never return garbage.
  return local && !looksLikeCorruptText(local) ? local : null;
}
