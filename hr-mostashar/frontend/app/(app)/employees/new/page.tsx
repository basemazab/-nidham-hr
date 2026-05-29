"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createEmployee, fetchDepartments, fetchPositions, fetchWorkLocations } from "@/lib/hrms-api";
import {
  Gender, MaritalStatus, MilitaryStatus, EducationLevel, EmploymentType,
  ContractType, EmployeeStatus, PositionGrade, WorkLocationType,
  GENDER_LABELS, MARITAL_STATUS_LABELS, MILITARY_STATUS_LABELS,
  EDUCATION_LEVEL_LABELS, EMPLOYMENT_TYPE_LABELS, CONTRACT_TYPE_LABELS,
} from "@/lib/hrms-types";
import { Department, Position, WorkLocation } from "@/lib/hrms-types";

const steps = [
  { id: "personal", label: "البيانات الشخصية" },
  { id: "contact", label: "بيانات الاتصال" },
  { id: "job", label: "بيانات الوظيفة" },
  { id: "salary", label: "الراتب والتأمينات" },
  { id: "bank", label: "البيانات البنكية" },
];

export default function NewEmployeePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [locations, setLocations] = useState<WorkLocation[]>([]);

  const [form, setForm] = useState({
    first_name: "", middle_name: "", last_name: "",
    national_id: "", date_of_birth: "", gender: Gender.male,
    marital_status: MaritalStatus.single, nationality: "Egyptian",
    religion: "Muslim", blood_type: "", military_status: MilitaryStatus.completed,
    governorate: "", city: "", address: "",
    home_phone: "", mobile_phone: "", mobile_phone_2: "", email: "",
    emergency_contact_name: "", emergency_contact_relation: "", emergency_contact_phone: "",
    education_level: EducationLevel.bachelor, university: "", faculty: "", graduation_year: 2020, grade_value: "",
    department_id: "", position_id: "", work_location_id: "",
    employment_type: EmploymentType.permanent, contract_type: ContractType.unlimited,
    hiring_date: "", contract_start_date: "", contract_end_date: "", probation_end_date: "",
    basic_salary: 0, housing_allowance: 0, transportation_allowance: 0, food_allowance: 0, other_allowances: 0,
    is_insured: false, insurance_number: "", insurance_office: "", insurance_start_date: "", insurance_salary: 0,
    bank_name: "", bank_branch: "", bank_account_number: "",
    status: EmployeeStatus.active, notes: "",
  });

  useEffect(() => {
    fetchDepartments().then(setDepartments).catch(() => {});
    fetchPositions().then(setPositions).catch(() => {});
    fetchWorkLocations().then(setLocations).catch(() => {});
  }, []);

  function update(field: string, value: any) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function next() {
    if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
  }

  function prev() {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  }

  async function submit() {
    setLoading(true);
    setError("");
    try {
      const payload = { ...form };
      if (!payload.basic_salary) payload.basic_salary = 0;
      await createEmployee(payload);
      router.push("/employees");
    } catch (err: any) {
      setError(err.message || "فشل في إضافة الموظف");
    } finally {
      setLoading(false);
    }
  }

  const fields = [
    { step: 0, fields: [
      { key: "first_name", label: "الاسم الأول", type: "text", required: true },
      { key: "middle_name", label: "الاسم الأوسط", type: "text", required: true },
      { key: "last_name", label: "اسم العائلة", type: "text", required: true },
      { key: "national_id", label: "الرقم القومي", type: "text" },
      { key: "date_of_birth", label: "تاريخ الميلاد", type: "date" },
      { key: "gender", label: "النوع", type: "select", options: GENDER_LABELS },
      { key: "marital_status", label: "الحالة الاجتماعية", type: "select", options: MARITAL_STATUS_LABELS },
      { key: "blood_type", label: "فصيلة الدم", type: "text" },
      { key: "military_status", label: "الحالة العسكرية", type: "select", options: MILITARY_STATUS_LABELS },
    ]},
    { step: 1, fields: [
      { key: "mobile_phone", label: "الموبايل", type: "text" },
      { key: "mobile_phone_2", label: "الموبايل 2", type: "text" },
      { key: "email", label: "البريد الإلكتروني", type: "email" },
      { key: "home_phone", label: "الهاتف الأرضي", type: "text" },
      { key: "governorate", label: "المحافظة", type: "text" },
      { key: "city", label: "المدينة", type: "text" },
      { key: "address", label: "العنوان", type: "textarea" },
      { key: "emergency_contact_name", label: "اسم جهة الطوارئ", type: "text" },
      { key: "emergency_contact_relation", label: "صلة القرابة", type: "text" },
      { key: "emergency_contact_phone", label: "هاتف الطوارئ", type: "text" },
    ]},
    { step: 2, fields: [
      { key: "department_id", label: "القسم", type: "select-api", options: departments.map(d => ({ value: d.id, label: d.name_ar })) },
      { key: "position_id", label: "الوظيفة", type: "select-api", options: positions.map(p => ({ value: p.id, label: p.title_ar })) },
      { key: "work_location_id", label: "موقع العمل", type: "select-api", options: locations.map(l => ({ value: l.id, label: l.name })) },
      { key: "employment_type", label: "نوع التوظيف", type: "select", options: EMPLOYMENT_TYPE_LABELS },
      { key: "contract_type", label: "نوع العقد", type: "select", options: CONTRACT_TYPE_LABELS },
      { key: "hiring_date", label: "تاريخ التعيين", type: "date" },
      { key: "contract_start_date", label: "بداية العقد", type: "date" },
      { key: "contract_end_date", label: "نهاية العقد", type: "date" },
      { key: "education_level", label: "المؤهل", type: "select", options: EDUCATION_LEVEL_LABELS },
      { key: "university", label: "الجامعة", type: "text" },
      { key: "faculty", label: "الكلية", type: "text" },
      { key: "graduation_year", label: "سنة التخرج", type: "number" },
    ]},
    { step: 3, fields: [
      { key: "basic_salary", label: "الراتب الأساسي", type: "number" },
      { key: "housing_allowance", label: "بدل سكن", type: "number" },
      { key: "transportation_allowance", label: "بدل انتقال", type: "number" },
      { key: "food_allowance", label: "بدل طعام", type: "number" },
      { key: "other_allowances", label: "بدلات أخرى", type: "number" },
      { key: "is_insured", label: "مؤمن عليه", type: "checkbox" },
      { key: "insurance_number", label: "رقم التأمينات", type: "text" },
      { key: "insurance_office", label: "مكتب التأمينات", type: "text" },
      { key: "insurance_start_date", label: "بداية التأمين", type: "date" },
      { key: "insurance_salary", label: "رتب التأمين", type: "number" },
    ]},
    { step: 4, fields: [
      { key: "bank_name", label: "اسم البنك", type: "text" },
      { key: "bank_branch", label: "فرع البنك", type: "text" },
      { key: "bank_account_number", label: "رقم الحساب", type: "text" },
      { key: "notes", label: "ملاحظات", type: "textarea" },
    ]},
  ];

  function renderField(f: any) {
    const val = (form as any)[f.key];

    if (f.type === "checkbox") {
      return (
        <label key={f.key} className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!val}
            onChange={(e) => update(f.key, e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-[#C9A84C] focus:ring-[#C9A84C]"
          />
          <span className="text-sm text-gray-700">{f.label}</span>
        </label>
      );
    }

    if (f.type === "textarea") {
      return (
        <div key={f.key} className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
          <textarea
            value={val || ""}
            onChange={(e) => update(f.key, e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#C9A84C] focus:border-transparent"
          />
        </div>
      );
    }

    if (f.type === "select" || f.type === "select-api") {
      return (
        <div key={f.key}>
          <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
          <select
            value={val || ""}
            onChange={(e) => update(f.key, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#C9A84C] bg-white"
          >
            <option value="">-- اختر --</option>
            {f.options && Object.entries(f.options).map(([k, v]) => (
              <option key={k} value={typeof v === "object" ? (v as any).value : k}>
                {typeof v === "object" ? (v as any).label : v}
              </option>
            ))}
          </select>
        </div>
      );
    }

    return (
      <div key={f.key}>
        <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
        <input
          type={f.type}
          value={val || ""}
          onChange={(e) => update(f.key, f.type === "number" ? Number(e.target.value) : e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#C9A84C] focus:border-transparent"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#0D1B2A]">إضافة موظف جديد</h1>
              <p className="text-gray-500 mt-1">الخطوة {currentStep + 1} من {steps.length}</p>
            </div>
            <Link href="/employees" className="text-gray-500 hover:text-[#0D1B2A] text-sm">
              إلغاء
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Step indicator */}
        <div className="flex items-center gap-1 mb-8 overflow-x-auto">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center flex-shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                i === currentStep ? "bg-[#C9A84C] text-white" :
                i < currentStep ? "bg-emerald-500 text-white" :
                "bg-gray-200 text-gray-500"
              }`}>
                {i < currentStep ? "✓" : i + 1}
              </div>
              <span className={`mx-2 text-xs ${i === currentStep ? "text-[#0D1B2A] font-medium" : "text-gray-400"}`}>
                {s.label}
              </span>
              {i < steps.length - 1 && <div className="w-6 h-px bg-gray-300 mx-1" />}
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(fields.find(f => f.step === currentStep)?.fields || []).map(renderField)}
          </div>

          <div className="flex justify-between mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={prev}
              disabled={currentStep === 0}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              السابق
            </button>
            {currentStep === steps.length - 1 ? (
              <button
                onClick={submit}
                disabled={loading}
                className="px-6 py-2 bg-[#C9A84C] text-white rounded-lg text-sm font-medium hover:bg-[#B8943A] disabled:opacity-50"
              >
                {loading ? "جاري الحفظ..." : "حفظ الموظف"}
              </button>
            ) : (
              <button
                onClick={next}
                className="px-4 py-2 bg-[#0D1B2A] text-white rounded-lg text-sm hover:bg-[#1a2d42]"
              >
                التالي
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
