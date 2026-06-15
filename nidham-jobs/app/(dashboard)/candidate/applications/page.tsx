"use client";

import { DataTable, type Column } from "@/components/dashboard/data-table";
import { Badge } from "@/components/ui/badge";

const MOCK_APPS = [
  { id: "1", job: "مهندس برمجيات أول", company: "شركة تك", status: "REVIEWING", score: 85, date: "2024-03-15" },
  { id: "2", job: "مصمم UI/UX", company: "شركة تصميم", status: "INTERVIEW", score: 92, date: "2024-03-14" },
  { id: "3", job: "محلل بيانات", company: "شركة بيانات", status: "REJECTED", score: 45, date: "2024-03-12" },
];

const statusConfig: Record<string, { variant: "success" | "warning" | "danger" | "secondary" | "default"; label: string }> = {
  PENDING: { variant: "secondary", label: "قيد الانتظار" },
  REVIEWING: { variant: "warning", label: "قيد المراجعة" },
  SHORTLISTED: { variant: "success", label: "مختار" },
  INTERVIEW: { variant: "default", label: "مقابلة" },
  ACCEPTED: { variant: "success", label: "مقبول" },
  REJECTED: { variant: "danger", label: "مرفوض" },
};

const columns: Column<any>[] = [
  { key: "job", label: "الوظيفة" },
  { key: "company", label: "الشركة" },
  {
    key: "status",
    label: "الحالة",
    render: (app) => {
      const s = statusConfig[app.status] || { variant: "secondary" as const, label: app.status };
      return <Badge variant={s.variant}>{s.label}</Badge>;
    },
  },
  { key: "score", label: "درجة التطابق", render: (app) => <span className="font-medium">{app.score}%</span> },
  { key: "date", label: "تاريخ التقديم" },
];

export default function CandidateApplicationsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">طلباتي</h1>
        <p className="mt-1 text-gray-600">تتبع حالة طلبات التقديم على الوظائف</p>
      </div>
      <DataTable columns={columns} data={MOCK_APPS} emptyMessage="لم تقدم على أي وظيفة بعد" />
    </div>
  );
}
