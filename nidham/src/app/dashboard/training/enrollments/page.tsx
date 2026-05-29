"use client";

import Link from "next/link";
import { useState } from "react";

const STATUS_TABS = [
  { key: "all", label: "الكل" },
  { key: "pending", label: "قيد الانتظار" },
  { key: "approved", label: "تم الموافقة" },
  { key: "completed", label: "مكتمل" },
  { key: "cancelled", label: "ملغي" },
];

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-sky-50 text-sky-700 border-sky-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "قيد الانتظار",
  approved: "تم الموافقة",
  completed: "مكتمل",
  cancelled: "ملغي",
};

const SAMPLE_ENROLLMENTS = [
  { id: "e1", employee_name: "أحمد محمود", course_name: "مهارات القيادة والإدارة", department: "المبيعات", enrollment_date: "2026-05-01", status: "completed", progress: 100 },
  { id: "e2", employee_name: "سارة حسن", course_name: "اللغة الإنجليزية للأعمال", department: "الموارد البشرية", enrollment_date: "2026-05-05", status: "completed", progress: 100 },
  { id: "e3", employee_name: "محمد علي", course_name: "الامتثال واللوائح", department: "الشؤون القانونية", enrollment_date: "2026-05-10", status: "approved", progress: 75 },
  { id: "e4", employee_name: "نورا خالد", course_name: "مهارات التواصل الفعال", department: "التسويق", enrollment_date: "2026-05-12", status: "completed", progress: 100 },
  { id: "e5", employee_name: "خالد يوسف", course_name: "إدارة المشاريع الاحترافية", department: "تقنية المعلومات", enrollment_date: "2026-05-15", status: "approved", progress: 45 },
  { id: "e6", employee_name: "منى سامي", course_name: "تحليل البيانات باستخدام Excel", department: "المالية", enrollment_date: "2026-05-18", status: "pending", progress: 0 },
  { id: "e7", employee_name: "عمر حسن", course_name: "برمجة وتطوير الويب", department: "تقنية المعلومات", enrollment_date: "2026-05-20", status: "pending", progress: 0 },
  { id: "e8", employee_name: "ليلى إبراهيم", course_name: "مهارات القيادة والإدارة", department: "الموارد البشرية", enrollment_date: "2026-05-22", status: "cancelled", progress: 0 },
];

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full max-w-[100px] bg-slate-100 rounded-full h-2 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${
          value === 100 ? "bg-emerald-500" : "bg-amber-500"
        }`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

export default function EnrollmentsPage() {
  const [activeTab, setActiveTab] = useState("all");

  const enrollments = SAMPLE_ENROLLMENTS;
  const filtered = activeTab === "all" ? enrollments : enrollments.filter((e) => e.status === activeTab);

  return (
    <main className="flex-1 px-4 md:px-6 py-6 bg-gradient-to-b from-slate-50 via-white to-emerald-50/20 min-h-screen" dir="rtl">
      <div className="max-w-6xl mx-auto">
        <div className="mb-4">
          <Link href="/dashboard/training" className="text-sm text-slate-500 hover:text-emerald-700 font-cairo">
            ← التدريب والتطوير
          </Link>
        </div>

        <header className="mb-6">
          <h1 className="text-3xl font-black font-cairo text-slate-800 mb-1">📋 إدارة التسجيلات</h1>
          <p className="text-sm text-slate-500 font-cairo">
            متابعة تسجيلات الموظفين في الدورات — حالات التقدم والقبول
          </p>
        </header>

        {/* Status Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-xl text-sm font-bold font-cairo border-2 transition ${
                activeTab === tab.key
                  ? "bg-emerald-50 border-emerald-400 text-emerald-700"
                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              {tab.label}
              {tab.key !== "all" && (
                <span className="mr-1.5 text-[10px] opacity-60">
                  ({enrollments.filter((e) => e.status === tab.key).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
            <div className="text-5xl mb-3">📋</div>
            <h2 className="text-lg font-bold text-slate-700 font-cairo mb-2">لا توجد تسجيلات</h2>
            <p className="text-sm text-slate-500 font-cairo">مفيش تسجيلات في القسم ده</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-50 text-xs font-bold text-slate-600 uppercase">
                  <tr>
                    <th className="px-4 py-3 font-cairo">الموظف</th>
                    <th className="px-4 py-3 font-cairo">الدورة</th>
                    <th className="px-4 py-3 font-cairo">تاريخ التسجيل</th>
                    <th className="px-4 py-3 font-cairo">الحالة</th>
                    <th className="px-4 py-3 font-cairo">التقدم</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((enr) => (
                    <tr key={enr.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-bold text-slate-800 font-cairo">
                        {enr.employee_name}
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-cairo">{enr.course_name}</td>
                      <td className="px-4 py-3 text-slate-500 font-cairo">
                        {new Date(enr.enrollment_date).toLocaleDateString("ar-EG")}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full border font-bold font-cairo ${
                            STATUS_STYLES[enr.status] ?? "bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          {STATUS_LABELS[enr.status] || enr.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <ProgressBar value={enr.progress} />
                          <span className="text-[10px] text-slate-500 font-cairo min-w-[2rem]">
                            {enr.progress}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
