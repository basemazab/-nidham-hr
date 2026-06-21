// ============================================================================
// /dashboard/forms/warning-letter — Employee warning / notice (إنذار)
// ============================================================================

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resolveFormContext } from "@/lib/forms";
import { FormShell } from "@/components/forms/form-shell";
import { FormLetterhead } from "@/components/forms/form-letterhead";
import {
  SectionTitle,
  FieldRow,
  FieldLine,
  CheckBox,
  SignatureBlock,
  FormFooter,
} from "@/components/forms/form-pieces";

type SearchParams = Promise<{ employeeId?: string }>;

export default async function WarningLetterPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const sp = await searchParams;
  const ctx = await resolveFormContext({ employeeId: sp.employeeId, formTypeCode: "WRN" });
  const emp = ctx.employee;

  return (
    <FormShell
      title="إنذار / لفت نظر"
      filename={`warning-${emp?.full_name ?? "blank"}-${ctx.today}`}
      preFilledFor={emp?.full_name ?? null}
      blankHref="/dashboard/forms/warning-letter"
    >
      <FormLetterhead company={ctx.company} reference={ctx.reference} date={ctx.today} subtitle="إنذار / لفت نظر" />

      <div className="px-12 py-8 font-cairo">
        <h1 className="text-center text-xl font-black text-slate-900 mb-6 border-b-2 border-slate-200 pb-2">
          إنذار رسمي
        </h1>

        <SectionTitle number="١" title="بيانات الموظف" />
        <div className="grid grid-cols-2 gap-x-8 gap-y-1 mb-5">
          <FieldRow label="الاسم" value={emp?.full_name} />
          <FieldRow label="كود الموظف" value={emp?.employee_code} />
          <FieldRow label="الوظيفة" value={emp?.job_title} />
          <FieldRow label="الإدارة" value={emp?.department} />
        </div>

        <SectionTitle number="٢" title="نوع المخالفة" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
          <CheckBox label="تأخير متكرر" />
          <CheckBox label="غياب بدون إذن" />
          <CheckBox label="تقصير في العمل" />
          <CheckBox label="مخالفة لائحة العمل" />
          <CheckBox label="سوء سلوك" />
          <CheckBox label="أخرى: ..............." />
        </div>

        <SectionTitle number="٣" title="تفاصيل الواقعة" />
        <FieldLine label="وصف المخالفة / الواقعة وتاريخها" rows={3} />

        <SectionTitle number="٤" title="الإجراء المتخذ" />
        <div className="grid grid-cols-3 gap-2 mb-4">
          <CheckBox label="لفت نظر" />
          <CheckBox label="إنذار أول" />
          <CheckBox label="إنذار نهائي" />
        </div>

        <p className="text-sm leading-relaxed text-slate-700 mb-10">
          نحيطكم علمًا بالمخالفة الموضّحة أعلاه، ونلفت نظركم لضرورة الالتزام بلائحة
          العمل وتعليمات الإدارة، علمًا بأن تكرار المخالفة يعرّضكم للجزاءات المنصوص
          عليها في لائحة جزاءات الشركة، وفقًا لأحكام قانون العمل المصري رقم 12 لسنة 2003.
        </p>

        <div className="grid grid-cols-3 gap-8">
          <SignatureBlock role="المدير المباشر" name={null} />
          <SignatureBlock role="مدير الموارد البشرية" name={null} showStamp />
          <SignatureBlock role="إقرار الموظف بالاستلام" name={emp?.full_name ?? null} />
        </div>
      </div>

      <FormFooter company={ctx.company} />
    </FormShell>
  );
}
