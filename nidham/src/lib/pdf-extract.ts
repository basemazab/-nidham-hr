// CV text extraction for uploaded resumes.
// Supports PDF (minimal self-contained parser) and DOCX (mammoth).
// PDF version searches stream boundaries at the byte level.
// Decompresses FlateDecode streams with Node.js built-in zlib.

import { inflateSync } from "zlib";

const MAX_BYTES = 5 * 1024 * 1024;

// ── Byte-level helpers ───────────────────────────────────────────────

// PDF stream markers — search at byte level to handle binary content
// stream/endstream should appear at the start of a line in valid PDFs.
const STREAM_LF = new TextEncoder().encode("stream\n");
const STREAM_CRLF = new TextEncoder().encode("stream\r\n");
const STREAM_CR = new TextEncoder().encode("stream\r");
const ENDSTREAM_LF = new TextEncoder().encode("\nendstream");
const ENDSTREAM_CRLF = new TextEncoder().encode("\rendstream");
const ENDSTREAM_PLAIN = new TextEncoder().encode("endstream"); // fallback

function indexOfSeq(data: Uint8Array, seq: Uint8Array, from = 0): number {
  outer: for (let i = from; i <= data.length - seq.length; i++) {
    for (let j = 0; j < seq.length; j++) {
      if (data[i + j] !== seq[j]) continue outer;
    }
    return i;
  }
  return -1;
}

type StreamEntry = {
  data: Uint8Array;
  filter: string | null;
};

function findStreams(bytes: Uint8Array): StreamEntry[] {
  const MAX_STREAMS = 500; // safety limit
  const results: StreamEntry[] = [];
  let pos = 0;

  while (pos < bytes.length && results.length < MAX_STREAMS) {
    // Search for stream followed by newline
    let smPos = indexOfSeq(bytes, STREAM_LF, pos);
    let streamLen = STREAM_LF.length;
    if (smPos === -1) {
      smPos = indexOfSeq(bytes, STREAM_CRLF, pos);
      streamLen = STREAM_CRLF.length;
    }
    if (smPos === -1) {
      smPos = indexOfSeq(bytes, STREAM_CR, pos);
      streamLen = STREAM_CR.length;
    }
    if (smPos === -1) break;

    // Look backwards up to 2000 bytes for the dictionary (<< ... >>)
    const dictStart = Math.max(0, smPos - 2000);
    const dictChunk = new TextDecoder("utf-8", { fatal: false }).decode(
      bytes.slice(dictStart, smPos),
    );
    const lastEnd = dictChunk.lastIndexOf(">>");
    const dictStr = lastEnd >= 0
      ? (() => {
          const start = dictChunk.lastIndexOf("<<", lastEnd);
          return start >= 0 ? dictChunk.slice(start, lastEnd + 2) : "";
        })()
      : "";

    // Extract Filter name and content type from dictionary
    let filter: string | null = null;
    let subtype: string | null = null;
    if (dictStr) {
      const filterM = dictStr.match(/\/Filter\s+(?:\/([A-Za-z]\w*)|\[([^\]]*)\])/);
      if (filterM) {
        filter = filterM[1] || filterM[2] || null;
      }
      const subM = dictStr.match(/\/Subtype\s+\/([A-Za-z]\w*)/);
      if (subM) subtype = subM[1];
    }

    // Skip image streams (no text content)
    if (subtype === "Image") { pos = smPos + 1; continue; }

    const dataStart = smPos + streamLen;
    // Find endstream (should be at start of line in valid PDFs)
    let esPos = indexOfSeq(bytes, ENDSTREAM_LF, dataStart);
    let esLen = ENDSTREAM_LF.length;
    if (esPos === -1) {
      esPos = indexOfSeq(bytes, ENDSTREAM_CRLF, dataStart);
      esLen = ENDSTREAM_CRLF.length;
    }
    if (esPos === -1) {
      // Fallback for unusual PDFs: search for plain "endstream"
      esPos = indexOfSeq(bytes, ENDSTREAM_PLAIN, dataStart);
      esLen = ENDSTREAM_PLAIN.length;
    }
    if (esPos === -1) { pos = smPos + 1; continue; }
    if (dataStart >= esPos) { pos = smPos + 1; continue; }

    // data runs up to (but not including) the newline/CR before "endstream"
    const data = bytes.slice(dataStart, esPos);
    results.push({ data, filter });
    pos = esPos + esLen;
  }

  return results;
}

