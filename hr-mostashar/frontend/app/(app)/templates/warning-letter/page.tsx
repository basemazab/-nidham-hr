"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/shared/AppLayout";
import { ArrowRight, Download, Eye, Loader2, FileText } from "lucide-react";

interface FormData {
  reference_number: string;
  warning_date: string;
  employee_full_name: string;
  employee_code: string;
  department: string;
  warning_number: string;
  warning_level: string;
  violation_date: string;
  violation_location: string;
  violation_details: string;
  legal_article: string;
  legal_text: string;
  appeal_days: string;
}

const initialData: FormData = {
  reference_number: "",
  warning_date: new Date().toISOString().split("T")[0],
  employee_full_name: "",
  employee_code: "",
  department: "",
  warning_number: "1",
  warning_level: "إنذار أول",
  violation_date: "",
  violation_location: "",
  violation_details: "",
  legal_article: "المادة (69) من قانون العمل المصري رقم 12 لسنة 2003",
  legal_text: "يجوز لصاحب العمل توقيع جزاء الإنذار على العامل في حالة مخالفة أحكام لائحة العمل.",
  appeal_days: "7",
};

const fieldLabels: Record<string, string> = {
  reference_number: "الرقم المرجعي",
  warning_date: "تاريخ الإنذار",
  employee_full_name: "اسم الموظف",
  employee_code: "الرقم الوظيفي",
  department: "القسم",
  warning_number: "رقم الإنذار",
  warning_level: "درجة الإنذار",
  violation_date: "تاريخ المخالفة",
  violation_location: "مكان المخالفة",
  violation_details: "تفاصيل المخالفة",
  legal_article: "المادة المرجعية",
  legal_text: "النص القانوني",
  appeal_days: "أيام التظلم",
};

export default function WarningLetterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>(initialData);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleChange = (field: string, value: string) => setFormData((prev) => ({ ...prev, [field]: value }));

  const generatePDF = async (download = true) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/templates/warning_letter/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("access_token")}` },
        body: JSON.stringify({ custom_fields: formData, format: "pdf" }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.detail || "فشل في إنشاء المستند"); }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      if (download) { const a = document.createElement("a"); a.href = url; a.download = `خطاب_إنذار_${formData.employee_full_name}.pdf`; a.click(); }
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  const renderField = (field: string) => (
    <div key={field}>
      <label className="block text-xs font-bold text-primary mb-1">{fieldLabels[field]}</label>
      {field === "warning_level" ? (
        <select value={formData[field as keyof FormData]} onChange={(e) => handleChange(field, e.target.value)} className="input-field text-sm">
          <option value="إنذار أول">إنذار أول</option>
          <option value="إنذار ثاني">إنذار ثاني</option>
          <option value="إنذار نهائي">إنذار نهائي</option>
        </select>
      ) : ["violation_details", "legal_text"].includes(field) ? (
        <textarea value={formData[field as keyof FormData]} onChange={(e) => handleChange(field, e.target.value)} className="input-field text-sm" rows={3} placeholder="اكتب هنا..." />
      ) : (
        <input type={field.includes("date") ? "date" : "text"} value={formData[field as keyof FormData]} onChange={(e) => handleChange(field, e.target.value)} className="input-field text-sm" placeholder="اكتب هنا..." />
      )}
    </div>
  );

  return (
    <AppLayout>
      <div className="mb-6">
        <button onClick={() => router.push("/templates")} className="text-accent font-bold mb-2 flex items-center gap-2"><ArrowRight className="w-4 h-4" /> رجوع للنماذج</button>
        <div className="flex items-center gap-3"><FileText className="w-8 h-8 text-accent" /><div><h1 className="text-2xl font-bold text-primary font-heading">خطاب إنذار</h1><p className="text-sm text-gray-500">خطاب إنذار رسمي للموظف وفقاً للوائح الداخلية</p></div></div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-bold text-primary mb-4">بيانات الإنذار</h2>
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            <div className="bg-gray-50 p-3 rounded-lg">
              <h3 className="font-bold text-accent text-sm mb-3">بيانات الموظف</h3>
              <div className="grid grid-cols-2 gap-3">{["reference_number", "warning_date", "employee_full_name", "employee_code", "department"].map(renderField)}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <h3 className="font-bold text-accent text-sm mb-3">بيانات الإنذار</h3>
              <div className="grid grid-cols-2 gap-3">{["warning_number", "warning_level", "violation_date", "violation_location"].map(renderField)}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <h3 className="font-bold text-accent text-sm mb-3">تفاصيل المخالفة</h3>
              <div className="space-y-3">{["violation_details"].map(renderField)}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <h3 className="font-bold text-accent text-sm mb-3">الأساس القانوني</h3>
              <div className="space-y-3">{["legal_article", "legal_text", "appeal_days"].map(renderField)}</div>
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
