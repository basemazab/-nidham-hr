import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDate, formatSalary } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Briefcase, Building2, Clock, DollarSign, CheckCircle } from "lucide-react";

async function getJob(slug: string) {
  const job = await prisma.job.findUnique({
    where: { slug },
    include: {
      company: true,
      skills: true,
    },
  });

  if (!job || job.status !== "ACTIVE") return null;
  return job;
}

export default async function JobDetailsPage({
  params,
}: {
  params: { slug: string };
}) {
  const job = await getJob(params.slug);
  if (!job) notFound();

  const typeLabels: Record<string, string> = {
    FULL_TIME: "دوام كامل",
    PART_TIME: "دوام جزئي",
    CONTRACT: "عقد",
    FREELANCE: "حر",
    INTERNSHIP: "تدريب",
  };

  const levelLabels: Record<string, string> = {
    ENTRY: "مبتدئ",
    MID: "متوسط",
    SENIOR: "خبير",
    LEAD: "قائد فريق",
    MANAGER: "مدير",
    DIRECTOR: "مدير عام",
    EXECUTIVE: "تنفيذي",
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-2 text-sm text-gray-500">
        <Link href="/" className="hover:text-primary-800">الرئيسية</Link>
        <span>/</span>
        <Link href="/jobs" className="hover:text-primary-800">الوظائف</Link>
        <span>/</span>
        <span className="text-gray-900">{job.title}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div className="rounded-2xl border bg-white p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-800">
                {job.company.logo ? (
                  <img src={job.company.logo} alt={job.company.name} className="h-12 w-12 rounded-lg object-cover" />
                ) : (
                  <Building2 className="h-8 w-8" />
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
                <p className="mt-1 text-gray-600">{job.company.name}</p>
                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{job.location}</span>
                  <span className="flex items-center gap-1"><Briefcase className="h-4 w-4" />{typeLabels[job.type] || job.type}</span>
                  <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{formatDate(job.createdAt)}</span>
                  {job.isRemote && <Badge variant="success">عن بُعد</Badge>}
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">الوصف الوظيفي</h2>
              <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-line">
                {job.description}
              </div>
            </CardContent>
          </Card>

          {/* Requirements */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">المتطلبات</h2>
              <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-line">
                {job.requirements}
              </div>
            </CardContent>
          </Card>

          {/* Benefits */}
          {job.benefits && (
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">المميزات</h2>
                <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-line">
                  {job.benefits}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Skills */}
          {job.skills.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">المهارات المطلوبة</h2>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill) => (
                    <Badge key={skill.id} variant="secondary" size="md">
                      {skill.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Apply Card */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <Button className="w-full" size="lg">
                قدم الآن
              </Button>
              <Button variant="outline" className="w-full">
                حفظ الوظيفة
              </Button>
            </CardContent>
          </Card>

          {/* Company Card */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">عن الشركة</h3>
              <div className="space-y-3 text-sm">
                {job.company.website && (
                  <a href={job.company.website} target="_blank" className="flex items-center gap-2 text-primary-800 hover:underline">
                    <Building2 className="h-4 w-4" />
                    {job.company.website}
                  </a>
                )}
                {job.company.location && (
                  <p className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-4 w-4" />
                    {job.company.location}
                  </p>
                )}
                {job.company.industry && (
                  <p className="text-gray-600">{job.company.industry}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Summary Card */}
          <Card>
            <CardContent className="p-6 space-y-3">
              <h3 className="font-semibold text-gray-900">ملخص الوظيفة</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">نوع الوظيفة</span>
                  <span className="font-medium">{typeLabels[job.type] || job.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">المستوى</span>
                  <span className="font-medium">{levelLabels[job.level] || job.level}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">الراتب</span>
                  <span className="font-medium text-success">
                    {job.isSalaryVisible
                      ? formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)
                      : "غير محدد"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">تاريخ النشر</span>
                  <span className="font-medium">{formatDate(job.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">الموقع</span>
                  <span className="font-medium">{job.location}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
