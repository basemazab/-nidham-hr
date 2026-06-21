// ============================================================================
// /dashboard/forms/leave-request — Leave request (طلب إجازة)
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

export default async function LeaveRequestPage({
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
  const ctx = await resolveFormContext({ employeeId: sp.employeeId, formTypeCode: "LV" });
  const emp = ctx.employee;

  return (
    <FormShell
      title="طلب إجازة"
      filename={`leave-request-${emp?.full_name ?? "blank"}-${ctx.today}`}
      preFilledFor={emp?.full_name ?? null}
      blankHref="/dashboard/forms/leave-request"
    >
      <FormLetterhead company={ctx.company} reference={ctx.reference} date={ctx.today} subtitle="طلب إجازة" />

      <div className="px-12 py-8 font-cairo">
        <h1 className="text-center text-xl font-black text-slate-900 mb-6 border-b-2 border-slate-200 pb-2">
          نموذج طلب إجازة
        </h1>

        <SectionTitle number="١" title="بيانات الموظف" />
        <div className="grid grid-cols-2 gap-x-8 gap-y-1 mb-5">
          <FieldRow label="الاسم" value={emp?.full_name} />
          <FieldRow label="كود الموظف" value={emp?.employee_code} />
          <FieldRow label="الوظيفة" value={emp?.job_title} />
          <FieldRow label="الإدارة" value={emp?.department} />
        </div>

        <SectionTitle number="٢" title="نوع الإجازة" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-5">
          <CheckBox label="سنوية" />
          <CheckBox label="عارضة" />
          <CheckBox label="مرضية" />
          <CheckBox label="بدون أجر" />
          <CheckBox label="وضع / أمومة" />
          <CheckBox label="أخرى: ............" />
        </div>

        <SectionTitle number="٣" title="مدة الإجازة" />
        <div className="grid grid-cols-2 gap-x-8 gap-y-1 mb-5">
          <FieldRow label="من تاريخ" />
          <FieldRow label="إلى تاريخ" />
          <FieldRow label="عدد الأيام" />
          <FieldRow label="تاريخ العودة للعمل" />
          <FieldRow label="الرصيد المتبقي من الإجازات" />
        </div>

        <SectionTitle number="٤" title="بيانات إضافية" />
        <FieldLine label="سبب الإجازة (اختياري)" rows={2} />
        <div className="mt-3">
          <FieldRow label="من يحل محله أثناء الإجازة" />
        </div>

        <div className="grid grid-cols-3 gap-8 mt-10">
          <SignatureBlock role="توقيع الموظف" name={emp?.full_name ?? null} />
          <SignatureBlock role="المدير المباشر" name={null} />
          <SignatureBlock role="اعتماد الموارد البشرية" name={null} showStamp />
        </div>
      </div>

      <FormFooter company={ctx.company} />
    </FormShell>
  );
}
