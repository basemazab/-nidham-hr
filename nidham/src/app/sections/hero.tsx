"use client";

import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { BridgeMockup, PayslipMockup, CvReviewMockup } from "./section-mockups";

// Staggered entrance for the copy column. Children fade+rise in sequence so
// the hero "assembles" itself on load instead of snapping in flat.
const container: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

// The product-preview stack slides in from the side a beat after the copy.
const previewVariant: Variants = {
  hidden: { opacity: 0, x: -40, scale: 0.96 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.35 },
  },
};

export function HeroSection() {
  // Respect users who ask the OS to minimize motion: kill the looping
  // float/aurora animations and reveal everything immediately.
  const reduce = useReducedMotion();
  const initial = reduce ? "visible" : "hidden";

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-cyan-50/40 px-6 py-16 md:py-24">
      {/* ── Living aurora background (slow-drifting brand-color glows) ── */}
      <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
        <motion.div
          className="absolute -top-32 -right-16 h-[520px] w-[520px] rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(34,211,238,0.28), transparent 70%)" }}
          animate={reduce ? undefined : { x: [0, 40, 0], y: [0, 30, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/3 -left-24 h-[480px] w-[480px] rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(201,168,76,0.16), transparent 70%)" }}
          animate={reduce ? undefined : { x: [0, -30, 0], y: [0, 40, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-24 right-1/4 h-[360px] w-[360px] rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(10,20,40,0.10), transparent 70%)" }}
          animate={reduce ? undefined : { x: [0, 25, 0], y: [0, -25, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-10 items-center">
        {/* ── Copy column ── */}
        <motion.div
          className="text-center lg:text-right"
          variants={container}
          initial={initial}
          animate="visible"
        >
          <motion.div variants={item} className="inline-flex items-center gap-3 mb-6 justify-center lg:justify-start">
            <span className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-cyan to-brand-navy shadow-xl shadow-cyan-500/20">
              <span className="text-3xl font-black text-white font-display">ن</span>
            </span>
            <span className="text-right">
              <span className="block text-4xl font-black font-display leading-none bg-gradient-to-r from-brand-cyan-dark via-brand-cyan to-brand-navy bg-clip-text text-transparent">
                نِظام
              </span>
              <span className="block text-[10px] tracking-[0.35em] text-brand-gold font-semibold mt-1.5">
                NIDHAM · BUILT FOR EGYPT
              </span>
            </span>
          </motion.div>

          <motion.h1
            variants={item}
            className="text-3xl md:text-4xl lg:text-[2.6rem] font-black text-slate-800 mb-5 font-cairo leading-tight"
          >
            نظام واحد بدل خمس أنظمة منفصلة.
            <br />
            <span className="text-brand-cyan-dark">HR + CRM + استوديو تسويق</span> — كله بالعربي + AI.
          </motion.h1>

          <motion.p
            variants={item}
            className="text-lg text-slate-600 mb-8 leading-relaxed max-w-xl mx-auto lg:mx-0 font-cairo"
          >
            من الحضور بالـ GPS لحد قسائم الرواتب، ومن الـ CRM لحد فحص الـ CVs بالـ AI. كمان{" "}
            <strong className="text-amber-700">استوديو تسويق ذكي</strong> بيصمم حملاتك، landing pages،
            ويجيب leads — متوافق مع قانون العمل المصري 12/2003 وقانون التأمينات 148/2019.
          </motion.p>

          <motion.div
            variants={item}
            className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start items-stretch sm:items-center"
          >
            <Link
              href="/signup"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-cyan-dark text-white font-bold text-lg shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:-translate-y-0.5 transition-all font-cairo"
            >
              جرّب مجانًا 14 يوم
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-xl border-2 border-slate-200 text-slate-700 font-bold text-lg hover:border-slate-400 hover:bg-white transition-all font-cairo"
            >
              تسجيل الدخول
            </Link>
          </motion.div>

          <motion.p variants={item} className="text-xs text-slate-500 mt-4 font-cairo">
            ما تحتاجش بطاقة ائتمان · تشغيل في دقيقتين · إلغاء أي وقت
          </motion.p>

          <motion.div
            variants={item}
            className="mt-6 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs font-cairo"
          >
            <Link href="/features" className="text-slate-400 hover:text-emerald-600 transition underline underline-offset-2">
              ⚡ كل المميزات
            </Link>
            <span className="text-slate-300">·</span>
            <Link href="/compare" className="text-slate-400 hover:text-emerald-600 transition underline underline-offset-2">
              📊 مقارنة مع Bayzat و ZenHR
            </Link>
            <span className="text-slate-300">·</span>
            <Link href="/why-nidham" className="text-slate-400 hover:text-emerald-600 transition underline underline-offset-2">
              💡 10 أسباب تختار نِظام
            </Link>
          </motion.div>
        </motion.div>

        {/* ── Live product-preview column ── */}
        <motion.div
          variants={previewVariant}
          initial={initial}
          animate="visible"
          className="relative mt-4 lg:mt-0"
        >
          {/* The whole stack drifts gently so the hero feels alive. */}
          <motion.div
            animate={reduce ? undefined : { y: [0, -12, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            className="relative mx-auto max-w-md"
          >
            {/* Layered cards behind for depth — inline transforms so they don't
                depend on Tailwind JIT picking up newly-added utility classes. */}
            <div
              className="absolute inset-0 hidden rounded-2xl border border-slate-200 bg-white p-2 opacity-60 shadow-lg md:block"
              style={{ transform: "translate(26px, 22px) rotate(3deg)" }}
            >
              <PayslipMockup />
            </div>
            <div
              className="absolute inset-0 hidden rounded-2xl border border-slate-200 bg-white p-2 opacity-60 shadow-lg md:block"
              style={{ transform: "translate(-26px, 14px) rotate(-3deg)" }}
            >
              <CvReviewMockup />
            </div>
            {/* Front card — Bridge Analytics dashboard */}
            <div className="relative z-10 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl ring-1 ring-cyan-500/10">
              <BridgeMockup />
            </div>

            {/* Floating live-status pills */}
            <motion.div
              animate={reduce ? undefined : { y: [0, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-4 right-2 flex items-center gap-1.5 rounded-xl border border-emerald-100 bg-white px-3 py-2 text-xs font-bold font-cairo text-emerald-700 shadow-lg sm:right-6"
            >
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              ٤٧ موظف حاضر دلوقتي
            </motion.div>
            <motion.div
              animate={reduce ? undefined : { y: [0, 8, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute -bottom-2 left-0 flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold font-cairo text-cyan-300 shadow-lg sm:left-4"
            >
              🛡️ متوافق مع القانون ١٠٠٪
            </motion.div>
          </motion.div>

          <p className="mt-5 text-center text-[11px] font-cairo text-slate-500">
            Bridge Analytics — الالتزام × الإنتاجية لكل موظف
          </p>
        </motion.div>
      </div>
    </section>
  );
}
