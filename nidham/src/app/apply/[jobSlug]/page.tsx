import { notFound } from "next/navigation";
import { createPublicClient } from "@/lib/supabase/public";
import { ApplyFormClient } from "./apply-form-client";
import { headers } from "next/headers";
import type { Metadata } from "next";

type PageProps = {
  params: Promise<{ jobSlug: string }>;
};

type Job = {
  id: string;
  company_id: string;
  title: string;
  department: string | null;
  description: string | null;
  job_type: string;
  location: string | null;
  salary_min: number | null;
  salary_max: number | null;
  application_form: unknown;
  slug: string;
};

type Company = { name: string };

const JOB_TYPE_LABELS: Record<string, string> = {
  full_time: "دوام كامل",
  part_time: "دوام جزئي",
  contract: "عقد",
  internship: "تدريب",
  remote: "Remote",
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { jobSlug } = await params;
  const supabase = createPublicClient();
  const { data: job } = await supabase
    .from("public_jobs")
    .select("title, department, location")
    .eq("slug", jobSlug)
    .single<{ title: string; department: string | null; location: string | null }>();

  if (!job) return { title: "تقديم على وظيفة — نِظام" };
  const encodedTitle = encodeURIComponent(job.title);
  const h = await headers();
  const origin = h.get("x-forwarded-host") || h.get("host") || "nidhamhr.com";
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const base = `${protocol}://${origin}`;
  // v=2 busts Facebook's per-URL image cache: the scraper permanently flagged
  // the OLD url "corrupted" back when this endpoint returned an SVG.
  const ogUrl = `${base}/api/og?title=${encodedTitle}&v=2`;
  return {
    title: `تقديم على ${job.title} — نِظام`,
    description: `قدم على وظيفة ${job.title} من خلال نِظام. خطوات بسيطة، CV، وأسئلة ذكية.`,
    alternates: { canonical: `${base}/apply/${jobSlug}` },
    openGraph: {
      url: `${base}/apply/${jobSlug}`,
      images: [{ url: ogUrl, width: 1200, height: 630, alt: `تقديم على ${job.title} — نِظام` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `تقديم على ${job.title} — نِظام`,
      description: `قدم على وظيفة ${job.title} من خلال نِظام. خطوات بسيطة، CV، وأسئلة ذكية.`,
    },
  };
}

export const dynamic = "force-dynamic";

export default async function ApplyPage({ params }: PageProps) {
  const { jobSlug } = await params;

  const supabase = createPublicClient();
  const { data: job } = await supabase
    .from("public_jobs")
    .select("id, company_id, title, department, description, job_type, location, salary_min, salary_max, application_form, slug")
    .eq("slug", jobSlug)
    .single<Job>();

  if (!job) notFound();

  const { data: company } = await supabase
    .from("companies")
    .select("name")
    .eq("id", job.company_id)
    .single<Company>();

  const questions = Array.isArray(job.application_form) ? job.application_form : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f1a] via-[#0d1525] to-[#111b30] relative overflow-hidden">
      {/* Geometric pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(30deg, #c9a84c 12%, transparent 12.5%, transparent 87%, #c9a84c 87.5%),
            linear-gradient(150deg, #c9a84c 12%, transparent 12.5%, transparent 87%, #c9a84c 87.5%),
            linear-gradient(30deg, #c9a84c 12%, transparent 12.5%, transparent 87%, #c9a84c 87.5%),
            linear-gradient(150deg, #c9a84c 12%, transparent 12.5%, transparent 87%, #c9a84c 87.5%)
          `,
          backgroundSize: "80px 140px",
          backgroundPosition: "0 0, 0 0, 40px 70px, 40px 70px",
        }}
      />

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#c9a84c]/30 bg-[#c9a84c]/5 text-[#c9a84c] text-xs font-cairo mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] animate-pulse" />
            Powered by نِظام HR
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-cairo text-white leading-tight mb-3">
            {job.title}
          </h1>

          <p className="text-[#c9a84c]/80 text-base sm:text-lg font-cairo mb-4">
            {company?.name}
          </p>

          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            <Badge>{JOB_TYPE_LABELS[job.job_type] ?? job.job_type}</Badge>
            {job.department && <Badge>📂 {job.department}</Badge>}
            {job.location && <Badge>📍 {job.location}</Badge>}
            {typeof job.salary_min === "number" && (
              <Badge>💰 {job.salary_min.toLocaleString("ar-EG")}{job.salary_max ? ` - ${job.salary_max.toLocaleString("ar-EG")}` : ""} ج</Badge>
            )}
          </div>
        </div>

        {/* Form */}
        <ApplyFormClient
          jobId={job.id}
          jobSlug={job.slug}
          questions={questions as any}
        />
      </div>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-3 py-1 rounded-full text-xs font-bold font-cairo border border-white/10 bg-white/[0.04] text-white/70">
      {children}
    </span>
  );
}