// ── Text extraction from content streams ─────────────────────────────

function decodePdfString(raw: string): string {
  const out: string[] = [];
  let i = 0;
  while (i < raw.length) {
    if (raw[i] === "\\") {
      const c = raw[i + 1];
      if (c === "n") { out.push("\n"); i += 2; continue; }
      if (c === "r") { out.push("\r"); i += 2; continue; }
      if (c === "t") { out.push("\t"); i += 2; continue; }
      if (c === "\\") { out.push("\\"); i += 2; continue; }
      if (c === "(") { out.push("("); i += 2; continue; }
      if (c === ")") { out.push(")"); i += 2; continue; }
      if (/[0-7]/.test(c)) {
        const o = raw.slice(i + 1, i + 4);
        if (/^[0-7]{3}$/.test(o)) { out.push(String.fromCharCode(parseInt(o, 8))); i += 4; continue; }
      }
      out.push(c); i += 2;
    } else {
      out.push(raw[i]); i++;
    }
  }
  return out.join("");
}

function decodeHexString(hex: string): string {
  const bytes: number[] = [];
  for (let i = 0; i < hex.length; i += 2) {
    const b = parseInt(hex.slice(i, i + 2), 16);
    if (!isNaN(b)) bytes.push(b);
  }
  return new TextDecoder("utf-8").decode(new Uint8Array(bytes));
}

function extractTextFromOperators(content: string): string[] {
  const results: string[] = [];
  let i = 0;

  while (i < content.length) {
    if (/\s/.test(content[i])) { i++; continue; }

    // (string) Tj or (string) ' or (string) "
    if (content[i] === "(") {
      let depth = 1, j = i + 1;
      while (j < content.length && depth > 0) {
        if (content[j] === "\\") { j += 2; continue; }
        if (content[j] === "(") depth++;
        if (content[j] === ")") depth--;
        j++;
      }
      const rawStr = content.slice(i + 1, j - 1);
      const after = content.slice(j).trimStart();
      if (/^Tj\b|^'\s|^"/.test(after)) {
        results.push(decodePdfString(rawStr));
      }
      i = j;
      continue;
    }

    // <hex> Tj
    if (content[i] === "<") {
      const end = content.indexOf(">", i);
      if (end === -1) { i++; continue; }
      const after = content.slice(end + 1).trimStart();
      if (/^Tj\b/.test(after)) {
        results.push(decodeHexString(content.slice(i + 1, end)));
      }
      i = end + 1;
      continue;
    }

    // [(string) num (string) ...] TJ
    if (content[i] === "[") {
      let depth = 1, j = i + 1;
      while (j < content.length && depth > 0) {
        if (content[j] === "[") depth++;
        if (content[j] === "]") depth--;
        j++;
      }
      const arrayContent = content.slice(i + 1, j - 1);
      let k = 0;
      while (k < arrayContent.length) {
        if (/\s/.test(arrayContent[k])) { k++; continue; }
        if (arrayContent[k] === "(") {
          let d = 1, l = k + 1;
          while (l < arrayContent.length && d > 0) {
            if (arrayContent[l] === "\\") { l += 2; continue; }
            if (arrayContent[l] === "(") d++;
            if (arrayContent[l] === ")") d--;
            l++;
          }
          results.push(decodePdfString(arrayContent.slice(k + 1, l - 1)));
          k = l;
        } else if (arrayContent[k] === "<") {
          const e = arrayContent.indexOf(">", k);
          if (e === -1) { k++; continue; }
          results.push(decodeHexString(arrayContent.slice(k + 1, e)));
          k = e + 1;
        } else { k++; }
      }
      i = j;
      continue;
    }
    i++;
  }
  return results;
}

