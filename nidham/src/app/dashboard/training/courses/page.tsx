"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const STORAGE_KEY = "nidham_training_courses";

const CATEGORY_LABELS: Record<string, string> = {
  Technical: "تقنية",
  Management: "إدارية",
  Soft_Skills: "مهارات شخصية",
  Compliance: "امتثال",
  Language: "لغات",
  Safety: "سلامة",
  Other: "أخرى",
};

const TYPE_LABELS: Record<string, string> = {
  in_person: "حضوري",
  online: "أونلاين",
  hybrid: "هجين",
};

const SAMPLE_COURSES = [
  { id: "c1", title: "مهارات القيادة والإدارة", category: "Management", duration_hours: 24, instructor: "د. أحمد السيد", course_type: "in_person", status: "active", description: "برنامج متكامل لتطوير المهارات القيادية" },
  { id: "c2", title: "اللغة الإنجليزية للأعمال", category: "Language", duration_hours: 40, instructor: "أ. سارة حسن", course_type: "online", status: "active", description: "دورة مكثفة للغة الإنجليزية في مجال الأعمال" },
  { id: "c3", title: "الامتثال واللوائح", category: "Compliance", duration_hours: 16, instructor: "م. خالد يوسف", course_type: "in_person", status: "active", description: "الامتثال للوائح العمل والتأمينات الاجتماعية" },
  { id: "c4", title: "مهارات التواصل الفعال", category: "Soft_Skills", duration_hours: 12, instructor: "د. نورا خالد", course_type: "hybrid", status: "active", description: "تطوير مهارات الاتصال والتواصل في بيئة العمل" },
  { id: "c5", title: "إدارة المشاريع الاحترافية", category: "Management", duration_hours: 30, instructor: "د. أحمد محمود", course_type: "in_person", status: "inactive", description: "منهجية PMP لإدارة المشاريع" },
  { id: "c6", title: "الأمن والسلامة المهنية", category: "Safety", duration_hours: 8, instructor: "م. محمد علي", course_type: "in_person", status: "active", description: "معايير الأمن والسلامة في مكان العمل" },
  { id: "c7", title: "برمجة وتطوير الويب", category: "Technical", duration_hours: 36, instructor: "أ. عمر حسن", course_type: "online", status: "active", description: "أساسيات تطوير الويب باستخدام HTML و CSS و JavaScript" },
  { id: "c8", title: "تحليل البيانات باستخدام Excel", category: "Technical", duration_hours: 20, instructor: "أ. منى سامي", course_type: "hybrid", status: "active", description: "تحليل البيانات وإعداد التقارير باستخدام Excel المتقدم" },
];

function loadCourses() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* noop */ }
  return [];
}

function saveCourses(courses: unknown[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(courses));
}

export default function CoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState(SAMPLE_COURSES);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const stored = loadCourses();
    if (stored.length > 0) setCourses(stored);
    else saveCourses(SAMPLE_COURSES);
  }, []);

  const filtered = courses.filter(
    (c) =>
      c.title.includes(search) ||
      c.instructor.includes(search) ||
      (CATEGORY_LABELS[c.category] || c.category).includes(search),
  );

  return (
    <main className="flex-1 px-4 md:px-6 py-6 bg-gradient-to-b from-slate-50 via-white to-emerald-50/20 min-h-screen" dir="rtl">
      <div className="max-w-6xl mx-auto">
        <div className="mb-4 flex items-center justify-between">
          <Link href="/dashboard/training" className="text-sm text-slate-500 hover:text-emerald-700 font-cairo">
            ← التدريب والتطوير
          </Link>
          <Link
            href="/dashboard/training/courses/new"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm shadow-md font-cairo hover:shadow-lg transition"
          >
            + إضافة دورة
          </Link>
        </div>

        <header className="mb-6">
          <h1 className="text-3xl font-black font-cairo text-slate-800 mb-1">📚 جميع الدورات التدريبية</h1>
          <p className="text-sm text-slate-500 font-cairo">
            تصفح وابحث في جميع الدورات المتاحة — اضغط على أي دورة للتسجيل
          </p>
        </header>

        {/* Search */}
        <div className="mb-6 relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث عن دورة بالاسم أو المدرب..."
            className="w-full px-5 py-3 pr-12 rounded-2xl border-2 border-slate-200 bg-white text-sm font-cairo focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 outline-none transition-all shadow-sm"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
        </div>

        {/* Course Cards */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
            <div className="text-5xl mb-3">📚</div>
            <h2 className="text-lg font-bold text-slate-700 font-cairo mb-2">لا توجد نتائج</h2>
            <p className="text-sm text-slate-500 font-cairo mb-6">مافيش دورات مطابقة لبحثك</p>
            <button
              onClick={() => setSearch("")}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold font-cairo"
            >
              مسح البحث
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((course) => (
              <Link
                key={course.id}
                href={`/dashboard/training/enroll/${course.id}`}
                className="group bg-white border-2 border-slate-200 rounded-2xl p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 flex items-center justify-center text-2xl">
                    📖
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full border font-bold font-cairo ${
                      course.status === "active"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-slate-100 text-slate-500 border-slate-200"
                    }`}
                  >
                    {course.status === "active" ? "نشط" : "غير نشط"}
                  </span>
                </div>
                <h3 className="text-base font-black font-cairo text-slate-800 mb-1 group-hover:text-emerald-700 transition">
                  {course.title}
                </h3>
                <div className="space-y-1 text-[11px] text-slate-500 font-cairo">
                  <div className="flex items-center gap-2">
                    <span>🏷 {CATEGORY_LABELS[course.category] || course.category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>⏱ {course.duration_hours} ساعة</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>👨‍🏫 {course.instructor}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>💻 {TYPE_LABELS[course.course_type] || course.course_type}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
