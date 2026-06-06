import Link from "next/link";
import { SectionHeader } from "./section-helpers";

// ============================================================================
// DesktopAppSection — "download the Windows desktop app" block for the home page
// ============================================================================
//
// The desktop client (nidham/desktop, Electron) is a native Windows program
// that opens Nidham in its own frame. It connects to a SERVER chosen on first
// run:
//   • Cloud  → https://nidhamhr.com (needs internet)
//   • Local  → the company's on-prem Enterprise box on the LAN (works fully
//              offline / air-gapped)
//
// The download URL points at the GitHub Releases page by default and can be
// overridden (e.g. to a direct asset link or a CDN) without a code change via
// NEXT_PUBLIC_DESKTOP_DOWNLOAD_URL.

const DOWNLOAD_URL =
  process.env.NEXT_PUBLIC_DESKTOP_DOWNLOAD_URL ??
  "https://github.com/basemazab/-nidham-hr/releases/latest";

export function DesktopAppSection() {
  return (
    <section className="px-6 py-20 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-6xl mx-auto">
        <SectionHeader
          eyebrow="تطبيق سطح المكتب"
          title="نزّل نِظام كبرنامج على ويندوز"
          subtitle="برنامج حقيقي بأيقونة على سطح المكتب — يشتغل بالإنترنت على السحابة، أو بدون إنترنت على سيرفر شركتك المحلي."
        />

        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left — app window mockup */}
          <div className="relative">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden ring-1 ring-cyan-500/10">
              {/* Title bar */}
              <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-l from-brand-navy to-slate-900 border-b border-slate-700">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-400/80" />
                  <span className="w-3 h-3 rounded-full bg-amber-400/80" />
                  <span className="w-3 h-3 rounded-full bg-emerald-400/80" />
                </div>
                <div className="flex-1 text-center text-[11px] text-slate-300 font-cairo">
                  نِظام — Nidham HR
                </div>
              </div>
              {/* Window body */}
              <div className="p-6 bg-gradient-to-br from-slate-50 to-cyan-50/40">
                <div className="flex items-center gap-3 mb-5">
                  <span className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-cyan to-brand-navy shadow-lg shadow-cyan-500/20">
                    <span className="text-2xl font-black text-white font-display">ن</span>
                  </span>
                  <div>
                    <div className="font-black text-slate-800 font-cairo">لوحة تحكم نِظام</div>
                    <div className="text-[11px] text-emerald-600 font-cairo flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> متصل · 47 موظف حاضر
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { k: "المرتبات", v: "جاهزة" },
                    { k: "الحضور", v: "GPS" },
                    { k: "الامتثال", v: "100%" },
                    { k: "التوظيف", v: "AI" },
                    { k: "العملاء", v: "CRM" },
                    { k: "التقارير", v: "Live" },
                  ].map((c) => (
                    <div key={c.k} className="rounded-xl bg-white border border-slate-200 p-3 text-center">
                      <div className="text-sm font-black text-brand-cyan-dark font-display">{c.v}</div>
                      <div className="text-[10px] text-slate-500 font-cairo mt-0.5">{c.k}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <p className="mt-3 text-center text-[11px] text-slate-400 font-cairo">
              نفس النظام اللي على المتصفح — في إطار ويندوز أصلي
            </p>
          </div>

          {/* Right — download + modes */}
          <div>
            <a
              href={DOWNLOAD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex w-full sm:w-auto items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-brand-cyan to-brand-cyan-dark text-white font-black text-lg shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:-translate-y-0.5 transition-all font-cairo"
            >
              <span className="text-2xl leading-none">⬇</span>
              نزّل لويندوز (64-bit)
            </a>
            <p className="text-xs text-slate-500 mt-2 font-cairo">
              ويندوز 10 / 11 · مجاني · أيقونة على سطح المكتب + قائمة ابدأ
            </p>

            {/* Two modes */}
            <div className="mt-7 space-y-3">
              <ModeCard
                icon="☁️"
                title="بالإنترنت — الوضع السحابي"
                desc="أول ما تفتح البرنامج، اختر «السحابة» — هيفتحلك حسابك على nidhamhr.com كتطبيق ويندوز. تحديثات تلقائية، مفيش أي إعداد."
              />
              <ModeCard
                icon="🔌"
                title="بدون إنترنت — سيرفر شركتك المحلي"
                desc="ثبّت نسخة Nidham Enterprise على سيرفر أو جهاز في شبكتك (Docker)، ووجّه البرنامج لعنوانه المحلي — يشتغل بالكامل بدون إنترنت (Air-gapped) جوّه شبكة الشركة."
              />
            </div>

            <div className="mt-6 flex flex-wrap gap-3 text-sm">
              <Link
                href="/enterprise"
                className="inline-flex items-center gap-1.5 text-brand-cyan-dark hover:text-brand-cyan font-bold font-cairo underline underline-offset-2"
              >
                إزاي يشتغل بدون إنترنت؟ ←
              </Link>
              <a
                href="https://wa.me/201055356622?text=محتاج مساعدة في تثبيت تطبيق سطح المكتب"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-slate-500 hover:text-emerald-600 font-bold font-cairo underline underline-offset-2"
              >
                محتاج مساعدة في التثبيت؟
              </a>
            </div>

            <p className="mt-5 text-[11px] text-slate-400 font-cairo leading-relaxed">
              💡 أول مرة تشغّله، ويندوز ممكن يقول «ناشر غير معروف» — اضغط
              «More info» ثم «Run anyway». ده طبيعي قبل توقيع البرنامج رقميًا.
              نسخ macOS و Linux قريبًا.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function ModeCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 hover:border-brand-cyan/40 hover:shadow-md transition-all">
      <div className="text-2xl shrink-0">{icon}</div>
      <div>
        <h3 className="font-black text-slate-800 font-cairo mb-1 text-sm">{title}</h3>
        <p className="text-xs text-slate-600 leading-relaxed font-cairo">{desc}</p>
      </div>
    </div>
  );
}
