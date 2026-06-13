// ============================================================================
// المستشار القانوني — Egyptian Labor Law investigation + opinion engine
// ============================================================================
// Grounded in قانون العمل المصري رقم 12 لسنة 2003. The model gets the actual
// statutory rules below so the advice cites the right articles and doesn't
// invent law. ADVISORY ONLY — every output carries a disclaimer that it does
// not replace a licensed lawyer / the labour court.

import { z } from "zod";
import { generateObject } from "ai";
import { callWithFallback, pickAgentModelLargeContext } from "@/lib/ai-models";

export const CASE_TYPES = [
  { key: "theft", label: "سرقة أو اختلاس" },
  { key: "absence", label: "غياب أو تأخير متكرر" },
  { key: "negligence", label: "إهمال أو تقصير في العمل" },
  { key: "assault", label: "اعتداء أو مشاجرة" },
  { key: "insubordination", label: "رفض أوامر / عصيان" },
  { key: "secrets", label: "إفشاء أسرار أو منافسة لصاحب العمل" },
  { key: "damage", label: "إتلاف أو خسارة مادية جسيمة" },
  { key: "misconduct", label: "سوء سلوك / إخلال بالنظام" },
  { key: "other", label: "أخرى" },
] as const;

// Statutory grounding — fed to the model so it reasons from the real text.
const LABOR_LAW = `
قواعد قانون العمل المصري رقم 12 لسنة 2003 (مرجعك الإلزامي — لا تخرج عنها):

● الجزاءات التأديبية المسموح بها (م.60) بالترتيب المتدرّج:
1) الإنذار/التنبيه الكتابي
2) الخصم من الأجر (الغرامة)
3) الوقف عن العمل مع الحرمان من الأجر مدة محددة
4) تأجيل موعد استحقاق العلاوة الدورية لمدة لا تجاوز 3 شهور
5) الحرمان من جزء من العلاوة / الحرمان من العلاوة
6) خفض الأجر في حدود معينة
7) الفصل من الخدمة (وفق ضوابط م.69 وبحكم قضائي).

● ضوابط الغرامة (م.61–63): لا تزيد الغرامة عن أجر 5 أيام في الشهر الواحد. لا يجوز توقيع أكثر من جزاء واحد على المخالفة الواحدة. تُسقط المخالفة بمضي مدة، ولا يوقع الجزاء بعد 30 يومًا من ثبوت المخالفة (15 يومًا للتحقيق).

● الضمانات الإجرائية الإلزامية قبل أي جزاء (م.66, 67):
- لا يُوقّع جزاء إلا بعد إخطار العامل كتابةً بما نُسب إليه، وتحقيق كتابي، وسماع أقواله وتحقيق دفاعه.
- في المخالفات التي عقوبتها الفصل أو الخصم أكثر من 5 أيام: التحقيق لازم يكون كتابيًا بمعرفة مختص.
- يجب أن يُوقّع الجزاء خلال المواعيد القانونية وإلا سقط.

● الفصل (م.69 وتعديلاتها): لا يجوز لصاحب العمل فصل العامل من تلقاء نفسه. يجب اللجوء إلى **المحكمة العمالية المختصة** لطلب الفصل خلال 7 أيام من تاريخ علمه بالواقعة؛ والفصل لا يقع إلا بحكم منها. حالات الخطأ الجسيم المبررة لطلب الفصل تشمل: انتحال شخصية أو تقديم مستندات مزورة، خطأ نشأ عنه خسارة جسيمة (بشرط إبلاغ الجهات خلال 24 ساعة)، إفشاء أسرار، المنافسة، تكرار مخالفة رغم توقيع الجزاء، الغياب بدون مبرر أكثر من 20 يومًا متقطعة أو 10 أيام متصلة (بعد إنذار كتابي)، السُكر/التعاطي أثناء العمل، الاعتداء على صاحب العمل/المدير، عدم مراعاة تعليمات السلامة.

● السرقة والاختلاس: جريمة جنائية مستقلة عن الجزاء التأديبي. الإجراء: تحرير محضر بالواقعة + إبلاغ قسم الشرطة/النيابة العامة (بلاغ جنائي) فورًا، مع الاحتفاظ بالأدلة، ثم اللجوء للمحكمة العمالية لطلب الفصل. لا يجوز احتجاز العامل أو تفتيشه قسرًا أو إجباره على الاعتراف — ده اختصاص النيابة/الشرطة فقط.

● ممنوع: أي عقوبة بدنية، الحجز، تفتيش الأشخاص بالقوة، خصم أكثر من الحدود القانونية، الفصل الفوري بدون اللجوء للمحكمة.
`;

