"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/shared/AppLayout";
import { ArrowRight, Download, Eye, Loader2, FileText } from "lucide-react";

interface FormData {
  reference_number: string;
  certificate_date: string;
  addressee: string;
  employee_full_name: string;
  national_id: string;
  job_title: string;
  department: string;
  start_date: string;
  employment_status: string;
  basic_salary: string;
  housing_allowance: string;
  transportation_allowance: string;
  food_allowance: string;
  other_allowances: string;
  deductions: string;
  total_salary: string;
  net_salary: string;
  additional_info: string;
}

const initialData: FormData = {
  reference_number: "",
  certificate_date: new Date().toISOString().split("T")[0],
  addressee: "البنك الأهلي المصري",
  employee_full_name: "",
  national_id: "",
  job_title: "",
  department: "",
  start_date: "",
  employment_status: "يعمل حالياً",
  basic_salary: "",
  housing_allowance: "",
  transportation_allowance: "",
  food_allowance: "",
  other_allowances: "",
  deductions: "",
  total_salary: "",
  net_salary: "",
  additional_info: "",
};

const fieldLabels: Record<string, string> = {
  reference_number: "الرقم المرجعي",
  certificate_date: "تاريخ الشهادة",
  addressee: "إلى (الجهة)",
  employee_full_name: "الاسم",
  national_id: "الرقم القومي",
  job_title: "المسمى الوظيفي",
  department: "القسم",
  start_date: "تاريخ الالتحاق",
  employment_status: "حالة العمل",
  basic_salary: "المرتب الأساسي",
  housing_allowance: "بدل سكن",
  transportation_allowance: "بدل انتقالات",
  food_allowance: "بدل طعام",
  other_allowances: "بدلات أخرى",
  deductions: "الاستقطاعات",
  total_salary: "إجمالي الراتب الشهري",
  net_salary: "صافي الراتب",
  additional_info: "معلومات إضافية",
};

export default function SalaryCertificatePage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>(initialData);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (["basic_salary", "housing_allowance", "transportation_allowance", "food_allowance", "other_allowances"].includes(field)) {
      const newVal = { ...formData, [field]: value };
      const total = [newVal.basic_salary, newVal.housing_allowance, newVal.transportation_allowance, newVal.food_allowance, newVal.other_allowances].filter(Boolean).reduce((sum, v) => sum + Number(v), 0);
      setFormData((prev) => ({ ...newVal, total_salary: total > 0 ? String(total) : prev.total_salary }));
    }
  };

  const generatePDF = async (download = true) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/templates/salary_certificate/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("access_token")}` },
        body: JSON.stringify({ custom_fields: formData, format: "pdf" }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.detail || "فشل في إنشاء المستند"); }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      if (download) { const a = document.createElement("a"); a.href = url; a.download = `شهادة_راتب_${formData.employee_full_name}.pdf`; a.click(); }
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  const renderField = (field: string) => (
    <div key={field}>
      <label className="block text-xs font-bold text-primary mb-1">{fieldLabels[field]}</label>
      {field === "employment_status" ? (
        <select value={formData[field as keyof FormData]} onChange={(e) => handleChange(field, e.target.value)} className="input-field text-sm">
          <option value="يعمل حالياً">يعمل حالياً</option>
          <option value="في إجازة">في إجازة</option>
          <option value="موقف">موقف</option>
        </select>
      ) : field === "additional_info" ? (
        <textarea value={formData[field as keyof FormData]} onChange={(e) => handleChange(field, e.target.value)} className="input-field text-sm" rows={2} placeholder="أي معلومات إضافية..." />
      ) : (
        <input type={field.includes("date") ? "date" : field.includes("salary") || field === "deductions" ? "number" : "text"} value={formData[field as keyof FormData]} onChange={(e) => handleChange(field, e.target.value)} className="input-field text-sm" placeholder="اكتب هنا..." />
      )}
    </div>
  );

  return (
    <AppLayout>
      <div className="mb-6">
        <button onClick={() => router.push("/templates")} className="text-accent font-bold mb-2 flex items-center gap-2"><ArrowRight className="w-4 h-4" /> رجوع للنماذج</button>
        <div className="flex items-center gap-3"><FileText className="w-8 h-8 text-accent" /><div><h1 className="text-2xl font-bold text-primary font-heading">شهادة راتب</h1><p className="text-sm text-gray-500">شهادة راتب رسمية مصدقة من إدارة الموارد البشرية</p></div></div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-bold text-primary mb-4">بيانات الشهادة</h2>
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            <div className="bg-gray-50 p-3 rounded-lg">
              <h3 className="font-bold text-accent text-sm mb-3">بيانات عامة</h3>
              <div className="grid grid-cols-2 gap-3">{["reference_number", "certificate_date", "addressee", "employee_full_name", "national_id"].map(renderField)}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <h3 className="font-bold text-accent text-sm mb-3">بيانات الوظيفة</h3>
              <div className="grid grid-cols-2 gap-3">{["job_title", "department", "start_date", "employment_status"].map(renderField)}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <h3 className="font-bold text-accent text-sm mb-3">تفاصيل الراتب</h3>
              <div className="grid grid-cols-2 gap-3">{["basic_salary", "housing_allowance", "transportation_allowance", "food_allowance", "other_allowances", "deductions", "total_salary", "net_salary"].map(renderField)}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <h3 className="font-bold text-accent text-sm mb-3">معلومات إضافية</h3>
              {renderField("additional_info")}
            </div>
          </div>
          <div className="flex gap-3 mt-4 pt-4 border-t">
            <button onClick={() => generatePDF(false)} disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />} معاينة</button>
            <button onClick={() => generatePDF(true)} disabled={loading} className="btn-accent flex-1 flex items-center justify-center gap-2 disabled:opacity-50">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} تحميل PDF</button>
          </div>
          {error && <p className="text-red-500 text-sm mt-2 text-center">⚠️ {error}</p>}
        </div>

        <div className="card">
          <h2 className="text-lg font-bold text-primary mb-4">معاينة المستند</h2>
          {previewUrl ? <iframe src={previewUrl} className="w-full h-[600px] border rounded-lg" title="PDF Preview" /> : <div className="flex flex-col items-center justify-center h-[600px] text-gray-400"><FileText className="w-16 h-16 mb-4" /><p>اضغط على "معاينة" لعرض المستند</p></div>}
        </div>
      </div>
    </AppLayout>
  );
}
