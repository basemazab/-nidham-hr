// Founder note — the most honest trust signal we have while pre-customers:
// the founder is a real HR practitioner who built نِظام for his own pain.
// NO fabricated logos/testimonials/usage numbers — those get added (real,
// with permission) only after the first customers close.

const TRUST = [
  "متوافق مع قانون العمل 12/2003 والتأمينات 148/2019",
  "تشفير AES + عزل بيانات لكل شركة (RLS)",
  "نسخ احتياطي يومي",
  "دعم بالعربي",
];

export function FounderNote() {
  return (
    <section className="px-6 py-16 bg-white">
      <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-cyan-50/30 p-8 md:p-10">
        <div dir="rtl" className="flex flex-col items-start gap-6 md:flex-row">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-cyan to-brand-navy font-display text-2xl font-black text-white">
            ب
          </div>
          <div className="flex-1 text-right">
            <span className="mb-3 inline-block rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1 text-xs font-bold text-brand-cyan-dark font-cairo">
              ليه نِظام؟
            </span>
            <h2 className="mb-3 text-2xl font-black text-slate-800 font-cairo md:text-3xl">
              اتعمل من HR… لـ HR
            </h2>
            <p className="mb-5 leading-relaxed text-slate-600 font-cairo">
              أنا <strong className="text-slate-800">باسم عزب</strong>، بشتغل موارد بشرية في شركات
              صناعية بمئات الموظفين. كل شهر كنت بعاني نفس الوجع — مرتبات على إكسيل، تأمينات وأوفر تايم
              بيتحسبوا غلط، وحضور يدوي. عملت <strong className="text-slate-800">نِظام</strong> عشان يحل
              ده فعلًا: مبني على قانون العمل المصري من واقع تجربة حقيقية، مش نظري.
            </p>
            <div className="mb-5 flex flex-wrap gap-2">
              {TRUST.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-600 font-cairo"
                >
                  ✓ {t}
                </span>
              ))}
            </div>
            <p className="text-sm font-cairo">
              <span className="font-black text-slate-800">باسم عزب</span>
              <span className="text-slate-500">
                {" "}
                — مؤسس نِظام · مصمّم للمصانع والشركات من 50 لـ 500+ موظف
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
