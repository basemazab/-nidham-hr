import { JobCard } from "@/components/jobs/job-card";
import type { JobWithCompany } from "@/types";

interface JobListProps {
  jobs: JobWithCompany[];
  total?: number;
  page?: number;
  pageSize?: number;
}

export function JobList({ jobs, total, page = 1, pageSize = 12 }: JobListProps) {
  if (!jobs.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
          <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h3 className="mt-4 text-lg font-semibold text-gray-900">لا توجد وظائف</h3>
        <p className="mt-1 text-sm text-gray-500">لم نجد وظائف تطابق معايير البحث. جرب تغيير الفلاتر.</p>
      </div>
    );
  }

  return (
    <div>
      {total && (
        <p className="mb-4 text-sm text-gray-500">
          {total} وظيفة متاحة
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {jobs.map((job) => (
          <JobCard
            key={job.id}
            id={job.id}
            title={job.title}
            company={job.company.name}
            logo={job.company.logo}
            location={job.location}
            type={job.type.replace("_", " ")}
            salaryMin={job.salaryMin}
            salaryMax={job.salaryMax}
            currency={job.salaryCurrency}
            createdAt={job.createdAt}
            isFeatured={false}
          />
        ))}
      </div>
    </div>
  );
}
