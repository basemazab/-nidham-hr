import Link from "next/link";
import { JobSearchWrapper } from "@/components/jobs/job-search-wrapper";
import { Button } from "@/components/ui/button";
import { Building2, Users, Search as SearchIcon, Zap } from "lucide-react";

const STATS = [
  { label: "وظيفة متاحة", value: "١٠,٠٠٠+" },
  { label: "شركة مسجلة", value: "٥٠٠+" },
  { label: "باحث عن عمل", value: "٥٠,٠٠٠+" },
  { label: "توظيف ناجح", value: "٢,٠٠٠+" },
];

const HOW_IT_WORKS = [
  {
    icon: SearchIcon,
    title: "ابحث عن وظيفة",
    description: "تصفح آلاف الوظائف من أفضل الشركات في مصر والوطن العربي",
  },
  {
    icon: Zap,
    title: "تقديم ذكي",
    description: "قدم سيرتك الذاتية واحصل على تحليل فوري من الذكاء الاصطناعي",
  },
  {
    icon: Building2,
    title: "احصل على الوظيفة",
    description: "تواصل مع الشركات مباشرة وتابع حالة طلباتك",
  },
];

const TESTIMONIALS = [
  {
    name: "أحمد محمد",
    role: "مهندس برمجيات",
    text: "حصلت على وظيفة أحلامي في أقل من أسبوع! النظام سهل جداً والتوصيات دقيقة.",
  },
  {
    name: "سارة علي",
    role: "HR Manager",
    text: "نظام توظيف وفر علينا وقتاً وجهداً كبيرين في فلترة المرشحين. تحليل AI دقيق جداً.",
  },
  {
    name: "محمد حسن",
    role: "مطور Full Stack",
    text: "أفضل منصة توظيف استخدمتها. التقديم سريع والشركات ترد بسرعة.",
  },
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              وظيفتك المثالية{" "}
              <span className="text-accent-500">في الوطن العربي</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-primary-100">
              أكثر من ١٠,٠٠٠ وظيفة في القاهرة، دبي، الرياض، والمزيد. منصة توظيف ذكية
              تستخدم AI لمطابقة أفضل المواهب مع أفضل الفرص.
            </p>
          </div>

          <div className="mt-12">
            <JobSearchWrapper />
          </div>

          <div className="mt-12 flex justify-center gap-4 flex-wrap">
            <Link href="/register?type=company">
              <Button variant="accent" size="lg">
                للشركات - انشر وظيفة
              </Button>
            </Link>
            <Link href="/register?type=candidate">
              <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10">
                للباحثين - أنشئ حساب
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-7xl px-4 -mt-8 sm:px-6 lg:px-8 relative z-10">
        <div className="rounded-2xl bg-white p-8 shadow-xl">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-primary-800">{stat.value}</div>
                <div className="mt-1 text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">كيف يعمل نظام توظيف</h2>
          <p className="mt-4 text-gray-600">ثلاث خطوات بسيطة للحصول على وظيفتك المثالية</p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {HOW_IT_WORKS.map((step, i) => (
            <div key={step.title} className="relative rounded-2xl border bg-white p-8 text-center shadow-sm">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-accent-500 text-white text-sm font-bold">
                {i + 1}
              </div>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary-50 text-primary-800">
                <step.icon className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">{step.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">ماذا يقول المستخدمون</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="rounded-2xl border bg-white p-6 shadow-sm">
                <p className="text-gray-600 leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-800 text-white text-sm font-bold">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-primary-900 to-primary-800 p-12 text-center text-white">
          <h2 className="text-3xl font-bold">ابدأ رحلتك المهنية اليوم</h2>
          <p className="mt-4 text-primary-100 max-w-lg mx-auto">
            انضم إلى آلاف المحترفين الذين وجدوا وظائف أحلامهم عبر نظام توظيف
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link href="/register?type=candidate">
              <Button variant="accent" size="lg">إنشاء حساب مجاني</Button>
            </Link>
            <Link href="/jobs">
              <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10">
                تصفح الوظائف
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