// ── Investigation questions ──
export const investigationSchema = z.object({
  intro: z
    .string()
    .describe("سطر تمهيدي للتحقيق بالعربي الفصيح المبسط — يوضح الغرض ويطمئن لحياد التحقيق"),
  questions: z
    .array(z.string())
    .min(5)
    .max(12)
    .describe(
      "أسئلة تحقيق رسمية محايدة تُطرح على العامل بالترتيب المنطقي — تثبّت الواقعة وتسمع دفاعه، مصاغة بصيغة سؤال مباشر",
    ),
});

export type InvestigationResult = z.infer<typeof investigationSchema>;

export function buildInvestigationPrompt(input: {
  employeeName: string;
  employeeTitle?: string | null;
  caseType: string;
  description: string;
  evidence?: string | null;
}): string {
  return `إنت مستشار قانوني متخصص في قانون العمل المصري. مطلوب تجهّز محضر أسئلة تحقيق رسمي يُطرح على العامل في الواقعة دي.

${LABOR_LAW}

بيانات الواقعة:
- العامل: ${input.employeeName}${input.employeeTitle ? ` — ${input.employeeTitle}` : ""}
- نوع الواقعة: ${input.caseType}
- الوصف: ${input.description}
${input.evidence ? `- الأدلة المتاحة: ${input.evidence}` : ""}

اكتب أسئلة التحقيق:
- محايدة وغير موحية، تثبّت تفاصيل الواقعة (الزمان، المكان، كيفية حدوثها) وتسمع دفاع العامل وروايته.
- تشمل سؤاله صراحةً عن علمه بالواقعة وموقفه منها وأي مبررات أو شهود.
- مصاغة بالعربية الرسمية المبسطة المناسبة لمحضر تحقيق.
- ممنوع أي سؤال يُجبر على الاعتراف أو يفترض الإدانة مقدمًا — التحقيق لإثبات الحقيقة مش لإدانة.`;
}

// ── Legal opinion ──
export const legalOpinionSchema = z.object({
  classification: z
    .string()
    .describe("التكييف القانوني للواقعة: هل هي مخالفة تأديبية، خطأ جسيم، أم جريمة جنائية — والأساس"),
  is_established: z
    .enum(["established", "partially", "not_established", "needs_more"])
    .describe(
      "هل المخالفة ثابتة في حق العامل من خلال أقواله والأدلة؟ established=ثابتة، partially=ثابتة جزئيًا، not_established=غير ثابتة، needs_more=محتاج أدلة/تحقيق أكثر",
    ),
  reasoning: z
    .string()
    .describe("تسبيب الرأي بالعربي: تحليل أقوال العامل والأدلة وربطها بالقانون — صريح ومحدد"),
  recommended_action: z
    .string()
    .describe("الإجراء/الجزاء المتدرّج الموصى به وفق القانون مع ذكر المادة (مثلاً: إنذار كتابي م.60، أو طلب الفصل عبر المحكمة العمالية م.69)"),
  legal_articles: z
    .array(z.string())
    .describe("المواد القانونية المنطبقة من قانون 12/2003 — رقم المادة + ملخص بند واحد"),
  procedural_steps: z
    .array(z.string())
    .describe("الخطوات والضمانات الإجرائية الواجبة بالترتيب (إخطار كتابي، تحقيق، سماع دفاع، مهلة، توقيع الجزاء في الميعاد...) — لو جريمة تشمل خطوات البلاغ للنيابة/الشرطة"),
  warnings: z
    .array(z.string())
    .describe("تحذيرات للشركة من إجراءات باطلة أو مخاطر قانونية (فصل فوري بدون محكمة، خصم زائد، إجبار على اعتراف...)"),
  investigation_record: z
    .string()
    .describe("مسودة «محضر تحقيق» رسمي جاهز للطباعة — يلخص الواقعة وأقوال العامل، بصيغة محضر رسمي بالعربية"),
  penalty_decision: z
    .string()
    .describe("مسودة «قرار الجزاء» أو «الإنذار الكتابي» الرسمي الموصى به جاهز للطباعة — أو خطاب طلب الإحالة للمحكمة العمالية لو الفصل"),
});

