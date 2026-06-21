// ============================================================================
// /dashboard/forms/advance-request — Salary advance request (طلب سلفة)
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
  SignatureBlock,
  FormFooter,
} from "@/components/forms/form-pieces";

type SearchParams = Promise<{ employeeId?: string }>;

export default async function AdvanceRequestPage({
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
  const ctx = await resolveFormContext({ employeeId: sp.employeeId, formTypeCode: "ADV" });
  const emp = ctx.employee;

  return (
    <FormShell
      title="طلب سلفة / مقدم"
      filename={`advance-request-${emp?.full_name ?? "blank"}-${ctx.today}`}
      preFilledFor={emp?.full_name ?? null}
      blankHref="/dashboard/forms/advance-request"
    >
      <FormLetterhead company={ctx.company} reference={ctx.reference} date={ctx.today} subtitle="طلب سلفة / مقدم" />

      <div className="px-12 py-8 font-cairo">
        <h1 className="text-center text-xl font-black text-slate-900 mb-6 border-b-2 border-slate-200 pb-2">
          نموذج طلب سلفة
        </h1>

        <SectionTitle number="١" title="بيانات الموظف" />
        <div className="grid grid-cols-2 gap-x-8 gap-y-1 mb-5">
          <FieldRow label="الاسم" value={emp?.full_name} />
          <FieldRow label="كود الموظف" value={emp?.employee_code} />
          <FieldRow label="الوظيفة" value={emp?.job_title} />
          <FieldRow label="الإدارة" value={emp?.department} />
        </div>

        <SectionTitle number="٢" title="تفاصيل السلفة" />
        <div className="grid grid-cols-2 gap-x-8 gap-y-1 mb-3">
          <FieldRow label="المبلغ المطلوب (رقمًا)" />
          <FieldRow label="المبلغ (كتابةً)" />
          <FieldRow label="عدد أقساط السداد" />
          <FieldRow label="قيمة القسط الشهري" />
        </div>
        <FieldLine label="سبب طلب السلفة" rows={2} />

        <SectionTitle number="٣" title="إقرار" />
        <p className="text-sm leading-relaxed text-slate-700 mb-10">
          أقرّ أنا الموقّع أدناه بموافقتي على خصم أقساط السلفة المذكورة من راتبي
          الشهري بالقيمة وعدد الأقساط الموضّحين أعلاه حتى السداد الكامل، وفي حالة
          انتهاء الخدمة قبل السداد يُخصم المتبقي من مستحقاتي النهائية.
        </p>

        <div className="grid grid-cols-2 gap-8">
          <SignatureBlock role="توقيع الموظف (مقدّم الطلب)" name={emp?.full_name ?? null} />
          <SignatureBlock role="المدير المباشر" name={null} />
          <SignatureBlock role="اعتماد الموارد البشرية" name={null} />
          <SignatureBlock role="اعتماد المالية / الحسابات" name={null} showStamp />
        </div>
      </div>

      <FormFooter company={ctx.company} />
    </FormShell>
  );
}
