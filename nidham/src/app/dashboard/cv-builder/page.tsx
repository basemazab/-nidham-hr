import Link from "next/link";
import { requireHRPage } from "@/lib/permissions";
import { CvBuilderClient } from "./builder-client";

export const metadata = { title: "بانية السيرة الذاتية | ذكاء HR" };
export const dynamic = "force-dynamic";

export default async function CvBuilderPage() {
  await requireHRPage();
  return (
    <main className="flex-1 px-6 py-8 min-h-screen bg-gradient-to-b from-slate-50 via-white to-cyan-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      <div className="max-w-5xl mx-auto">
        <nav className="print:hidden text-xs text-slate-500 mb-4 font-cairo">
          <Link href="/dashboard" className="hover:text-brand-cyan-dark">الرئيسية</Link>
          <span className="mx-2">›</span>
          <span className="text-slate-700 dark:text-slate-300">بانية السيرة الذاتية</span>
        </nav>
        <div className="print:hidden mb-6">
          <h1 className="text-2xl font-black font-cairo text-slate-900 dark:text-slate-100">📄 بانية السيرة الذاتية</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-cairo">
            ابنِ سيرة احترافية متوافقة مع أنظمة الـ ATS بأعلى درجة — صدّرها PDF أو Word، اطبعها،
            أو حوّلها موقع تفاعلي بلينك تشاركه.
          </p>
        </div>
        <CvBuilderClient />
      </div>
    </main>
  );
}
