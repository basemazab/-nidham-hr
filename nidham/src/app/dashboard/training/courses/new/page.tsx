"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

const STORAGE_KEY = "nidham_training_courses";

const CATEGORIES = [
  { value: "Technical", label: "تقنية" },
  { value: "Management", label: "إدارية" },
  { value: "Soft_Skills", label: "مهارات شخصية" },
  { value: "Compliance", label: "امتثال" },
  { value: "Language", label: "لغات" },
  { value: "Safety", label: "سلامة" },
  { value: "Other", label: "أخرى" },
];

const COURSE_TYPES = [
  { value: "in_person", label: "حضوري" },
  { value: "online", label: "أونلاين" },
  { value: "hybrid", label: "هجين" },
];

function NewCourseForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    const course = {
      id: "c" + Date.now(),
      title: data.get("title") as string,
      category: (data.get("category") as string) || "Technical",
      description: (data.get("description") as string) || "",
      duration_hours: parseInt(data.get("duration") as string) || 0,
      max_participants: parseInt(data.get("max_participants") as string) || 0,
      instructor: (data.get("instructor") as string) || "",
      course_type: (data.get("course_type") as string) || "in_person",
      status: "active",
    };

    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    existing.push(course);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));

    router.push("/dashboard/training/courses");
    router.refresh();
  }

  return (
    <main className="flex-1 px-6 py-8 bg-gradient-to-b from-slate-50 via-white to-emerald-50/30 min-h-screen" dir="rtl">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/dashboard/training/courses"
          className="text-sm text-slate-500 hover:text-emerald-700 font-cairo"
        >
          ← الرجوع للدورات
        </Link>

        <header className="mt-3 mb-6">
          <h1 className="text-3xl font-black font-cairo text-slate-800 mb-1">
            ✍ إضافة دورة تدريبية جديدة
          </h1>
          <p className="text-sm text-slate-500 font-cairo">
            أدخل بيانات الدورة الجديدة — هتظهر فوراً في كتالوج الدورات
          </p>
        </header>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-cairo">
            ⚠ {decodeURIComponent(error)}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
          {/* Course Title */}
          <div>
            <label className="block text-sm font-bold text-slate-700 font-cairo mb-1.5">
              عنوان الدورة <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              required
              placeholder="مثال: مهارات القيادة والإدارة"
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-sm font-cairo focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 outline-none transition"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-bold text-slate-700 font-cairo mb-1.5">التصنيف</label>
            <select
              name="category"
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-sm font-cairo focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 outline-none transition"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-bold text-slate-700 font-cairo mb-1.5">الوصف</label>
            <textarea
              name="description"
              rows={4}
              placeholder="وصف مختصر لمحتوى الدورة وأهدافها"
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-sm font-cairo focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 outline-none transition resize-y"
            />
          </div>

          {/* Duration + Max Participants */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 font-cairo mb-1.5">المدة (ساعات)</label>
              <input
                type="number"
                name="duration"
                min={1}
                placeholder="٢٤"
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-sm font-cairo focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 font-cairo mb-1.5">الحد الأقصى للمشاركين</label>
              <input
                type="number"
                name="max_participants"
                min={1}
                placeholder="٣٠"
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-sm font-cairo focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 outline-none transition"
              />
            </div>
          </div>

          {/* Instructor + Course Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 font-cairo mb-1.5">اسم المدرب</label>
              <input
                type="text"
                name="instructor"
                placeholder="د. أحمد السيد"
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-sm font-cairo focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 font-cairo mb-1.5">نوع الدورة</label>
              <select
                name="course_type"
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-sm font-cairo focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 outline-none transition"
              >
                {COURSE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-base shadow-lg font-cairo hover:from-emerald-600 hover:to-teal-700 transition"
            >
              💾 حفظ الدورة
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

export default function NewCoursePage() {
  return (
    <Suspense>
      <NewCourseForm />
    </Suspense>
  );
}
