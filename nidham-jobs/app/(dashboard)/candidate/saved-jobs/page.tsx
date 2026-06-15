"use client";

import { JobCard } from "@/components/jobs/job-card";

const MOCK_SAVED = [
  { id: "1", title: "مهندس برمجيات أول", company: "شركة تك", location: "القاهرة", type: "دوام كامل", salaryMin: 15000, salaryMax: 25000, createdAt: new Date("2024-03-10") },
  { id: "2", title: "مصمم UI/UX", company: "شركة تصميم", location: "عن بُعد", type: "عن بُعد", salaryMin: 10000, salaryMax: 18000, createdAt: new Date("2024-03-09") },
];

export default function SavedJobsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">الوظائف المحفوظة</h1>
        <p className="mt-1 text-gray-600">الوظائف التي حفظتها لمتابعتها لاحقاً</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {MOCK_SAVED.map((job) => (
          <JobCard key={job.id} {...job} />
        ))}
      </div>
      {!MOCK_SAVED.length && (
        <p className="text-center text-gray-500 py-12">لم تحفظ أي وظيفة بعد</p>
      )}
    </div>
  );
}
