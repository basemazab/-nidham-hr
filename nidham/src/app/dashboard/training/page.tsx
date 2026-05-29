import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyProfile } from "@/lib/permissions";

export const dynamic = "force-dynamic";

const SUMMARY_CARDS = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
    label: "إجمالي الدورات",
    value: "12",
    color: "from-sky-50 to-white border-sky-200 text-sky-700",
    iconBg: "bg-sky-100 text-sky-600",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
    label: "مسجلين حالياً",
    value: "38",
    color: "from-emerald-50 to-white border-emerald-200 text-emerald-700",
    iconBg: "bg-emerald-100 text-emerald-600",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    label: "مكتملة",
    value: "67",
    color: "from-violet-50 to-white border-violet-200 text-violet-700",
    iconBg: "bg-violet-100 text-violet-600",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
      </svg>
    ),
    label: "شهادات",
    value: "22",
    color: "from-amber-50 to-white border-amber-200 text-amber-700",
    iconBg: "bg-amber-100 text-amber-600",
  },
];

const QUICK_ACTIONS = [
  { href: "/dashboard/training/courses", label: "📚 تصفح الدورات", desc: "جميع الدورات التدريبية المتاحة", gradient: "from-sky-500 to-blue-600" },
  { href: "/dashboard/training/courses/new", label: "✍ دورة جديدة", desc: "إنشاء دورة تدريبية جديدة", gradient: "from-emerald-500 to-teal-600" },
  { href: "/dashboard/training/enrollments", label: "📋 التسجيلات", desc: "عرض حالة التسجيلات", gradient: "from-violet-500 to-purple-600" },
  { href: "/dashboard/training/courses", label: "🎓 التسجيل في دورة", desc: "سجّل موظف في دورة", gradient: "from-amber-500 to-orange-600" },
];

const RECENT_ACTIVITY = [
  { employee: "أحمد محمود", course: "مهارات القيادة والإدارة", date: "٢٨ مايو ٢٠٢٦", status: "مكتمل", badge: "bg-emerald-100 text-emerald-700" },
  { employee: "سارة حسن", course: "اللغة الإنجليزية للأعمال", date: "٢٥ مايو ٢٠٢٦", status: "مكتمل", badge: "bg-emerald-100 text-emerald-700" },
  { employee: "محمد علي", course: "الامتثال واللوائح", date: "٢٢ مايو ٢٠٢٦", status: "قيد التنفيذ", badge: "bg-amber-100 text-amber-700" },
  { employee: "نورا خالد", course: "مهارات التواصل الفعال", date: "٢٠ مايو ٢٠٢٦", status: "مكتمل", badge: "bg-emerald-100 text-emerald-700" },
  { employee: "خالد يوسف", course: "إدارة المشاريع الاحترافية", date: "١٨ مايو ٢٠٢٦", status: "مكتمل", badge: "bg-emerald-100 text-emerald-700" },
];

export default async function TrainingHubPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { profile } = await getMyProfile();

  return (
    <main className="flex-1 px-4 md:px-6 py-6 bg-gradient-to-b from-slate-50 via-white to-emerald-50/20 min-h-screen" dir="rtl">
      <div className="max-w-6xl mx-auto">
        <div className="mb-4">
          <Link href="/dashboard" className="text-sm text-slate-500 hover:text-emerald-700 font-cairo">
            ← الرجوع للـ Dashboard
          </Link>
        </div>

        <header className="mb-6">
          <div className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 text-emerald-700 text-xs font-bold mb-2 font-cairo">
            🎓 التدريب والتطوير
          </div>
          <h1 className="text-3xl font-black font-cairo text-slate-800 mb-1">
            التدريب والتطوير
          </h1>
          <p className="text-sm text-slate-500 font-cairo leading-relaxed max-w-2xl">
            منصة تدريب متكاملة — إدارة الدورات، تسجيل الموظفين، ومتابعة التقدم والحصول على الشهادات
          </p>
        </header>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {SUMMARY_CARDS.map((card, i) => (
            <div
              key={i}
              className={`p-4 rounded-2xl bg-white border-2 shadow-sm ${card.color}`}
            >
              <div className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center mb-2`}>
                {card.icon}
              </div>
              <div className="text-2xl font-black font-display text-slate-800">{card.value}</div>
              <div className="text-[11px] text-slate-500 font-cairo mt-0.5">{card.label}</div>
            </div>
          ))}
        </div>

        {/* Quick Action Cards */}
        <h2 className="text-lg font-black font-cairo text-slate-700 mb-3">إجراءات سريعة</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {QUICK_ACTIONS.map((action, i) => (
            <Link
              key={i}
              href={action.href}
              className={`group p-5 rounded-2xl bg-gradient-to-br ${action.gradient} text-white shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all`}
            >
              <div className="text-3xl mb-2">{action.label.split(" ")[0]}</div>
              <h3 className="text-base font-black font-cairo mb-0.5">{action.label.split(" ").slice(1).join(" ")}</h3>
              <p className="text-[11px] text-white/80 font-cairo">{action.desc}</p>
            </Link>
          ))}
        </div>

        {/* Recent Training Activity */}
        <h2 className="text-lg font-black font-cairo text-slate-700 mb-3">آخر النشاطات التدريبية</h2>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 text-xs font-bold text-slate-600 uppercase">
              <tr>
                <th className="px-4 py-3 font-cairo">الموظف</th>
                <th className="px-4 py-3 font-cairo">الدورة</th>
                <th className="px-4 py-3 font-cairo">تاريخ الإكمال</th>
                <th className="px-4 py-3 font-cairo">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {RECENT_ACTIVITY.map((item, i) => (
                <tr key={i} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-bold text-slate-800 font-cairo">{item.employee}</td>
                  <td className="px-4 py-3 text-slate-600 font-cairo">{item.course}</td>
                  <td className="px-4 py-3 text-slate-500 font-cairo">{item.date}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold font-cairo ${item.badge}`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
