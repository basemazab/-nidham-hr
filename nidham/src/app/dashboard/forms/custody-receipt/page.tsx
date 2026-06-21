// ============================================================================
// /dashboard/forms/custody-receipt — Company-property custody receipt (إقرار عهدة)
// ============================================================================

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resolveFormContext } from "@/lib/forms";
import { FormShell } from "@/components/forms/form-shell";
import { FormLetterhead } from "@/components/forms/form-letterhead";
import {
  SectionTitle,
  FieldRow,
  SignatureBlock,
  FormFooter,
} from "@/components/forms/form-pieces";

type SearchParams = Promise<{ employeeId?: string }>;

export default async function CustodyReceiptPage({
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
  const ctx = await resolveFormContext({ employeeId: sp.employeeId, formTypeCode: "CUS" });
  const emp = ctx.employee;

  return (
    <FormShell
      title="إقرار استلام عهدة"
      filename={`custody-${emp?.full_name ?? "blank"}-${ctx.today}`}
      preFilledFor={emp?.full_name ?? null}
      blankHref="/dashboard/forms/custody-receipt"
    >
      <FormLetterhead company={ctx.company} reference={ctx.reference} date={ctx.today} subtitle="إقرار استلام عهدة" />

      <div className="px-12 py-8 font-cairo">
        <h1 className="text-center text-xl font-black text-slate-900 mb-6 border-b-2 border-slate-200 pb-2">
          إقرار استلام عهدة
        </h1>

        <SectionTitle number="١" title="بيانات الموظف" />
        <div className="grid grid-cols-2 gap-x-8 gap-y-1 mb-5">
          <FieldRow label="الاسم" value={emp?.full_name} />
          <FieldRow label="كود الموظف" value={emp?.employee_code} />
          <FieldRow label="الوظيفة" value={emp?.job_title} />
          <FieldRow label="الإدارة" value={emp?.department} />
        </div>

        <SectionTitle number="٢" title="بيان العهدة المستلمة" />
        <table className="w-full border-collapse mb-6 text-sm">
          <thead>
            <tr className="bg-slate-50">
              <th className="border border-slate-300 px-3 py-2 text-right font-bold text-slate-700 w-10">م</th>
              <th className="border border-slate-300 px-3 py-2 text-right font-bold text-slate-700">الصنف</th>
              <th className="border border-slate-300 px-3 py-2 text-right font-bold text-slate-700">الوصف / الموديل</th>
              <th className="border border-slate-300 px-3 py-2 text-right font-bold text-slate-700">الرقم التسلسلي</th>
              <th className="border border-slate-300 px-3 py-2 text-right font-bold text-slate-700">الحالة</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((n) => (
              <tr key={n}>
                <td className="border border-slate-300 px-3 py-3 text-slate-500 h-10">{n}</td>
                <td className="border border-slate-300 px-3 py-3" />
                <td className="border border-slate-300 px-3 py-3" />
                <td className="border border-slate-300 px-3 py-3" />
                <td className="border border-slate-300 px-3 py-3" />
              </tr>
            ))}
          </tbody>
        </table>

        <SectionTitle number="٣" title="إقرار وتعهّد" />
        <p className="text-sm leading-relaxed text-slate-700 mb-10">
          أقرّ أنا الموقّع أدناه باستلامي العهدة المذكورة أعلاه بحالة جيدة، وأتعهّد
          بالمحافظة عليها واستخدامها في أغراض العمل فقط، وردّها بالحالة التي
          استلمتها بها عند انتهاء الخدمة أو عند طلب الشركة، وأتحمّل قيمتها أو قيمة
          إصلاحها في حالة الفقد أو التلف الناتج عن الإهمال.
        </p>

        <div className="grid grid-cols-3 gap-8">
          <SignatureBlock role="الموظف (المستلِم)" name={emp?.full_name ?? null} />
          <SignatureBlock role="المسؤول (المُسلِّم)" name={null} />
          <SignatureBlock role="اعتماد الموارد البشرية" name={null} showStamp />
        </div>
      </div>

      <FormFooter company={ctx.company} />
    </FormShell>
  );
}
