"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/shared/AppLayout";
import { ArrowRight, Download, Eye, Loader2, FileText } from "lucide-react";

interface FormData {
  contract_number: string;
  contract_date: string;
  employee_full_name: string;
  national_id: string;
  nationality: string;
  employee_address: string;
  mobile_phone: string;
  job_title: string;
  department: string;
  direct_manager: string;
  work_location: string;
  start_date: string;
  contract_type: string;
  end_date: string;
  contract_duration: string;
  probation_period: string;
  working_hours_per_day: string;
  working_days_per_week: string;
  weekly_rest_day: string;
  annual_leave_days: string;
  notice_period: string;
  jurisdiction_city: string;
  basic_salary: string;
  housing_allowance: string;
  transportation_allowance: string;
  food_allowance: string;
  other_allowances: string;
  total_salary: string;
}

const initialData: FormData = {
  contract_number: "",
  contract_date: new Date().toISOString().split("T")[0],
  employee_full_name: "",
  national_id: "",
  nationality: "مصري",
  employee_address: "",
  mobile_phone: "",
  job_title: "",
  department: "",
  direct_manager: "",
  work_location: "",
  start_date: "",
  contract_type: "محدد المدة",
  end_date: "",
  contract_duration: "",
  probation_period: "3 أشهر",
  working_hours_per_day: "8",
  working_days_per_week: "5",
  weekly_rest_day: "الجمعة",
  annual_leave_days: "21",
  notice_period: "30",
  jurisdiction_city: "القاهرة",
  basic_salary: "",
  housing_allowance: "",
  transportation_allowance: "",
  food_allowance: "",
  other_allowances: "",
  total_salary: "",
};

const fieldLabels: Record<string, string> = {
  contract_number: "رقم العقد",
  contract_date: "تاريخ العقد",
  employee_full_name: "الاسم رباعياً",
  national_id: "الرقم القومي",
  nationality: "الجنسية",
  employee_address: "العنوان",
  mobile_phone: "رقم الموبايل",
  job_title: "المسمى الوظيفي",
  department: "القسم",
  direct_manager: "المدير المباشر",
  work_location: "مكان العمل",
  start_date: "تاريخ بدء العمل",
  contract_type: "نوع العقد",
  end_date: "تاريخ نهاية العقد",
  contract_duration: "مدة العقد",
  probation_period: "فترة التجربة",
  working_hours_per_day: "ساعات العمل يومياً",
  working_days_per_week: "أيام العمل أسبوعياً",
  weekly_rest_day: "يوم الراحة الأسبوعي",
  annual_leave_days: "الإجازة السنوية (أيام)",
  notice_period: "فترة الإشعار (يوم)",
  jurisdiction_city: "مدينة الاختصاص القضائي",
  basic_salary: "المرتب الأساسي",
  housing_allowance: "بدل سكن",
  transportation_allowance: "بدل انتقالات",
  food_allowance: "بدل طعام",
  other_allowances: "بدلات أخرى",
  total_salary: "إجمالي الأجر الشهري",
};

