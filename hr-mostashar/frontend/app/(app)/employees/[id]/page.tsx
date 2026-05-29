"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { fetchEmployee } from "@/lib/hrms-api";
import { Employee, GENDER_LABELS, MARITAL_STATUS_LABELS, MILITARY_STATUS_LABELS, EDUCATION_LEVEL_LABELS, EMPLOYMENT_TYPE_LABELS, CONTRACT_TYPE_LABELS, EMPLOYEE_STATUS_LABELS } from "@/lib/hrms-types";
import { StatusBadge } from "@/components/hrms/StatusBadge";

const tabs = [
  { id: "personal", label: "البيانات الشخصية" },
  { id: "contact", label: "بيانات الاتصال" },
  { id: "job", label: "بيانات الوظيفة" },
  { id: "financial", label: "البيانات المالية" },
  { id: "insurance", label: "التأمينات" },
  { id: "documents", label: "المستندات" },
];

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("personal");

  useEffect(() => {
    fetchEmployee(id).then((data) => {
      setEmployee(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-12 text-center text-gray-500">جاري التحميل...</div>;
  if (!employee) return <div className="p-12 text-center text-gray-500">الموظف غير موجود</div>;

  function fullName() {
    if (!employee) return "";
    return employee.full_name_arabic || `${employee.first_name} ${employee.middle_name} ${employee.last_name}`;
  }

  function InfoRow({ label, value }: { label: string; value: string | number | undefined }) {
    if (!value) return null;
    return (
      <div className="py-2">
        <dt className="text-sm text-gray-500">{label}</dt>
        <dd className="text-sm font-medium text-[#0D1B2A] mt-0.5">{value}</dd>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#C9A84C]/20 flex items-center justify-center text-[#0D1B2A] text-2xl font-bold">
                {employee.first_name?.[0] || "?"}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#0D1B2A]">{fullName()}</h1>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm text-gray-500 font-mono">{employee.employee_code}</span>
                  {employee.status && <StatusBadge status={employee.status as any} />}
                </div>
              </div>
            </div>
            <Link
              href={`/employees/${id}/edit`}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
            >
              تعديل البيانات
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tabs */}
        <div className="bg-white rounded-xl border border-gray-200 mb-6">
          <div className="flex overflow-x-auto border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-[#C9A84C] text-[#C9A84C]"
                    : "border-transparent text-gray-500 hover:text-[#0D1B2A]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="p-6">
            {activeTab === "personal" && (
              <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6">
                <InfoRow label="الاسم الكامل" value={fullName()} />
                <InfoRow label="الرقم القومي" value={employee.national_id} />
                <InfoRow label="تاريخ الميلاد" value={employee.date_of_birth} />
                <InfoRow label="النوع" value={employee.gender ? GENDER_LABELS[employee.gender as keyof typeof GENDER_LABELS] : undefined} />
                <InfoRow label="الحالة الاجتماعية" value={employee.marital_status ? MARITAL_STATUS_LABELS[employee.marital_status as keyof typeof MARITAL_STATUS_LABELS] : undefined} />
                <InfoRow label="الجنسية" value={employee.nationality} />
                <InfoRow label="الديانة" value={employee.religion} />
                <InfoRow label="فصيلة الدم" value={employee.blood_type} />
                <InfoRow label="الحالة العسكرية" value={employee.military_status ? MILITARY_STATUS_LABELS[employee.military_status as keyof typeof MILITARY_STATUS_LABELS] : undefined} />
              </dl>
            )}

            {activeTab === "contact" && (
              <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6">
                <InfoRow label="الموبايل" value={employee.mobile_phone} />
                <InfoRow label="الموبايل 2" value={employee.mobile_phone_2} />
                <InfoRow label="البريد الإلكتروني" value={employee.email} />
                <InfoRow label="الهاتف الأرضي" value={employee.home_phone} />
                <InfoRow label="المحافظة" value={employee.governorate} />
                <InfoRow label="المدينة" value={employee.city} />
                <InfoRow label="العنوان" value={employee.address} />
                <InfoRow label="جهة اتصال الطوارئ" value={employee.emergency_contact_name} />
                <InfoRow label="صلة القرابة" value={employee.emergency_contact_relation} />
                <InfoRow label="هاتف الطوارئ" value={employee.emergency_contact_phone} />
              </dl>
            )}

            {activeTab === "job" && (
              <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6">
                <InfoRow label="القسم" value={employee.department_name} />
                <InfoRow label="المسمى الوظيفي" value={employee.job_title_arabic} />
                <InfoRow label="نوع التوظيف" value={employee.employment_type ? EMPLOYMENT_TYPE_LABELS[employee.employment_type as keyof typeof EMPLOYMENT_TYPE_LABELS] : undefined} />
                <InfoRow label="نوع العقد" value={employee.contract_type ? CONTRACT_TYPE_LABELS[employee.contract_type as keyof typeof CONTRACT_TYPE_LABELS] : undefined} />
                <InfoRow label="تاريخ التعيين" value={employee.hiring_date} />
                <InfoRow label="بداية العقد" value={employee.contract_start_date} />
                <InfoRow label="نهاية العقد" value={employee.contract_end_date} />
                <InfoRow label="نهاية فترة الاختبار" value={employee.probation_end_date} />
                <InfoRow label="المؤهل" value={employee.education_level ? EDUCATION_LEVEL_LABELS[employee.education_level as keyof typeof EDUCATION_LEVEL_LABELS] : undefined} />
                <InfoRow label="الجامعة" value={employee.university} />
                <InfoRow label="الكلية" value={employee.faculty} />
                <InfoRow label="سنة التخرج" value={employee.graduation_year} />
              </dl>
            )}

            {activeTab === "financial" && (
              <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6">
                <InfoRow label="الراتب الأساسي" value={employee.basic_salary ? `${Number(employee.basic_salary).toLocaleString("ar-EG")} ج.م` : undefined} />
                <InfoRow label="بدل سكن" value={employee.housing_allowance ? `${Number(employee.housing_allowance).toLocaleString("ar-EG")} ج.م` : undefined} />
                <InfoRow label="بدل انتقال" value={employee.transportation_allowance ? `${Number(employee.transportation_allowance).toLocaleString("ar-EG")} ج.م` : undefined} />
                <InfoRow label="بدل طعام" value={employee.food_allowance ? `${Number(employee.food_allowance).toLocaleString("ar-EG")} ج.م` : undefined} />
                <InfoRow label="بدلات أخرى" value={employee.other_allowances ? `${Number(employee.other_allowances).toLocaleString("ar-EG")} ج.م` : undefined} />
                <InfoRow
                  label="إجمالي الراتب"
                  value={[
                    employee.basic_salary,
                    employee.housing_allowance,
                    employee.transportation_allowance,
                    employee.food_allowance,
                    employee.other_allowances,
                  ].reduce((sum, val) => sum + (Number(val) || 0), 0).toLocaleString("ar-EG") + " ج.م"}
                />
              </dl>
            )}

            {activeTab === "insurance" && (
              <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6">
                <InfoRow label="مؤمن عليه" value={employee.is_insured ? "نعم" : "لا"} />
                <InfoRow label="رقم التأمينات" value={employee.insurance_number} />
                <InfoRow label="مكتب التأمينات" value={employee.insurance_office} />
                <InfoRow label="بداية التأمين" value={employee.insurance_start_date} />
                <InfoRow label="رتب التأمين" value={employee.insurance_salary ? `${Number(employee.insurance_salary).toLocaleString("ar-EG")} ج.م` : undefined} />
                <InfoRow label="اسم البنك" value={employee.bank_name} />
                <InfoRow label="فرع البنك" value={employee.bank_branch} />
                <InfoRow label="رقم الحساب" value={employee.bank_account_number} />
              </dl>
            )}

            {activeTab === "documents" && (
              <div className="text-center py-8 text-gray-500">
                <p>لا توجد مستندات مرفقة</p>
                <button className="mt-3 px-4 py-2 bg-[#C9A84C] text-white rounded-lg text-sm">
                  رفع مستند
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
