// ============================================================================
// POST /api/tools/memo — AI structured official-memo generator
// ============================================================================
// Turns a free-form request ("اكتب مذكرة لإدارة الحسابات بصرف مستحقات…") into a
// STRUCTURED memo object the front-end renders into a professional, print-ready
// document (PDF via browser print) or an Excel sheet. The AI also performs any
// arithmetic the user asks for and returns it as a table with a correct total.
//
// Returns structured JSON (not prose) so the visual template stays consistent
// and "awe-level" regardless of the model's wording.

import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateText } from "ai";
import { callWithFallback, pickAgentModelLargeContext } from "@/lib/ai-models";

export const maxDuration = 60;

type MemoTable = {
  columns: string[];
  rows: string[][];
  total: { label: string; value: string } | null;
} | null;

type Memo = {
  lang: "ar" | "en";
  docType: string;
  referenceNo: string;
  toLine: string;
  fromLine: string;
  subject: string;
  greeting: string;
  bodyParagraphs: string[];
  table: MemoTable;
  closing: string;
  signatureName: string;
  signatureTitle: string;
  notes: string | null;
};

// Models occasionally wrap JSON in prose or ```fences```. Pull out the first
// balanced-looking {...} block and parse it.
function extractJson(text: string): Record<string, unknown> {
  let t = text.trim();
  t = t.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) throw new Error("no json");
  return JSON.parse(t.slice(start, end + 1)) as Record<string, unknown>;
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
}

function asTable(v: unknown): MemoTable {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const columns = asStringArray(o.columns);
  const rowsRaw = Array.isArray(o.rows) ? o.rows : [];
  const rows = rowsRaw
    .map((r) => (Array.isArray(r) ? r.map((c) => String(c ?? "")) : []))
    .filter((r) => r.length > 0);
  if (columns.length === 0 || rows.length === 0) return null;
  let total: { label: string; value: string } | null = null;
  if (o.total && typeof o.total === "object") {
    const to = o.total as Record<string, unknown>;
    if (to.label != null && to.value != null) {
      total = { label: String(to.label), value: String(to.value) };
    }
  }
  return { columns, rows, total };
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "غير مصرّح" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const request = String((body as Record<string, unknown>)?.request ?? "").trim();
    if (!request) return Response.json({ error: "اكتب طلبك الأول" }, { status: 400 });
    if (request.length > 4000) {
      return Response.json({ error: "الطلب طويل جدًا — اختصره شوية" }, { status: 400 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id, full_name, role")
      .eq("id", user.id)
      .maybeSingle<{ company_id: string | null; full_name: string | null; role: string }>();

    if (!profile || (profile.role !== "admin" && profile.role !== "manager")) {
      return Response.json({ error: "متاح للمديرين فقط" }, { status: 403 });
    }

    let companyName = "الشركة";
    if (profile.company_id) {
      const { data: company } = await supabase
        .from("companies")
        .select("name")
        .eq("id", profile.company_id)
        .maybeSingle<{ name: string }>();
      if (company?.name) companyName = company.name;
    }

    const prompt = `أنت خبير محترف في صياغة المراسلات والمذكرات الإدارية الرسمية للشركات المصرية، دقيق في اللغة وفي الحساب.

طلب المستخدم (حوّله إلى مذكرة/مستند رسمي):
"""
${request}
"""

السياق:
- اسم الشركة: ${companyName}
- اسم مُصدِر المذكرة (للتوقيع الافتراضي): ${profile.full_name || "مدير الموارد البشرية"}

تعليمات صارمة:
1. اكتب بلغة عربية فصحى رسمية راقية، صحيحة إملائيًا ونحويًا تمامًا، وبأسلوب إداري محترم. لو طلب المستخدم لغة أخرى (مثل الإنجليزية) أو كتب طلبه بها، اكتب بنفس اللغة واضبط "lang" على "en".
2. لو الطلب يتضمن مبالغ أو بنود أو حسابات (مثل صرف مستحقات/سلفة/فاتورة)، احسبها بدقة تامة وضعها في "table" مع صف الإجمالي الصحيح. لو لا يوجد ما يُحسب اجعل "table" = null.
3. الفقرات قصيرة وواضحة ومهنية. لا تخترع بيانات غير موجودة في الطلب؛ لو نقص اسم/تاريخ اتركه عامًا أو بصيغة مناسبة.
4. أنشئ رقمًا مرجعيًا منطقيًا (مثل: م.ر/2026/0145).

أعِد ردك على هيئة JSON صالح فقط، بدون أي نص أو شرح أو علامات markdown خارج الـ JSON، بهذا الشكل بالضبط:
{
  "lang": "ar",
  "docType": "نوع المستند (مثل: مذكرة داخلية / مذكرة صرف مستحقات / مذكرة طلب موافقة)",
  "referenceNo": "الرقم المرجعي",
  "toLine": "إلى: الجهة/الشخص المُرسَل إليه",
  "fromLine": "من: الجهة المُصدِرة",
  "subject": "الموضوع: ...",
  "greeting": "تحية طيبة وبعد،",
  "bodyParagraphs": ["الفقرة الأولى", "الفقرة الثانية"],
  "table": null,
  "closing": "وتفضلوا بقبول وافر الاحترام والتقدير،",
  "signatureName": "اسم المُوقِّع",
  "signatureTitle": "المسمى الوظيفي للمُوقِّع",
  "notes": null
}`;

    const result = await callWithFallback(
      (picked) =>
        generateText({ model: picked.model, prompt, temperature: 0.3, maxRetries: 0 }),
      pickAgentModelLargeContext,
    );

    let parsed: Record<string, unknown> | null = null;
    try {
      parsed = extractJson(result.text);
    } catch {
      parsed = null;
    }

    let memo: Memo;
    if (parsed) {
      memo = {
        lang: parsed.lang === "en" ? "en" : "ar",
        docType: String(parsed.docType ?? "مذكرة"),
        referenceNo: String(parsed.referenceNo ?? ""),
        toLine: String(parsed.toLine ?? ""),
        fromLine: String(parsed.fromLine ?? companyName),
        subject: String(parsed.subject ?? ""),
        greeting: String(parsed.greeting ?? "تحية طيبة وبعد،"),
        bodyParagraphs: asStringArray(parsed.bodyParagraphs),
        table: asTable(parsed.table),
        closing: String(parsed.closing ?? "وتفضلوا بقبول وافر الاحترام والتقدير،"),
        signatureName: String(parsed.signatureName || profile.full_name || ""),
        signatureTitle: String(parsed.signatureTitle ?? ""),
        notes: parsed.notes != null && String(parsed.notes).trim() ? String(parsed.notes) : null,
      };
      if (memo.bodyParagraphs.length === 0) {
        memo.bodyParagraphs = result.text
          .split(/\n{2,}/)
          .map((p) => p.trim())
          .filter(Boolean);
      }
    } else {
      // Last-resort fallback: never hard-fail — wrap raw text into a memo.
      memo = {
        lang: "ar",
        docType: "مذكرة",
        referenceNo: "",
        toLine: "",
        fromLine: companyName,
        subject: "",
        greeting: "تحية طيبة وبعد،",
        bodyParagraphs: result.text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean),
        table: null,
        closing: "وتفضلوا بقبول وافر الاحترام والتقدير،",
        signatureName: profile.full_name || "",
        signatureTitle: "",
        notes: null,
      };
    }

    return Response.json({
      ok: true,
      memo,
      companyName,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "خطأ غير متوقع";
    return Response.json({ error: msg }, { status: 500 });
  }
}
