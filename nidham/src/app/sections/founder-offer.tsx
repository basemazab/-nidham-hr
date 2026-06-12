import Link from "next/link";

// عرض العميل المؤسس — founder-approved (2026-06-13): first 10 companies get
// 2 free months + white-glove employee-data migration + 2-year price lock.
// Shown on the homepage (below the hero) and on /pricing.
export function FounderOfferBanner() {
  return (
    <section className="px-6 pt-10">
      <div className="max-w-5xl mx-auto rounded-3xl bg-gradient-to-l from-amber-500 via-amber-400 to-yellow-300 p-[2px] shadow-xl">
        <div className="rounded-3xl bg-slate-900 px-6 py-6 md:px-10 md:py-8 relative overflow-hidden">
          <div aria-hidden className="absolute -top-8 -left-6 text-[140px] opacity-[0.06] leading-none">
            🏅
          </div>
          <div className="relative flex flex-col md:flex-row md:items-center gap-5">
            <div className="flex-1">
              <div className="inline-block px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/50 text-amber-300 text-xs font-black mb-2 font-cairo">
                🏅 عرض العميل المؤسس — لأول 10 شركات فقط
              </div>
              <h2 className="text-xl md:text-2xl font-black text-white font-cairo leading-snug mb-2">
                شهرين مجانًا بدل 14 يوم — ونرفعلك بيانات موظفينك بنفسنا
              </h2>
              <ul className="text-sm text-slate-300 font-cairo space-y-1">
                <li>🎁 شهرين تجربة كاملة بكل المميزات — من غير بطاقة ائتمان</li>
                <li>🛠️ إعداد كامل + نقل بيانات الموظفين علينا مجانًا</li>
                <li>🔒 سعرك مجمّد لسنتين مهما زادت الأسعار</li>
                <li>🏅 شارة «عميل مؤسس» + أولوية دعم دائمة</li>
              </ul>
            </div>
            <Link
              href="/signup?plan=pro"
              className="shrink-0 inline-flex items-center gap-2 px-7 py-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 font-black text-lg shadow-lg transition font-cairo whitespace-nowrap"
            >
              احجز مكانك ←
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
