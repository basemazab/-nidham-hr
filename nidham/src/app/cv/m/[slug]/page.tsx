import { notFound } from "next/navigation";
import { createPublicClient } from "@/lib/supabase/public";
import { CvDocument, type CvTemplate, type CvColor } from "@/app/dashboard/cv-builder/cv-document";
import type { CvData } from "@/lib/cv-builder";
import { CvPrintButton } from "@/app/cv/[slug]/print-button";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("public_cvs")
    .select("data")
    .eq("slug", slug)
    .maybeSingle<{ data: CvData }>();
  const name = data?.data?.full_name || "سيرة ذاتية";
  return {
    title: `${name} — السيرة الذاتية`,
    description: data?.data?.headline || `السيرة الذاتية لـ ${name} — صُنعت بنِظام`,
  };
}

export default async function PublicCvMakerPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("public_cvs")
    .select("data")
    .eq("slug", slug)
    .maybeSingle<{ data: CvData }>();

  if (!data?.data?.full_name) notFound();

  return (
    <main className="min-h-screen bg-slate-100 py-8 px-4">
      <div className="max-w-3xl mx-auto mb-4 flex justify-between items-center gap-3 print:hidden">
        <a href="/cv-maker" className="text-sm font-bold text-brand-cyan-dark font-cairo hover:underline">
          ← اعمل سيرتك مجانًا
        </a>
        <CvPrintButton />
      </div>
      <div className="max-w-3xl mx-auto bg-white shadow-xl rounded-lg overflow-hidden">
        <CvDocument cv={data.data} template={(data.data as { _template?: CvTemplate })._template ?? "classic"} color={(data.data as { _color?: CvColor })._color ?? "navy"} />
      </div>
      <div className="max-w-3xl mx-auto mt-4 text-center text-xs text-slate-400 font-cairo print:hidden">
        صُنعت مجانًا بـ{" "}
        <a href="https://www.nidhamhr.com/cv-maker" className="text-brand-cyan-dark font-bold hover:underline">
          صانع السيرة الذاتية — نِظام
        </a>
      </div>
    </main>
  );
}
