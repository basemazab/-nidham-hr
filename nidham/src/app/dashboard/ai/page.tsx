import { getMyProfile } from "@/lib/permissions";
import { SuperAgentChat } from "@/components/super-agent-chat";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "المساعد الذكي — Super Agent",
};

export default async function AIPage() {
  try {
    const { profile } = await getMyProfile();

    if (!profile) {
      return (
        <main className="flex-1 px-4 md:px-6 py-6 bg-gradient-to-b from-slate-50 via-white to-cyan-50/30 min-h-screen">
          <div className="max-w-lg mx-auto text-center pt-16">
            <div className="text-6xl mb-4">🤖</div>
            <h1 className="text-2xl font-bold font-cairo mb-2 text-slate-700">المساعد الذكي</h1>
            <p className="text-slate-500 font-cairo">لم يتم العثور على حساب شركة. يرجى تسجيل الخروج وإعادة التسجيل.</p>
            <Link href="/dashboard" className="mt-4 inline-block px-4 py-2 rounded-xl bg-brand-cyan-dark text-white font-bold text-sm font-cairo">
              ← الرجوع للـ Dashboard
            </Link>
          </div>
        </main>
      );
    }

    return (
      <main className="flex-1 px-4 md:px-6 py-6 bg-gradient-to-b from-slate-50 via-white to-cyan-50/30 min-h-screen">
        <div className="max-w-6xl mx-auto mb-4">
          <Link href="/dashboard" className="text-sm text-slate-500 hover:text-brand-cyan-dark font-cairo">
            ← الرجوع للـ Dashboard
          </Link>
        </div>

        <header className="flex items-start justify-between gap-3 flex-wrap mb-6 max-w-6xl mx-auto">
          <div>
            <div className="inline-block px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-bold mb-2 font-cairo">
              🤖 المساعد الذكي — قدرات خارقة
            </div>
            <h1 className="text-3xl font-black font-cairo text-slate-800 mb-1">Super Agent</h1>
            <p className="text-sm text-slate-500 font-cairo">
              أرفع ملفات Excel و PDF والصور — استورد موظفين، حلل العقود، قفل المرتبات، واعمل تقارير
            </p>
          </div>
          <Link
            href="/dashboard/ai/tools"
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-600 transition font-cairo"
          >
            ⚙ الأدوات
          </Link>
        </header>

        <SuperAgentChat />
      </main>
    );
  } catch (e) {
    return (
      <main className="flex-1 px-4 md:px-6 py-6 bg-gradient-to-b from-slate-50 via-white to-cyan-50/30 min-h-screen">
        <div className="max-w-6xl mx-auto text-center pt-16">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold font-cairo mb-2 text-slate-700">حدث خطأ في تحميل الصفحة</h1>
          <p className="text-slate-500 font-cairo mb-4">{e instanceof Error ? e.message : "خطأ غير معروف"}</p>
          <Link href="/dashboard" className="inline-block px-4 py-2 rounded-xl bg-brand-cyan-dark text-white font-bold text-sm font-cairo">
            ← الرجوع للـ Dashboard
          </Link>
        </div>
      </main>
    );
  }
}
