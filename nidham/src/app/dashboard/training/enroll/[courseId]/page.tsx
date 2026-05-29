"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

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
  { id: "c1", title: "مهارات القيادة والإدارة", category: "Management", duration_hours: 24, max_participants: 30, instructor: "د. أحمد السيد", course_type: "in_person", status: "active", description: "برنامج متكامل لتطوير المهارات القيادية والإدارية. يغطي الموضوعات الأساسية مثل التخطيط الاستراتيجي، اتخاذ القرارات، إدارة الفرق، وحل المشكلات." },
  { id: "c2", title: "اللغة الإنجليزية للأعمال", category: "Language", duration_hours: 40, max_participants: 25, instructor: "أ. سارة حسن", course_type: "online", status: "active", description: "دورة مكثفة للغة الإنجليزية في مجال الأعمال تشمل الكتابة الرسمية، المحادثات التجارية، وعروض العمل." },
  { id: "c3", title: "الامتثال واللوائح", category: "Compliance", duration_hours: 16, max_participants: 20, instructor: "م. خالد يوسف", course_type: "in_person", status: "active", description: "الامتثال للوائح العمل والتأمينات الاجتماعية وقانون العمل المصري." },
  { id: "c4", title: "مهارات التواصل الفعال", category: "Soft_Skills", duration_hours: 12, max_participants: 30, instructor: "د. نورا خالد", course_type: "hybrid", status: "active", description: "تطوير مهارات الاتصال والتواصل في بيئة العمل، الاستماع الفعال، والتفاوض." },
  { id: "c5", title: "إدارة المشاريع الاحترافية", category: "Management", duration_hours: 30, max_participants: 20, instructor: "د. أحمد محمود", course_type: "in_person", status: "inactive", description: "منهجية PMP لإدارة المشاريع — من البداية وحتى التسليم." },
  { id: "c6", title: "الأمن والسلامة المهنية", category: "Safety", duration_hours: 8, max_participants: 35, instructor: "م. محمد علي", course_type: "in_person", status: "active", description: "معايير الأمن والسلامة في مكان العمل، الإسعافات الأولية، وإجراءات الطوارئ." },
  { id: "c7", title: "برمجة وتطوير الويب", category: "Technical", duration_hours: 36, max_participants: 20, instructor: "أ. عمر حسن", course_type: "online", status: "active", description: "أساسيات تطوير الويب باستخدام HTML و CSS و JavaScript." },
  { id: "c8", title: "تحليل البيانات باستخدام Excel", category: "Technical", duration_hours: 20, max_participants: 25, instructor: "أ. منى سامي", course_type: "hybrid", status: "active", description: "تحليل البيانات وإعداد التقارير باستخدام Excel المتقدم — الجداول المحورية، الماكرو، والرسوم البيانية." },
];

function loadCourses(): typeof SAMPLE_COURSES {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* noop */ }
  return SAMPLE_COURSES;
}

export default function EnrollPage() {
  const params = useParams<{ courseId: string }>();
  const router = useRouter();
  const [course, setCourse] = useState<typeof SAMPLE_COURSES[0] | null>(null);
  const [enrolled, setEnrolled] = useState(false);

  useEffect(() => {
    const courses = loadCourses();
    const found = courses.find((c) => c.id === params.courseId);
    if (found) setCourse(found);
  }, [params.courseId]);

  function handleEnroll() {
    const enrollments = JSON.parse(localStorage.getItem("nidham_training_enrollments") || "[]");
    enrollments.push({
      id: "e" + Date.now(),
      employee_name: "أنت",
      course_name: course?.title || "",
      course_id: params.courseId,
      enrollment_date: new Date().toISOString().slice(0, 10),
      status: "pending",
      progress: 0,
    });
    localStorage.setItem("nidham_training_enrollments", JSON.stringify(enrollments));
    setEnrolled(true);
    router.refresh();
  }

  if (!course) {
    return (
      <main className="flex-1 px-4 md:px-6 py-6 bg-gradient-to-b from-slate-50 via-white to-emerald-50/20 min-h-screen" dir="rtl">
        <div className="max-w-3xl mx-auto text-center pt-20">
          <div className="text-5xl mb-3">🔍</div>
          <h2 className="text-lg font-bold text-slate-700 font-cairo mb-2">الدورة غير موجودة</h2>
          <Link href="/dashboard/training/courses" className="text-emerald-600 font-cairo font-bold">← الرجوع للدورات</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 px-4 md:px-6 py-6 bg-gradient-to-b from-slate-50 via-white to-emerald-50/20 min-h-screen" dir="rtl">
      <div className="max-w-3xl mx-auto">
        <div className="mb-4">
          <Link href="/dashboard/training/courses" className="text-sm text-slate-500 hover:text-emerald-700 font-cairo">
            ← جميع الدورات
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-l from-emerald-500 to-teal-600 p-6 text-white">
            <div className="text-4xl mb-2">📖</div>
            <h1 className="text-2xl font-black font-cairo mb-1">{course.title}</h1>
            <div className="flex flex-wrap gap-3 text-sm text-white/80 font-cairo">
              <span>🏷 {CATEGORY_LABELS[course.category] || course.category}</span>
              <span>⏱ {course.duration_hours} ساعة</span>
              <span>💻 {TYPE_LABELS[course.course_type] || course.course_type}</span>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            <div>
              <h3 className="text-sm font-black text-slate-700 font-cairo mb-1">وصف الدورة</h3>
              <p className="text-sm text-slate-600 font-cairo leading-relaxed">{course.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-xs text-slate-500 font-cairo mb-0.5">المدرب</div>
                <div className="text-sm font-bold text-slate-800 font-cairo">👨‍🏫 {course.instructor}</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-xs text-slate-500 font-cairo mb-0.5">الحد الأقصى</div>
                <div className="text-sm font-bold text-slate-800 font-cairo">👥 {course.max_participants} مشارك</div>
              </div>
            </div>

            {/* Enroll Button */}
            <div className="pt-2">
              {enrolled ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-bold font-cairo text-center">
                  ✅ تم التسجيل بنجاح! في انتظار الموافقة.
                </div>
              ) : course.status === "inactive" ? (
                <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 text-sm font-bold font-cairo text-center">
                  ⛔ هذه الدورة غير متاحة حالياً
                </div>
              ) : (
                <button
                  onClick={handleEnroll}
                  className="w-full px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-base shadow-lg font-cairo hover:from-emerald-600 hover:to-teal-700 transition"
                >
                  🎓 سجّل في الدورة
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