export type LegalOpinion = z.infer<typeof legalOpinionSchema>;

export function buildLegalOpinionPrompt(input: {
  employeeName: string;
  employeeTitle?: string | null;
  companyName: string;
  caseType: string;
  description: string;
  evidence?: string | null;
  answers: { question: string; answer: string }[];
}): string {
  const qa = input.answers
    .map((a, i) => `${i + 1}) س: ${a.question}\n   ج: ${a.answer || "(لم يُجب)"}`)
    .join("\n");

  return `إنت مستشار قانوني خبير في قانون العمل المصري رقم 12 لسنة 2003. مطلوب رأي قانوني مكتوب في الواقعة دي بعد التحقيق.

${LABOR_LAW}

بيانات القضية:
- الشركة: ${input.companyName}
- العامل: ${input.employeeName}${input.employeeTitle ? ` — ${input.employeeTitle}` : ""}
- نوع الواقعة: ${input.caseType}
- وصف الواقعة: ${input.description}
${input.evidence ? `- الأدلة: ${input.evidence}` : ""}

محضر التحقيق (أقوال العامل):
${qa}

اكتب رأيك القانوني الكامل:
- كيّف الواقعة قانونيًا، وحدد هل المخالفة ثابتة في حق العامل من واقع أقواله والأدلة.
- اقترح الإجراء/الجزاء المتدرّج الصحيح مع المادة القانونية، والتزم بالتدرّج (متقترحش الفصل لمخالفة بسيطة).
- وضّح الضمانات الإجرائية الواجبة وإلا بطل الجزاء.
- لو الواقعة جريمة (سرقة/اختلاس): وضّح إن الجزاء التأديبي شيء والبلاغ الجنائي للنيابة شيء، واذكر خطوات البلاغ، ونبّه إن الفصل لا يكون إلا عبر المحكمة العمالية.
- اكتب مسودة محضر تحقيق ومسودة قرار الجزاء/الإنذار جاهزين للطباعة.
- التزم بالقانون فقط، ولا تخترع مواد أو أرقام. لو محتاج معلومة ناقصة قُلها صراحة.`;
}

export async function generateInvestigation(
  input: Parameters<typeof buildInvestigationPrompt>[0],
): Promise<InvestigationResult> {
  return callWithFallback(
    (picked) =>
      generateObject({
        model: picked.model,
        schema: investigationSchema,
        prompt: buildInvestigationPrompt(input),
        temperature: 0.3,
        maxRetries: 0,
      }).then((r) => r.object),
    pickAgentModelLargeContext,
  );
}

export async function generateLegalOpinion(
  input: Parameters<typeof buildLegalOpinionPrompt>[0],
): Promise<LegalOpinion> {
  return callWithFallback(
    (picked) =>
      generateObject({
        model: picked.model,
        schema: legalOpinionSchema,
        prompt: buildLegalOpinionPrompt(input),
        temperature: 0.25,
        maxRetries: 0,
      }).then((r) => r.object),
    pickAgentModelLargeContext,
  );
}

export const LEGAL_DISCLAIMER =
  "هذا رأي استرشادي مبني على قانون العمل المصري 12/2003 ولا يُغني عن استشارة محامٍ مختص أو حكم المحكمة العمالية. الفصل لا يقع إلا بحكم قضائي.";
