"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/shared/AppLayout";
import { ArrowRight, Download, Eye, Loader2, FileText } from "lucide-react";

interface FormData {
  reference_number: string;
  termination_date: string;
  employee_full_name: string;
  national_id: string;
  job_title: string;
  department: string;
  start_date: string;
  end_date: string;
  service_duration: string;
  termination_reason: string;
  termination_type: string;
  legal_basis: string;
  payment_deadline: string;
  appeal_days: string;
  end_of_service_gratuity: string;
  unused_leave_balance: string;
  notice_period_pay: string;
  other_entitlements: string;
  total_entitlements: string;
}

const initialData: FormData = {
  reference_number: "",
  termination_date: new Date().toISOString().split("T")[0],
  employee_full_name: "",
  national_id: "",
  job_title: "",
  department: "",
  start_date: "",
  end_date: "",
  service_duration: "",
  termination_reason: "",
  termination_type: "استقالة",
  legal_basis: "المادة (114)",
  payment_deadline: "7 أيام",
  appeal_days: "30",
  end_of_service_gratuity: "",
  unused_leave_balance: "",
  notice_period_pay: "",
  other_entitlements: "",
  total_entitlements: "",
};

const fieldLabels: Record<string, string> = {
  reference_number: "الرقم المرجعي",
  termination_date: "تاريخ إنهاء الخدمة",
  employee_full_name: "الاسم",
  national_id: "الرقم القومي",
  job_title: "المسمى الوظيفي",
  department: "القسم",
  start_date: "تاريخ الالتحاق",
  end_date: "تاريخ نهاية الخدمة",
  service_duration: "مدة الخدمة",
  termination_reason: "سبب إنهاء الخدمة",
  termination_type: "نوع الإنهاء",
  legal_basis: "الأساس القانوني",
  payment_deadline: "مهلة الدفع",
  appeal_days: "أيام الطعن",
  end_of_service_gratuity: "مكافأة نهاية الخدمة",
  unused_leave_balance: "رصيد الإجازات غير المستخدمة",
  notice_period_pay: "مرتب فترة الإشعار",
  other_entitlements: "مستحقات أخرى",
  total_entitlements: "إجمالي المستحقات",
};

export default function TerminationLetterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>(initialData);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (["end_of_service_gratuity", "unused_leave_balance", "notice_period_pay", "other_entitlements"].includes(field)) {
      const newVal = { ...formData, [field]: value };
      const total = [newVal.end_of_service_gratuity, newVal.unused_leave_balance, newVal.notice_period_pay, newVal.other_entitlements].filter(Boolean).reduce((sum, v) => sum + Number(v), 0);
      setFormData((prev) => ({ ...newVal, total_entitlements: total > 0 ? String(total) : prev.total_entitlements }));
    }
  };

  const generatePDF = async (download = true) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/templates/termination_letter/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("access_token")}` },
        body: JSON.stringify({ custom_fields: formData, format: "pdf" }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.detail || "فشل في إنشاء المستند"); }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      if (download) { const a = document.createElement("a"); a.href = url; a.download = `خطاب_إنهاء_خدمة_${formData.employee_full_name}.pdf`; a.click(); }
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  const renderField = (field: string) => (
    <div key={field}>
      <label className="block text-xs font-bold text-primary mb-1">{fieldLabels[field]}</label>
      {field === "termination_type" ? (
        <select value={formData[field as keyof FormData]} onChange={(e) => handleChange(field, e.target.value)} className="input-field text-sm">
          <option value="استقالة">استقالة</option>
          <option value="انتهاء العقد">انتهاء العقد</option>
          <option value="إنهاء من الشركة">إنهاء من الشركة</option>
          <option value="إحالة للمعاش">إحالة للمعاش</option>
        </select>
      ) : field === "termination_reason" ? (
        <textarea value={formData[field as keyof FormData]} onChange={(e) => handleChange(field, e.target.value)} className="input-field text-sm" rows={2} placeholder="اكتب سبب إنهاء الخدمة..." />
      ) : (
        <input type={field.includes("date") ? "date" : "text"} value={formData[field as keyof FormData]} onChange={(e) => handleChange(field, e.target.value)} className="input-field text-sm" placeholder="اكتب هنا..." />
      )}
    </div>
  );

  return (
    <AppLayout>
      <div className="mb-6">
        <button onClick={() => router.push("/templates")} className="text-accent font-bold mb-2 flex items-center gap-2"><ArrowRight className="w-4 h-4" /> رجوع للنماذج</button>
        <div className="flex items-center gap-3"><FileText className="w-8 h-8 text-accent" /><div><h1 className="text-2xl font-bold text-primary font-heading">خطاب إنهاء خدمة</h1><p className="text-sm text-gray-500">خطاب إنهاء خدمة رسمي مع المستحقات المالية</p></div></div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-bold text-primary mb-4">بيانات إنهاء الخدمة</h2>
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            <div className="bg-gray-50 p-3 rounded-lg">
              <h3 className="font-bold text-accent text-sm mb-3">بيانات الموظف</h3>
              <div className="grid grid-cols-2 gap-3">{["reference_number", "termination_date", "employee_full_name", "national_id", "job_title", "department"].map(renderField)}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <h3 className="font-bold text-accent text-sm mb-3">بيانات الخدمة</h3>
              <div className="grid grid-cols-2 gap-3">{["start_date", "end_date", "service_duration", "termination_type", "termination_reason"].map(renderField)}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <h3 className="font-bold text-accent text-sm mb-3">الأساس القانوني</h3>
              <div className="grid grid-cols-2 gap-3">{["legal_basis", "payment_deadline", "appeal_days"].map(renderField)}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <h3 className="font-bold text-accent text-sm mb-3">المستحقات المالية</h3>
              <div className="grid grid-cols-2 gap-3">{["end_of_service_gratuity", "unused_leave_balance", "notice_period_pay", "other_entitlements", "total_entitlements"].map(renderField)}</div>
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
