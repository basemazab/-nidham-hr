import { JobSearchWrapper } from "@/components/jobs/job-search-wrapper";
import { JobFilters } from "@/components/jobs/job-filters";
import { JobList } from "@/components/jobs/job-list";
import { prisma } from "@/lib/db";

async function getJobs(searchParams: Record<string, string | undefined>) {
  const where: any = { status: "ACTIVE" };

  if (searchParams.q) {
    where.OR = [
      { title: { contains: searchParams.q, mode: "insensitive" } },
      { description: { contains: searchParams.q, mode: "insensitive" } },
    ];
  }
  if (searchParams.type) {
    where.type = { in: searchParams.type.split(",") };
  }
  if (searchParams.level) {
    where.level = { in: searchParams.level.split(",") };
  }
  if (searchParams.location) {
    where.location = searchParams.location;
  }
  if (searchParams.isRemote === "true") {
    where.isRemote = true;
  }
  if (searchParams.salaryMin) {
    where.salaryMin = { gte: parseInt(searchParams.salaryMin) };
  }
  if (searchParams.salaryMax) {
    where.salaryMax = { lte: parseInt(searchParams.salaryMax) };
  }

  const jobs = await prisma.job.findMany({
    where,
    include: {
      company: { select: { name: true, slug: true, logo: true, location: true, isVerified: true } },
      skills: true,
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return jobs;
}

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const jobs = await getJobs(searchParams);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">جميع الوظائف</h1>
        <p className="mt-1 text-gray-600">تصفح أحدث فرص العمل المتاحة</p>
      </div>

      <JobSearchWrapper />

      <div className="mt-8 flex gap-8">
        <aside className="hidden lg:block w-72 shrink-0">
          <div className="sticky top-24">
            <JobFilters />
          </div>
        </aside>
        <div className="flex-1">
          <JobList jobs={jobs as any} />
        </div>
      </div>
    </div>
  );
}