export default function EmploymentContractPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>(initialData);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Auto-calculate total salary
    if (["basic_salary", "housing_allowance", "transportation_allowance", "food_allowance", "other_allowances"].includes(field)) {
      const newVal = { ...formData, [field]: value };
      const total = [
        newVal.basic_salary,
        newVal.housing_allowance,
        newVal.transportation_allowance,
        newVal.food_allowance,
        newVal.other_allowances,
      ]
        .filter(Boolean)
        .reduce((sum, v) => sum + Number(v), 0);
      setFormData((prev) => ({ ...newVal, total_salary: total > 0 ? String(total) : prev.total_salary }));
    }
  };

  const generatePDF = async (download = true) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/templates/employment_contract/generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
          body: JSON.stringify({ custom_fields: formData, format: "pdf" }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "فشل في إنشاء المستند");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);

      if (download) {
        const a = document.createElement("a");
        a.href = url;
        a.download = `عقد_عمل_${formData.employee_full_name || formData.contract_number}.pdf`;
        a.click();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <button onClick={() => router.push("/templates")} className="text-accent font-bold mb-2 flex items-center gap-2">
          <ArrowRight className="w-4 h-4" />
          رجوع للنماذج
        </button>
        <div className="flex items-center gap-3">
          <FileText className="w-8 h-8 text-accent" />
          <div>
            <h1 className="text-2xl font-bold text-primary font-heading">عقد عمل</h1>
            <p className="text-sm text-gray-500">عقد عمل قانوني شامل وفقاً لقانون العمل المصري رقم 12 لسنة 2003</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="card">
          <h2 className="text-lg font-bold text-primary mb-4">بيانات العقد</h2>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {/* Employee Info */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <h3 className="font-bold text-accent text-sm mb-3">بيانات الموظف</h3>
              <div className="grid grid-cols-2 gap-3">
                {["employee_full_name", "national_id", "nationality", "employee_address", "mobile_phone"].map((field) => (
                  <div key={field}>
                    <label className="block text-xs font-bold text-primary mb-1">{fieldLabels[field]}</label>
                    <input
                      type={field.includes("date") ? "date" : "text"}
                      value={formData[field as keyof FormData]}
                      onChange={(e) => handleChange(field, e.target.value)}
                      className="input-field text-sm"
                      placeholder="اكتب هنا..."
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Job Info */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <h3 className="font-bold text-accent text-sm mb-3">بيانات الوظيفة</h3>
              <div className="grid grid-cols-2 gap-3">
                {["job_title", "department", "direct_manager", "work_location", "start_date"].map((field) => (
                  <div key={field}>
                    <label className="block text-xs font-bold text-primary mb-1">{fieldLabels[field]}</label>
                    <input
                      type={field.includes("date") ? "date" : "text"}
                      value={formData[field as keyof FormData]}
                      onChange={(e) => handleChange(field, e.target.value)}
                      className="input-field text-sm"
                      placeholder="اكتب هنا..."
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Contract Info */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <h3 className="font-bold text-accent text-sm mb-3">بيانات العقد</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-primary mb-1">رقم العقد</label>
                  <input type="text" value={formData.contract_number} onChange={(e) => handleChange("contract_number", e.target.value)} className="input-field text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-primary mb-1">تاريخ العقد</label>
                  <input type="date" value={formData.contract_date} onChange={(e) => handleChange("contract_date", e.target.value)} className="input-field text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-primary mb-1">نوع العقد</label>
                  <select value={formData.contract_type} onChange={(e) => handleChange("contract_type", e.target.value)} className="input-field text-sm">
                    <option value="محدد المدة">محدد المدة</option>
                    <option value="غير محدد المدة">غير محدد المدة</option>
                  </select>
                </div>
                {formData.contract_type === "محدد المدة" && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-primary mb-1">تاريخ النهاية</label>
                      <input type="date" value={formData.end_date} onChange={(e) => handleChange("end_date", e.target.value)} className="input-field text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-primary mb-1">المدة</label>
                      <input type="text" value={formData.contract_duration} onChange={(e) => handleChange("contract_duration", e.target.value)} className="input-field text-sm" placeholder="مثال: سنة واحدة" />
                    </div>
                  </>
                )}
                {["probation_period", "working_hours_per_day", "working_days_per_week", "weekly_rest_day", "annual_leave_days", "notice_period", "jurisdiction_city"].map((field) => (
                  <div key={field}>
                    <label className="block text-xs font-bold text-primary mb-1">{fieldLabels[field]}</label>
                    <input type="text" value={formData[field as keyof FormData]} onChange={(e) => handleChange(field, e.target.value)} className="input-field text-sm" />
                  </div>
                ))}
              </div>
            </div>

            {/* Salary */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <h3 className="font-bold text-accent text-sm mb-3">الأجر والبدلات</h3>
              <div className="grid grid-cols-2 gap-3">
                {["basic_salary", "housing_allowance", "transportation_allowance", "food_allowance", "other_allowances", "total_salary"].map((field) => (
                  <div key={field}>
                    <label className="block text-xs font-bold text-primary mb-1">{fieldLabels[field]}</label>
                    <input
                      type="number"
                      value={formData[field as keyof FormData]}
                      onChange={(e) => handleChange(field, e.target.value)}
                      className="input-field text-sm"
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-4 pt-4 border-t">
            <button onClick={() => generatePDF(false)} disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
              معاينة
            </button>
            <button onClick={() => generatePDF(true)} disabled={loading} className="btn-accent flex-1 flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              تحميل PDF
            </button>
          </div>
          {error && <p className="text-red-500 text-sm mt-2 text-center">⚠️ {error}</p>}
        </div>

        {/* Preview */}
        <div className="card">
          <h2 className="text-lg font-bold text-primary mb-4">معاينة المستند</h2>
          {previewUrl ? (
            <iframe src={previewUrl} className="w-full h-[600px] border rounded-lg" title="PDF Preview" />
          ) : (
            <div className="flex flex-col items-center justify-center h-[600px] text-gray-400">
              <FileText className="w-16 h-16 mb-4" />
              <p>اضغط على "معاينة" لعرض المستند</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