function extractFromStream(streamBytes: Uint8Array, filter: string | null): string[] | null {
  // Strip trailing whitespace/CR/LF that some PDF generators put before endstream
  let data = streamBytes;
  while (data.length > 0 && (data[data.length - 1] === 0x0a || data[data.length - 1] === 0x0d || data[data.length - 1] <= 0x20)) {
    data = data.slice(0, -1);
  }
  if (data.length === 0) return null;

  let decompressed: Uint8Array | null = null;

  if (filter === "FlateDecode") {
    try {
      decompressed = inflateSync(data);
    } catch { return null; }
  } else if (filter === "ASCIIHexDecode" || filter === "AHx") {
    const asText = new TextDecoder("utf-8", { fatal: false }).decode(data);
    const hex = asText.replace(/[^0-9A-Fa-f]/g, "");
    try {
      const bytesOut: number[] = [];
      for (let i = 0; i < hex.length; i += 2) {
        const b = parseInt(hex.slice(i, i + 2), 16);
        if (!isNaN(b)) bytesOut.push(b);
      }
      decompressed = new Uint8Array(bytesOut);
    } catch { return null; }
  } else if (filter === null || filter === undefined) {
    decompressed = data;
  } else {
    return null; // Unknown filter
  }

  const text = new TextDecoder("utf-8", { fatal: false }).decode(decompressed);
  return extractTextFromOperators(text);
}

// ── DOCX extraction (mammoth) ────────────────────────────────────────

async function extractDocxText(file: File): Promise<string> {
  const mammoth = await import("mammoth");
  const arrayBuf = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: arrayBuf });
  const text = result.value.trim();
  if (!text || text.length < 10) {
    throw new Error(
      "نص الـ Word فارغ أو قصير جدًا.",
    );
  }
  return text;
}

// ── Exported functions ────────────────────────────────────────────────

/**
 * Extract text from a PDF file using the custom byte-level parser.
 */
export async function extractPdfText(file: File): Promise<string> {
  if (file.size === 0) throw new Error("الملف فاضي");
  if (file.size > MAX_BYTES) {
    throw new Error(
      `الملف كبير جدًا (${(file.size / 1024 / 1024).toFixed(1)} MB). الحد الأقصى 5 MB.`,
    );
  }

  const lowerName = file.name.toLowerCase();
  if (!lowerName.endsWith(".pdf") && file.type !== "application/pdf") {
    throw new Error("لازم الملف يكون PDF");
  }

  const arrayBuf = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuf);

  // Validate PDF header
  const header = new TextDecoder("utf-8", { fatal: false }).decode(bytes.slice(0, 10));
  if (!header.includes("%PDF-")) {
    throw new Error("الملف مش صيغة PDF صحيحة");
  }

  // Find and process all streams
  let foundTexts: string[] = [];
  const streams = findStreams(bytes);
  for (const s of streams) {
    const texts = extractFromStream(s.data, s.filter);
    if (texts && texts.length > 0) {
      foundTexts.push(...texts);
    }
  }

  // Also try extracting from the raw text (catches uncompressed inline content)
  const rawText = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  const inlineTexts = extractTextFromOperators(rawText);
  if (inlineTexts.length > 0) {
    foundTexts.push(...inlineTexts);
  }

  // Deduplicate and filter
  const seen = new Set<string>();
  const unique = foundTexts.filter((t) => {
    const key = t.trim().toLowerCase();
    if (seen.has(key) || t.trim().length < 2) return false;
    seen.add(key);
    return true;
  });

  if (unique.length === 0) {
    throw new Error(
      "نص الـ PDF فارغ أو قصير جدًا — يمكن يكون الملف مسحوب من صور (scanned).",
    );
  }

  let result = unique.join(" ");
  result = result.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();

  if (result.length < 30) {
    throw new Error(
      "نص الـ PDF فارغ أو قصير جدًا — يمكن يكون الملف مسحوب من صور (scanned).",
    );
  }

  return result;
}

/**
 * Auto-detect file type (PDF or DOCX) and extract text.
 * Returns null when no recognizable CV file is provided (for no-CV submissions).
 */
export async function extractCvText(file: File): Promise<string | null> {
  if (file.size === 0) return null;
  if (file.size > MAX_BYTES) {
    throw new Error(
      `الملف كبير جدًا (${(file.size / 1024 / 1024).toFixed(1)} MB). الحد الأقصى 5 MB.`,
    );
  }

  const lowerName = file.name.toLowerCase();

  if (lowerName.endsWith(".pdf") || file.type === "application/pdf") {
    return extractPdfText(file);
  }

  if (lowerName.endsWith(".docx") || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    return extractDocxText(file);
  }

  if (lowerName.endsWith(".doc") || file.type === "application/msword") {
    throw new Error(
      "صيغة DOC القديمة غير مدعومة. لو سمحت حول الملف لـ DOCX أو PDF.",
    );
  }

  throw new Error("صيغة الملف مش مدعومة. الدعم متاح لـ PDF و DOCX.");
}
