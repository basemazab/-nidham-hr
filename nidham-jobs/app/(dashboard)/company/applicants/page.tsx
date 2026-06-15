"use client";

import { DataTable, type Column } from "@/components/dashboard/data-table";
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Users, CheckCircle, XCircle, Clock } from "lucide-react";

const MOCK_APPLICANTS = [
  { id: "1", name: "أحمد محمد", job: "مهندس برمجيات", score: 85, status: "REVIEWING", date: "2024-03-15" },
  { id: "2", name: "سارة علي", job: "مصمم UI/UX", score: 92, status: "SHORTLISTED", date: "2024-03-14" },
  { id: "3", name: "محمد حسن", job: "مهندس برمجيات", score: 45, status: "REJECTED", date: "2024-03-13" },
  { id: "4", name: "نور أحمد", job: "محلل بيانات", score: 78, status: "PENDING", date: "2024-03-12" },
];

const statusConfig: Record<string, { variant: "success" | "warning" | "danger" | "secondary" | "default"; label: string }> = {
  PENDING: { variant: "secondary", label: "قيد الانتظار" },
  REVIEWING: { variant: "warning", label: "قيد المراجعة" },
  SHORTLISTED: { variant: "success", label: "مختار" },
  INTERVIEW: { variant: "default", label: "مقابلة" },
  REJECTED: { variant: "danger", label: "مرفوض" },
};

const columns: Column<any>[] = [
  { key: "name", label: "الاسم" },
  { key: "job", label: "الوظيفة" },
  {
    key: "score",
    label: "درجة AI",
    render: (app) => (
      <span className={`font-semibold ${app.score >= 80 ? "text-success" : app.score >= 60 ? "text-warning" : "text-danger"}`}>
        {app.score}%
      </span>
    ),
  },
  {
    key: "status",
    label: "الحالة",
    render: (app) => {
      const s = statusConfig[app.status] || { variant: "secondary" as const, label: app.status };
      return <Badge variant={s.variant}>{s.label}</Badge>;
    },
  },
  { key: "date", label: "تاريخ التقديم" },
  {
    key: "actions",
    label: "",
    render: () => (
      <div className="flex gap-2">
        <button className="text-sm text-primary-800 hover:underline">عرض</button>
        <button className="text-sm text-danger hover:underline">رفض</button>
      </div>
    ),
  },
];

export default function ApplicantsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">المتقدمون</h1>
        <p className="mt-1 text-gray-600">إدارة طلبات التقديم على وظائفك</p>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <StatsCard label="الإجمالي" value="٢٥" icon={<Users className="h-6 w-6" />} />
        <StatsCard label="قيد المراجعة" value="١٠" icon={<Clock className="h-6 w-6" />} />
        <StatsCard label="مقبول" value="٣" icon={<CheckCircle className="h-6 w-6" />} />
        <StatsCard label="مرفوض" value="١٢" icon={<XCircle className="h-6 w-6" />} />
      </div>

      <DataTable columns={columns} data={MOCK_APPLICANTS} emptyMessage="لا يوجد متقدمون بعد" />
    </div>
  );
}
