"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/shared/AppLayout";
import { ArrowRight, Download, Eye, Loader2, FileText } from "lucide-react";

interface FormData {
  reference_number: string;
  certificate_date: string;
  employee_full_name: string;
  national_id: string;
  nationality: string;
  job_title: string;
  department: string;
  start_date: string;
  end_date: string;
  service_duration: string;
  reason_for_leaving: string;
  responsibilities_description: string;
  performance_rating: string;
}

const initialData: FormData = {
  reference_number: "",
  certificate_date: new Date().toISOString().split("T")[0],
  employee_full_name: "",
  national_id: "",
  nationality: "مصري",
  job_title: "",
  department: "",
  start_date: "",
  end_date: "",
  service_duration: "",
  reason_for_leaving: "استقالة",
  responsibilities_description: "",
  performance_rating: "جيد جداً",
};

const fieldLabels: Record<string, string> = {
  reference_number: "الرقم المرجعي",
  certificate_date: "تاريخ الشهادة",
  employee_full_name: "الاسم رباعياً",
  national_id: "الرقم القومي",
  nationality: "الجنسية",
  job_title: "آخر مسمى وظيفي",
  department: "القسم / الإدارة",
  start_date: "تاريخ الالتحاق",
  end_date: "تاريخ نهاية الخدمة",
  service_duration: "مدة الخدمة",
  reason_for_leaving: "سبب ترك العمل",
  responsibilities_description: "المهام والمسؤوليات",
  performance_rating: "التقييم العام",
};

export default function ExperienceCertificatePage() {
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/templates/experience_certificate/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("access_token")}` },
        body: JSON.stringify({ custom_fields: formData, format: "pdf" }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.detail || "فشل في إنشاء المستند"); }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      if (download) { const a = document.createElement("a"); a.href = url; a.download = `شهادة_خبرة_${formData.employee_full_name}.pdf`; a.click(); }
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  const renderField = (field: string) => (
    <div key={field}>
      <label className="block text-xs font-bold text-primary mb-1">{fieldLabels[field]}</label>
      {field === "performance_rating" ? (
        <select value={formData[field as keyof FormData]} onChange={(e) => handleChange(field, e.target.value)} className="input-field text-sm">
          <option value="ممتاز">ممتاز</option>
          <option value="جيد جداً">جيد جداً</option>
          <option value="جيد">جيد</option>
          <option value="مقبول">مقبول</option>
        </select>
      ) : field === "reason_for_leaving" ? (
        <select value={formData[field as keyof FormData]} onChange={(e) => handleChange(field, e.target.value)} className="input-field text-sm">
          <option value="استقالة">استقالة</option>
          <option value="انتهاء العقد">انتهاء العقد</option>
          <option value="إنهاء من الشركة">إنهاء من الشركة</option>
          <option value="إحالة للمعاش">إحالة للمعاش</option>
        </select>
      ) : field === "responsibilities_description" ? (
        <textarea value={formData[field as keyof FormData]} onChange={(e) => handleChange(field, e.target.value)} className="input-field text-sm" rows={3} placeholder="اكتب المهام والمسؤوليات..." />
      ) : (
        <input type={field.includes("date") ? "date" : "text"} value={formData[field as keyof FormData]} onChange={(e) => handleChange(field, e.target.value)} className="input-field text-sm" placeholder="اكتب هنا..." />
      )}
    </div>
  );

  return (
    <AppLayout>
      <div className="mb-6">
        <button onClick={() => router.push("/templates")} className="text-accent font-bold mb-2 flex items-center gap-2"><ArrowRight className="w-4 h-4" /> رجوع للنماذج</button>
        <div className="flex items-center gap-3"><FileText className="w-8 h-8 text-accent" /><div><h1 className="text-2xl font-bold text-primary font-heading">شهادة خبرة</h1><p className="text-sm text-gray-500">شهادة خبرة رسمية صادرة من إدارة الموارد البشرية</p></div></div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-bold text-primary mb-4">بيانات الشهادة</h2>
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            <div className="bg-gray-50 p-3 rounded-lg">
              <h3 className="font-bold text-accent text-sm mb-3">بيانات الموظف</h3>
              <div className="grid grid-cols-2 gap-3">{["reference_number", "certificate_date", "employee_full_name", "national_id", "nationality"].map(renderField)}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <h3 className="font-bold text-accent text-sm mb-3">البيانات الوظيفية</h3>
              <div className="grid grid-cols-2 gap-3">{["job_title", "department", "start_date", "end_date", "service_duration", "reason_for_leaving"].map(renderField)}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <h3 className="font-bold text-accent text-sm mb-3">المهام والتقييم</h3>
              <div className="space-y-3">{["responsibilities_description", "performance_rating"].map(renderField)}</div>
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
