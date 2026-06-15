"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/dashboard/stats-card";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { JobForm } from "@/components/forms/job-form";
import { Plus, Eye, Users, Briefcase } from "lucide-react";

const MOCK_JOBS = [
  { id: "1", title: "مهندس برمجيات أول", status: "ACTIVE", applications: 12, views: 340, createdAt: "2024-03-15" },
  { id: "2", title: "مصمم UI/UX", status: "ACTIVE", applications: 8, views: 210, createdAt: "2024-03-14" },
  { id: "3", title: "مدير منتج", status: "DRAFT", applications: 0, views: 0, createdAt: "2024-03-13" },
  { id: "4", title: "محلل بيانات", status: "PAUSED", applications: 5, views: 89, createdAt: "2024-03-12" },
];

const statusBadge: Record<string, { variant: "success" | "warning" | "default" | "secondary"; label: string }> = {
  ACTIVE: { variant: "success", label: "نشط" },
  DRAFT: { variant: "secondary", label: "مسودة" },
  PAUSED: { variant: "warning", label: "متوقف" },
  CLOSED: { variant: "default", label: "مغلق" },
};

const columns: Column<any>[] = [
  {
    key: "title",
    label: "عنوان الوظيفة",
    render: (job) => (
      <div>
        <p className="font-medium text-gray-900">{job.title}</p>
        <p className="text-xs text-gray-500">{job.createdAt}</p>
      </div>
    ),
  },
  {
    key: "status",
    label: "الحالة",
    render: (job) => {
      const s = statusBadge[job.status] || { variant: "secondary" as const, label: job.status };
      return <Badge variant={s.variant}>{s.label}</Badge>;
    },
  },
  {
    key: "applications",
    label: "المتقدمون",
    className: "text-center",
  },
  {
    key: "views",
    label: "المشاهدات",
    className: "text-center",
  },
  {
    key: "actions",
    label: "",
    render: (job) => (
      <div className="flex gap-2">
        <Button variant="ghost" size="sm">تعديل</Button>
        <Button variant="ghost" size="sm" className="text-danger">حذف</Button>
      </div>
    ),
  },
];

export default function CompanyJobsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleCreateJob = async (data: any) => {
    console.log("Create job:", data);
    setShowCreateModal(false);
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">الوظائف</h1>
          <p className="mt-1 text-gray-600">إدارة وظائف شركتك</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="ml-2 h-4 w-4" />
          إضافة وظيفة
        </Button>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <StatsCard label="وظائف نشطة" value="٢" icon={<Briefcase className="h-6 w-6" />} />
        <StatsCard label="إجمالي المتقدمين" value="٢٥" icon={<Users className="h-6 w-6" />} />
        <StatsCard label="إجمالي المشاهدات" value="٦٣٩" icon={<Eye className="h-6 w-6" />} />
      </div>

      <DataTable columns={columns} data={MOCK_JOBS} emptyMessage="لا توجد وظائف بعد" />

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="إضافة وظيفة جديدة"
        size="xl"
      >
        <JobForm onSubmit={handleCreateJob} />
      </Modal>
    </div>
  );
}
