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

type Company = { name: string; contact_whatsapp: string | null };

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
    .select("name, contact_whatsapp")
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

      {/* The applicant reaches the COMPANY that posted the job — NOT Nidham.
          (Nidham's own site CTA is hidden on /apply via SiteWhatsAppCta.) */}
      {company?.contact_whatsapp && (
        <a
          href={`https://wa.me/${company.contact_whatsapp}?text=${encodeURIComponent(`أهلاً، أنا مقدّم على وظيفة «${job.title}» وحابب أستفسر`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 left-4 sm:left-6 z-50 inline-flex items-center gap-2 px-4 h-12 rounded-full bg-[#25D366] hover:bg-[#20bd5a] shadow-lg transition-all hover:-translate-y-1 text-white font-cairo font-bold text-sm"
          aria-label="تواصل مع الشركة على واتساب"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 shrink-0">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          استفسر عن الوظيفة
        </a>
      )}
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
