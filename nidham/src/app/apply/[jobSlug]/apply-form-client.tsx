"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Check, ChevronRight, ChevronLeft, Upload, FileText, Loader2, Send, ArrowLeft } from "lucide-react";

type Question = {
  id: string;
  type: "text" | "multiple_choice" | "yes_no" | "file";
  label: string;
  required: boolean;
  options?: string[];
};

type Props = {
  jobId: string;
  jobSlug: string;
  questions: Question[];
  companyName?: string;
};

const STEPS = ["البيانات الشخصية", "أسئلة الوظيفة", "السيرة الذاتية", "مراجعة وإرسال"];
const STORAGE_KEY_PREFIX = "nidham_apply_";

type PersonalInfo = {
  full_name: string;
  email: string;
  phone: string;
  city: string;
};

type Answers = Record<string, string>;

export function ApplyFormClient({ jobId, jobSlug, questions, companyName }: Props) {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [appId, setAppId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [personal, setPersonal] = useState<PersonalInfo>({
    full_name: "",
    email: "",
    phone: "",
    city: "",
  });

  const [answers, setAnswers] = useState<Answers>({});
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [coverMessage, setCoverMessage] = useState("");

  const storageKey = `${STORAGE_KEY_PREFIX}${jobId}`;

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.personal) setPersonal(data.personal);
        if (data.answers) setAnswers(data.answers);
        if (data.coverMessage) setCoverMessage(data.coverMessage);
        if (typeof data.step === "number" && data.step > 0) setStep(data.step);
      }
    } catch { /* ignore */ }
  }, [storageKey]);

  // Auto-save to localStorage
  useEffect(() => {
    if (submitted) return;
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ personal, answers, coverMessage, step, questions }),
      );
    } catch { /* ignore */ }
  }, [personal, answers, coverMessage, step, questions, storageKey, submitted]);

  const validateStep = useCallback((s: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (s === 0) {
      if (!personal.full_name.trim()) newErrors.full_name = "الاسم الكامل مطلوب";
      if (!personal.email.trim()) newErrors.email = "البريد الإلكتروني مطلوب";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personal.email))
        newErrors.email = "البريد الإلكتروني غير صحيح";
    }

    if (s === 1) {
      for (const q of questions) {
        if (q.required) {
          const val = answers[q.id]?.trim();
          if (!val) {
            newErrors[q.id] = q.required ? "هذا السؤال مطلوب" : "";
          }
        }
      }
    }

    if (s === 2) {
      if (!resumeFile && !coverMessage) {
        // Either CV or cover is fine, but at least one file upload
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [personal, answers, resumeFile, coverMessage, questions]);

  const next = () => {
    if (validateStep(step)) {
      setStep(Math.min(step + 1, STEPS.length - 1));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const prev = () => {
    setStep(Math.max(step - 1, 0));
    setErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    if (!validateStep(step)) return;
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("job_slug", jobSlug);
      formData.append("full_name", personal.full_name);
      formData.append("email", personal.email);
      formData.append("phone", personal.phone);
      formData.append("city", personal.city);
      formData.append("answers", JSON.stringify(answers));
      formData.append("cover_message", coverMessage);
      if (resumeFile) {
        formData.append("resume", resumeFile);
      }

      const res = await fetch("/api/jobs/apply", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.ok && data.application_id) {
        setAppId(data.application_id);
        setSubmitted(true);
        localStorage.removeItem(storageKey);
      } else {
        setErrors({ form: data.error || "حدث خطأ أثناء التقديم" });
      }
    } catch {
      setErrors({ form: "حدث خطأ في الاتصال، حاول مرة أخرى" });
    }
    setSubmitting(false);
  };

  // Success screen
  if (submitted) {
    return (
      <div className="text-center py-16 sm:py-24">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border-2 border-emerald-500/30 flex items-center justify-center mx-auto mb-6 sm:mb-8">
          <Check size={36} className="text-emerald-400" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black font-cairo text-white mb-3">
          تم استلام طلبك بنجاح 🎉
        </h2>
        <p className="text-white/60 font-cairo text-base sm:text-lg max-w-md mx-auto leading-relaxed mb-6">
          شكرًا لتقديمك{companyName ? ` على وظيفة في ${companyName}` : ""}. فريق الموارد
          البشرية هيراجع طلبك وهيتواصل معاك في أقرب فرصة — تابع بريدك الإلكتروني 📧
        </p>
        <div className="inline-block px-6 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white/50 text-sm font-cairo">
          رقم الطلب: <span className="font-mono text-white/70" dir="ltr">{appId?.slice(0, 8)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/[0.03] backdrop-blur-sm rounded-3xl border border-white/10 p-6 sm:p-8 md:p-10">
      {/* Progress bar */}
      <div className="mb-8 sm:mb-10">
        <div className="flex items-center justify-between mb-3">
          {STEPS.map((label, i) => (
            <div key={i} className="flex flex-col items-center" style={{ width: `${100 / STEPS.length}%` }}>
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold font-cairo transition-all duration-500 ${
                  i < step
                    ? "bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/50"
                    : i === step
                      ? "bg-[#c9a84c]/20 text-[#c9a84c] border-2 border-[#c9a84c]/50 shadow-lg shadow-[#c9a84c]/10"
                      : "bg-white/[0.05] text-white/30 border-2 border-white/10"
                }`}
              >
                {i < step ? <Check size={16} /> : i + 1}
              </div>
              <span
                className={`text-[10px] sm:text-xs font-cairo mt-1.5 text-center leading-tight ${
                  i <= step ? "text-white/70" : "text-white/30"
                }`}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
        <div className="relative h-1 bg-white/[0.06] rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 right-0 bg-gradient-to-l from-[#c9a84c] to-[#c9a84c]/60 rounded-full transition-all duration-500"
            style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Error banner */}
      {errors.form && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-cairo">
          ⚠ {errors.form}
        </div>
      )}

      {/* Step 0: Personal Info */}
      {step === 0 && (
        <div className="space-y-5 animate-fadeIn">
          <h2 className="text-xl sm:text-2xl font-black font-cairo text-white mb-1">البيانات الشخصية</h2>
          <p className="text-white/40 text-sm font-cairo mb-6">الخطوة الأولى: معلومات التواصل الأساسية</p>

          <Field label="الاسم الكامل" required error={errors.full_name}>
            <input
              type="text"
              value={personal.full_name}
              onChange={(e) => setPersonal({ ...personal, full_name: e.target.value })}
              placeholder="محمد أحمد علي"
              className="w-full px-4 py-3.5 rounded-xl bg-white/[0.06] border border-white/10 text-white text-sm font-cairo placeholder-white/30 focus:border-[#c9a84c]/50 focus:ring-2 focus:ring-[#c9a84c]/10 outline-none transition"
            />
          </Field>

          <Field label="البريد الإلكتروني" required error={errors.email}>
            <input
              type="email"
              value={personal.email}
              onChange={(e) => setPersonal({ ...personal, email: e.target.value })}
              placeholder="name@example.com"
              dir="ltr"
              className="w-full px-4 py-3.5 rounded-xl bg-white/[0.06] border border-white/10 text-white text-sm placeholder-white/30 focus:border-[#c9a84c]/50 focus:ring-2 focus:ring-[#c9a84c]/10 outline-none transition"
            />
          </Field>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="رقم الموبايل" error={errors.phone}>
              <input
                type="tel"
                value={personal.phone}
                onChange={(e) => setPersonal({ ...personal, phone: e.target.value })}
                placeholder="01XXXXXXXXX"
                dir="ltr"
                className="w-full px-4 py-3.5 rounded-xl bg-white/[0.06] border border-white/10 text-white text-sm placeholder-white/30 focus:border-[#c9a84c]/50 focus:ring-2 focus:ring-[#c9a84c]/10 outline-none transition"
              />
            </Field>
            <Field label="المدينة">
              <input
                type="text"
                value={personal.city}
                onChange={(e) => setPersonal({ ...personal, city: e.target.value })}
                placeholder="القاهرة"
                className="w-full px-4 py-3.5 rounded-xl bg-white/[0.06] border border-white/10 text-white text-sm font-cairo placeholder-white/30 focus:border-[#c9a84c]/50 focus:ring-2 focus:ring-[#c9a84c]/10 outline-none transition"
              />
            </Field>
          </div>
        </div>
      )}

      {/* Step 1: Job-specific questions */}
      {step === 1 && (
        <div className="space-y-5 animate-fadeIn">
          <h2 className="text-xl sm:text-2xl font-black font-cairo text-white mb-1">أسئلة الوظيفة</h2>
          <p className="text-white/40 text-sm font-cairo mb-6">جاوب على الأسئلة دي عشان نساعد الـ HR يفهم خبراتك</p>

          {questions.length === 0 && (
            <p className="text-white/30 text-sm font-cairo text-center py-8">
              مفيش أسئلة محددة للوظيفة دي — تقدر تتخطى الخطوة دي.
            </p>
          )}

          {questions.map((q) => (
            <div key={q.id}>
              <label className="block text-sm font-bold text-white/80 font-cairo mb-2">
                {q.label}
                {q.required && <span className="text-[#c9a84c] mr-1">*</span>}
              </label>
              {errors[q.id] && (
                <p className="text-red-400 text-xs font-cairo mb-1">{errors[q.id]}</p>
              )}

              {q.type === "text" && (
                <textarea
                  value={answers[q.id] ?? ""}
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  rows={3}
                  placeholder="اكتب إجابتك..."
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.06] border border-white/10 text-white text-sm font-cairo placeholder-white/30 focus:border-[#c9a84c]/50 focus:ring-2 focus:ring-[#c9a84c]/10 outline-none transition resize-none"
                />
              )}

              {q.type === "multiple_choice" && q.options && (
                <div className="space-y-2">
                  {q.options.filter(Boolean).map((opt, oi) => (
                    <label
                      key={oi}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition ${
                        answers[q.id] === opt
                          ? "border-[#c9a84c]/50 bg-[#c9a84c]/10 text-white"
                          : "border-white/10 bg-white/[0.04] text-white/60 hover:border-white/20"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q_${q.id}`}
                        value={opt}
                        checked={answers[q.id] === opt}
                        onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                        className="sr-only"
                      />
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          answers[q.id] === opt ? "border-[#c9a84c]" : "border-white/20"
                        }`}
                      >
                        {answers[q.id] === opt && <div className="w-2 h-2 rounded-full bg-[#c9a84c]" />}
                      </div>
                      <span className="text-sm font-cairo">{opt}</span>
                    </label>
                  ))}
                </div>
              )}

              {q.type === "yes_no" && (
                <div className="flex gap-3">
                  {["نعم", "لا"].map((opt) => (
                    <label
                      key={opt}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border cursor-pointer transition ${
                        answers[q.id] === opt
                          ? "border-[#c9a84c]/50 bg-[#c9a84c]/10 text-white"
                          : "border-white/10 bg-white/[0.04] text-white/60 hover:border-white/20"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q_${q.id}`}
                        value={opt}
                        checked={answers[q.id] === opt}
                        onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                        className="sr-only"
                      />
                      <span className="text-sm font-bold font-cairo">{opt}</span>
                    </label>
                  ))}
                </div>
              )}

              {q.type === "file" && (
                <div>
                  <input
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setAnswers({ ...answers, [q.id]: file.name });
                    }}
                    className="w-full text-sm text-white/50 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-[#c9a84c]/10 file:text-[#c9a84c] hover:file:bg-[#c9a84c]/20 file:cursor-pointer cursor-pointer"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Step 2: Resume upload */}
      {step === 2 && (
        <div className="space-y-5 animate-fadeIn">
          <h2 className="text-xl sm:text-2xl font-black font-cairo text-white mb-1">السيرة الذاتية</h2>
          <p className="text-white/40 text-sm font-cairo mb-6">ارفعلنا الـ CV بتاعك — PDF أو Word</p>

          <div
            className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition cursor-pointer ${
              resumeFile
                ? "border-emerald-500/30 bg-emerald-500/[0.03]"
                : "border-white/10 hover:border-[#c9a84c]/30 bg-white/[0.02]"
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
              className="hidden"
            />
            {resumeFile ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <FileText size={28} className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-white font-bold font-cairo text-sm">{resumeFile.name}</p>
                  <p className="text-white/40 text-xs font-cairo">{(resumeFile.size / 1024).toFixed(1)} KB</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setResumeFile(null); }}
                  className="text-xs text-red-400 hover:text-red-300 font-cairo"
                >
                  إزالة الملف
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center">
                  <Upload size={28} className="text-white/40" />
                </div>
                <div>
                  <p className="text-white/60 font-bold font-cairo text-sm">اضغط لرفع السيرة الذاتية</p>
                  <p className="text-white/30 text-xs font-cairo mt-1">PDF, Word — حد أقصى 10 MB</p>
                </div>
              </div>
            )}
          </div>

          <Field label="رسالة تغطية (اختياري)">
            <textarea
              value={coverMessage}
              onChange={(e) => setCoverMessage(e.target.value)}
              rows={4}
              placeholder="اكتب رسالة مختصرة عن سبب حماسك للوظيفة..."
              className="w-full px-4 py-3.5 rounded-xl bg-white/[0.06] border border-white/10 text-white text-sm font-cairo placeholder-white/30 focus:border-[#c9a84c]/50 focus:ring-2 focus:ring-[#c9a84c]/10 outline-none transition resize-none"
            />
            <div className="text-left mt-1">
              <span className="text-[10px] text-white/30 font-cairo">{coverMessage.length} حرف</span>
            </div>
          </Field>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <div className="space-y-5 animate-fadeIn">
          <h2 className="text-xl sm:text-2xl font-black font-cairo text-white mb-1">مراجعة وإرسال</h2>
          <p className="text-white/40 text-sm font-cairo mb-6">تأكد من صحة بياناتك قبل الإرسال</p>

          <div className="space-y-4">
            <ReviewSection title="البيانات الشخصية">
              <ReviewRow label="الاسم" value={personal.full_name} />
              <ReviewRow label="البريد" value={personal.email} />
              <ReviewRow label="الموبايل" value={personal.phone || "—"} />
              <ReviewRow label="المدينة" value={personal.city || "—"} />
            </ReviewSection>

            {questions.length > 0 && (
              <ReviewSection title="إجابات الأسئلة">
                {questions.map((q) => (
                  <ReviewRow key={q.id} label={q.label} value={answers[q.id] || "—"} />
                ))}
              </ReviewSection>
            )}

            <ReviewSection title="السيرة الذاتية">
              <ReviewRow label="الملف" value={resumeFile ? resumeFile.name : "لم يتم الرفع"} />
              <ReviewRow label="رسالة التغطية" value={coverMessage || "—"} />
            </ReviewSection>
          </div>

          <div className="bg-[#c9a84c]/5 border border-[#c9a84c]/20 rounded-xl p-4 text-sm text-white/60 font-cairo leading-relaxed">
            🤖 بالتقديم، أنت توافق على أن نِظام يستخدم الذكاء الاصطناعي لتحليل سيرتك الذاتية وإرسال ملخص ذكي للجهة المعلنة عن الوظيفة.
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-white/40 font-cairo">
            🔒 بياناتك محمية وبتروح لصاحب الوظيفة بس — مش بتتنشر في أي مكان.
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex items-center justify-between mt-8 sm:mt-10 pt-6 border-t border-white/10">
        {step > 0 ? (
          <button
            type="button"
            onClick={prev}
            className="flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10 text-white/60 text-sm font-bold font-cairo hover:bg-white/[0.04] transition"
          >
            <ChevronRight size={18} /> السابق
          </button>
        ) : (
          <div />
        )}

        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={next}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-l from-[#c9a84c] to-[#b8962e] text-[#0a0f1a] text-sm font-bold font-cairo hover:shadow-lg hover:shadow-[#c9a84c]/20 transition"
          >
            التالي <ChevronLeft size={18} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-l from-emerald-500 to-emerald-600 text-white text-sm font-bold font-cairo hover:shadow-lg hover:shadow-emerald-500/20 transition disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
            {submitting ? "جاري الإرسال..." : "إرسال الطلب"}
          </button>
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-bold text-white/80 font-cairo mb-2">
        {label}
        {required && <span className="text-[#c9a84c] mr-1">*</span>}
      </label>
      {error && <p className="text-red-400 text-xs font-cairo mb-1">{error}</p>}
      {children}
    </div>
  );
}

function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/[0.04] rounded-xl border border-white/10 overflow-hidden">
      <div className="px-4 py-3 bg-white/[0.03] border-b border-white/10">
        <h3 className="text-sm font-bold text-white/70 font-cairo">{title}</h3>
      </div>
      <div className="px-4 py-2 divide-y divide-white/5">{children}</div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <span className="text-xs text-white/50 font-cairo shrink-0">{label}</span>
      <span className="text-xs text-white/80 font-cairo text-left">{value}</span>
    </div>
  );
}
