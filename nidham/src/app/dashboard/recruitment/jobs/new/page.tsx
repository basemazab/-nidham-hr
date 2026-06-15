import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyProfile } from "@/lib/permissions";
import { createJob } from "../../actions";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ error?: string }>;

export default async function NewRecruitmentJobPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { profile } = await getMyProfile();
  const { error } = await searchParams;

  return (
    <main className="flex-1 px-6 py-8 bg-gradient-to-b from-slate-50 via-white to-cyan-50/30 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            href="/dashboard/recruitment/jobs"
            className="text-sm text-slate-500 hover:text-brand-cyan-dark font-cairo"
          >
            ← الرجوع للوظائف
          </Link>
        </div>

        <header className="mb-8">
          <h1 className="text-3xl font-black font-cairo text-slate-800 mb-1">
            وظيفة جديدة
          </h1>
          <p className="text-sm text-slate-500 font-cairo leading-relaxed">
            أضف وظيفة جديدة وستظهر فورًا للمتقدمين
          </p>
        </header>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-cairo">
            ⚠ {decodeURIComponent(error)}
          </div>
        )}

        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
          <form action={createJob} className="space-y-5">
            {/* Basics */}
            <div>
              <label htmlFor="title" className="block text-sm font-bold text-slate-700 mb-2 font-cairo">
                المسمى الوظيفي <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                name="title"
                type="text"
                required
                placeholder="مثل: مدير مبيعات — قطاع B2B"
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20 outline-none transition text-slate-900 font-cairo"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="department" className="block text-sm font-medium text-slate-700 mb-2 font-cairo">
                  القسم
                </label>
                <input
                  id="department"
                  name="department"
                  type="text"
                  placeholder="المبيعات"
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20 outline-none transition text-slate-900 font-cairo"
                />
              </div>

              <div>
                <label htmlFor="job_type" className="block text-sm font-medium text-slate-700 mb-2 font-cairo">
                  نوع الوظيفة
                </label>
                <select
                  id="job_type"
                  name="job_type"
                  defaultValue="full_time"
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20 outline-none transition text-slate-900 font-cairo"
                >
                  <option value="full_time">دوام كامل</option>
                  <option value="part_time">دوام جزئي</option>
                  <option value="contract">عقد</option>
                  <option value="internship">تدريب</option>
                  <option value="remote">عن بُعد</option>
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="level" className="block text-sm font-medium text-slate-700 mb-2 font-cairo">
                  المستوى الوظيفي
                </label>
                <select
                  id="level"
                  name="level"
                  defaultValue="mid"
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20 outline-none transition text-slate-900 font-cairo"
                >
                  <option value="intern">متدرب</option>
                  <option value="entry">مبتدئ</option>
                  <option value="mid">متوسط</option>
                  <option value="senior">كبير</option>
                  <option value="lead">قائد فريق</option>
                  <option value="manager">مدير</option>
                  <option value="dir">مدير إدارة</option>
                </select>
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-slate-700 mb-2 font-cairo">
                  المكان
                </label>
                <input
                  id="location"
                  name="location"
                  type="text"
                  placeholder="القاهرة الجديدة"
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20 outline-none transition text-slate-900 font-cairo"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="experience_years_min" className="block text-sm font-medium text-slate-700 mb-2 font-cairo">
                  الحد الأدنى للخبرة (سنين)
                </label>
                <input
                  id="experience_years_min"
                  name="experience_years_min"
                  type="number"
                  min="0"
                  max="40"
                  defaultValue="0"
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20 outline-none transition text-slate-900"
                />
              </div>

              <div>
                <label htmlFor="skills" className="block text-sm font-medium text-slate-700 mb-2 font-cairo">
                  المهارات
                </label>
                <input
                  id="skills"
                  name="skills"
                  type="text"
                  placeholder="Excel, CRM, English (مفصولة بفاصلة)"
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20 outline-none transition text-slate-900 font-cairo"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="salary_min" className="block text-sm font-medium text-slate-700 mb-2 font-cairo">
                  الراتب من
                </label>
                <input
                  id="salary_min"
                  name="salary_min"
                  type="number"
                  min="0"
                  step="100"
                  placeholder="10000"
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20 outline-none transition text-slate-900"
                />
              </div>
              <div>
                <label htmlFor="salary_max" className="block text-sm font-medium text-slate-700 mb-2 font-cairo">
                  الراتب إلى
                </label>
                <input
                  id="salary_max"
                  name="salary_max"
                  type="number"
                  min="0"
                  step="100"
                  placeholder="20000"
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20 outline-none transition text-slate-900"
                />
              </div>
            </div>

            <div className="space-y-3 bg-slate-50 rounded-lg p-4 border border-slate-100">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="remote_ok"
                  className="w-4 h-4 rounded border-slate-300 text-brand-cyan focus:ring-brand-cyan"
                />
                <span className="text-sm text-slate-700 font-cairo">
                  يقبل العمل عن بُعد
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_salary_visible"
                  defaultChecked
                  className="w-4 h-4 rounded border-slate-300 text-brand-cyan focus:ring-brand-cyan"
                />
                <span className="text-sm text-slate-700 font-cairo">
                  إظهار الراتب في الإعلان
                </span>
              </label>

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_public"
                  defaultChecked
                  className="mt-0.5 w-4 h-4 rounded border-slate-300 text-brand-cyan focus:ring-brand-cyan"
                />
                <span className="text-sm text-slate-700 font-cairo">
                  <strong>منشور للعموم ✦</strong>
                  <br />
                  <span className="text-xs text-slate-500">
                    أي شخص يستطيع رؤية هذه الوظيفة والتقديم عليها بدون تسجيل دخول
                  </span>
                </span>
              </label>
            </div>

            {/* Text areas */}
            <div className="space-y-4">
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-2 font-cairo">
                  نظرة عامة عن الوظيفة
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  placeholder="طبيعة العمل، الفريق المستهدف، وأهم المهام"
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20 outline-none transition text-slate-900 font-cairo resize-none"
                />
              </div>

              <div>
                <label htmlFor="requirements" className="block text-sm font-medium text-slate-700 mb-2 font-cairo">
                  المتطلبات
                </label>
                <textarea
                  id="requirements"
                  name="requirements"
                  rows={5}
                  placeholder="• بكالوريوس في تخصص ذي صلة&#10;• خبرة 3 سنوات على الأقل&#10;• إجادة استخدام برامج الأوفيس"
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20 outline-none transition text-slate-900 font-cairo resize-none"
                />
              </div>

              <div>
                <label htmlFor="responsibilities" className="block text-sm font-medium text-slate-700 mb-2 font-cairo">
                  المسؤوليات
                </label>
                <textarea
                  id="responsibilities"
                  name="responsibilities"
                  rows={4}
                  placeholder="• إدارة فريق العمل&#10;• تحقيق الأهداف الشهرية&#10;• إعداد التقارير الدورية"
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20 outline-none transition text-slate-900 font-cairo resize-none"
                />
              </div>

              <div>
                <label htmlFor="benefits" className="block text-sm font-medium text-slate-700 mb-2 font-cairo">
                  المزايا
                </label>
                <textarea
                  id="benefits"
                  name="benefits"
                  rows={3}
                  placeholder="• تأمين صحي&#10;• بدل مواصلات&#10;• مرونة في ساعات العمل"
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20 outline-none transition text-slate-900 font-cairo resize-none"
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-slate-700 mb-2 font-cairo">
                الحالة
              </label>
              <select
                id="status"
                name="status"
                defaultValue="draft"
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20 outline-none transition text-slate-900 font-cairo"
              >
                <option value="draft">مسودة</option>
                <option value="open">مفتوحة</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-brand-cyan to-brand-cyan-dark text-white font-bold shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all font-cairo"
              >
                إنشاء الوظيفة
              </button>
              <Link
                href="/dashboard/recruitment/jobs"
                className="px-6 py-3 rounded-lg border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition font-cairo"
              >
                إلغاء
              </Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
