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

// Page background themes — keyed to the job's ad theme so the apply page
// matches the colourful share image. Full class strings (literals) so Tailwind
// compiles them. "light" maps to navy here to keep the dark form readable.
const PAGE_THEMES: Record<string, { bgClass: string; accent: string }> = {
  navy: { bgClass: "from-[#0a0f1a] via-[#0d1525] to-[#111b30]", accent: "#c9a84c" },
  emerald: { bgClass: "from-[#04231b] via-[#06281f] to-[#0a3528]", accent: "#34d399" },
  royal: { bgClass: "from-[#161338] via-[#1e1b4b] to-[#241f57]", accent: "#a78bfa" },
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { jobSlug } = await params;
  const supabase = createPublicClient();
  const { data: job } = await supabase
    .from("public_jobs")
    .select("title, department, location, salary_min, salary_max, job_type, company_id")
    .eq("slug", jobSlug)
    .single<{
      title: string;
      department: string | null;
      location: string | null;
      salary_min: number | null;
      salary_max: number | null;
      job_type: string | null;
      company_id: string | null;
    }>();

  if (!job) return { title: "تقديم على وظيفة — نِظام" };

  let companyName = "";
  if (job.company_id) {
    const { data: c } = await supabase
      .from("companies")
      .select("name")
      .eq("id", job.company_id)
      .single<{ name: string }>();
    companyName = c?.name ?? "";
  }

  const h = await headers();
  const origin = h.get("x-forwarded-host") || h.get("host") || "nidhamhr.com";
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const base = `${protocol}://${origin}`;

  // Same deterministic theme as the public job page (hash the slug) so the
  // shared ad looks identical from both the job link and the apply link.
  const themeKeys = ["navy", "emerald", "royal", "light"];
  const themeIdx =
    Array.from(jobSlug).reduce((a, ch) => a + ch.charCodeAt(0), 0) % themeKeys.length;
  const salaryLabel =
    job.salary_min != null && job.salary_max != null
      ? `${job.salary_min.toLocaleString("ar-EG")} – ${job.salary_max.toLocaleString("ar-EG")} ج`
      : job.salary_min != null
        ? `من ${job.salary_min.toLocaleString("ar-EG")} ج`
        : job.salary_max != null
          ? `حتى ${job.salary_max.toLocaleString("ar-EG")} ج`
          : null;
  const typeLabel = job.job_type ? (JOB_TYPE_LABELS[job.job_type] ?? null) : null;
  const og = new URLSearchParams({ title: job.title, theme: themeKeys[themeIdx], v: "3" });
  if (companyName) og.set("company", companyName);
  if (salaryLabel) og.set("salary", salaryLabel);
  if (job.location) og.set("location", job.location);
  if (typeLabel) og.set("type", typeLabel);
  const ogUrl = `${base}/api/og?${og.toString()}`;
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

  // Match the page vibe to the job's ad theme (same deterministic slug hash as
  // the OG image) — the colourful ad lands on a colour-matched page.
  const themeKeys = ["navy", "emerald", "royal", "light"];
  const ogTheme =
    themeKeys[
      Array.from(jobSlug).reduce((a, ch) => a + ch.charCodeAt(0), 0) % themeKeys.length
    ];
  const theme = PAGE_THEMES[ogTheme] ?? PAGE_THEMES.navy;
  const patternImage = [30, 150, 30, 150]
    .map(
      (deg) =>
        `linear-gradient(${deg}deg, ${theme.accent} 12%, transparent 12.5%, transparent 87%, ${theme.accent} 87.5%)`,
    )
    .join(",");

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.bgClass} relative overflow-hidden`}>
      {/* Geometric pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: patternImage,
          backgroundSize: "80px 140px",
          backgroundPosition: "0 0, 0 0, 40px 70px, 40px 70px",
        }}
      />

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-cairo mb-4"
            style={{
              borderColor: `${theme.accent}4d`,
              backgroundColor: `${theme.accent}0d`,
              color: theme.accent,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: theme.accent }}
            />
            Powered by نِظام HR
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-cairo text-white leading-tight mb-3">
            {job.title}
          </h1>

          <p className="text-base sm:text-lg font-cairo mb-4" style={{ color: `${theme.accent}cc` }}>
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
          companyName={company?.name ?? ""}
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
