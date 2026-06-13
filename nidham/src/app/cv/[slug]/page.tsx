import { notFound } from "next/navigation";
import { createPublicClient } from "@/lib/supabase/public";
import { CvDocument } from "@/app/dashboard/cv-builder/cv-document";
import type { CvData } from "@/lib/cv-builder";
import { CvPrintButton } from "./print-button";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("cvs")
    .select("data")
    .eq("slug", slug)
    .eq("is_public", true)
    .maybeSingle<{ data: CvData }>();
  const name = data?.data?.full_name || "سيرة ذاتية";
  return {
    title: `${name} — السيرة الذاتية`,
    description: data?.data?.headline || `السيرة الذاتية لـ ${name}`,
  };
}

export default async function PublicCvPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("cvs")
    .select("data")
    .eq("slug", slug)
    .eq("is_public", true)
    .maybeSingle<{ data: CvData }>();

  if (!data?.data?.full_name) notFound();

  return (
    <main className="min-h-screen bg-slate-100 py-8 px-4">
      <div className="max-w-3xl mx-auto mb-4 flex justify-end print:hidden">
        <CvPrintButton />
      </div>
      <div className="max-w-3xl mx-auto bg-white shadow-xl rounded-lg overflow-hidden">
        <CvDocument cv={data.data} />
      </div>
      <div className="max-w-3xl mx-auto mt-4 text-center text-xs text-slate-400 font-cairo print:hidden">
        تم إنشاؤها بواسطة{" "}
        <a href="https://www.nidhamhr.com" className="text-brand-cyan-dark font-bold hover:underline">نِظام — Nidham HR</a>
      </div>
    </main>
  );
}
