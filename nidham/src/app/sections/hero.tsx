"use client";

import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "framer-motion";

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

// The chat-demo card slides in a beat after the copy.
const previewVariant: Variants = {
  hidden: { opacity: 0, x: -40, scale: 0.96 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.35 },
  },
};

// Chat bubbles pop in one after another so the conversation feels live.
const chatList: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.5, delayChildren: 0.9 } },
};
const bubble: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

// A friendly assistant mascot — gives the all-business product some warmth.
// Pure SVG (no 3D render), in the نِظام cyan/navy palette.
function NidhamBot({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 150 160" className={className} role="img" aria-label="مساعد نِظام">
      {/* antenna */}
      <circle cx="75" cy="12" r="6" fill="#22D3EE" />
      <rect x="72.5" y="16" width="5" height="14" rx="2.5" fill="#0E7490" />
      {/* ears */}
      <rect x="8" y="62" width="16" height="40" rx="8" fill="#22D3EE" />
      <rect x="126" y="62" width="16" height="40" rx="8" fill="#22D3EE" />
      {/* head */}
      <rect x="20" y="30" width="110" height="92" rx="28" fill="#ffffff" stroke="#22D3EE" strokeWidth="4" />
      {/* face screen */}
      <rect x="33" y="46" width="84" height="60" rx="20" fill="#0D1B2A" />
      {/* eyes */}
      <circle cx="58" cy="74" r="10" fill="#22D3EE" />
      <circle cx="92" cy="74" r="10" fill="#22D3EE" />
      <circle cx="61" cy="71" r="3.2" fill="#ffffff" />
      <circle cx="95" cy="71" r="3.2" fill="#ffffff" />
      {/* smile */}
      <path d="M60 90 Q75 100 90 90" fill="none" stroke="#22D3EE" strokeWidth="4" strokeLinecap="round" />
      {/* shoulders */}
      <path d="M34 150 Q34 126 75 126 Q116 126 116 150 Z" fill="#0E7490" />
      <rect x="60" y="120" width="30" height="12" rx="6" fill="#0E7490" />
    </svg>
  );
}

const CHAT: { who: "user" | "bot"; text: string }[] = [
  { who: "user", text: "إجازاتي باقي كام يوم؟" },
  { who: "bot", text: "أهلاً أحمد 👋 باقي ليك ١٢ يوم إجازة اعتيادية. تحب أقدّم طلب؟" },
  { who: "user", text: "اه، من بكرة ٣ أيام" },
  { who: "bot", text: "تمام ✅ اتقدّم الطلب ورايح لمديرك للموافقة." },
];

export function HeroSection() {
  // Respect users who ask the OS to minimize motion.
  const reduce = useReducedMotion();
  const initial = reduce ? "visible" : "hidden";

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-cyan-50/40 px-6 py-20 md:py-28">
      {/* ── Calm, soft background (two gentle brand glows) ── */}
      <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
        <motion.div
          className="absolute -top-40 -right-24 h-[520px] w-[520px] rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(34,211,238,0.16), transparent 70%)" }}
          animate={reduce ? undefined : { y: [0, 26, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-0 left-0 h-[420px] w-[420px] rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(13,27,42,0.06), transparent 70%)" }}
          animate={reduce ? undefined : { y: [0, -22, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-14 items-center">
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
              <span className="block text-4xl font-black font-display leading-none bg-gradient-to-r from-brand-cyan-dark via-brand-cyan to-brand-navy bg-clip-text text-transparent animate-gradient-text">
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
            مرتبات وحضور وتأمينات — مظبوطة بقانون العمل المصري.
            <br />
            <span className="text-brand-cyan-dark">وكمان CRM وتسويق و AI</span> — كله في نظام واحد.
          </motion.h1>

          <motion.p
            variants={item}
            className="text-lg text-slate-600 mb-8 leading-relaxed max-w-xl mx-auto lg:mx-0 font-cairo"
          >
            من الحضور بالبصمة والـ GPS لحد قسائم الرواتب — التأمينات والضرايب والأوفر تايم محسوبة صح
            وأوتوماتيك، متوافقة مع قانون العمل 12/2003 والتأمينات 148/2019.
          </motion.p>

          <motion.div
            variants={item}
            className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start items-stretch sm:items-center"
          >
            <Link
              href="/signup"
              className="group relative w-full sm:w-auto overflow-hidden px-8 py-4 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-cyan-dark text-white font-bold text-lg shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:-translate-y-0.5 transition-all font-cairo"
            >
              <span className="relative z-10">جرّب مجانًا 14 يوم</span>
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-white/30 blur-md transition-transform duration-700 ease-out group-hover:translate-x-[300%]"
              />
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

        {/* ── Friendly mascot + live chat demo ── */}
        <motion.div variants={previewVariant} initial={initial} animate="visible" className="relative mt-6 lg:mt-0">
          {/* Mascot peeking above the chat card */}
          <motion.div
            animate={reduce ? undefined : { y: [0, -10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-16 left-1/2 z-20 w-28 -translate-x-1/2 drop-shadow-xl sm:-top-20 sm:w-32 lg:-left-6 lg:translate-x-0"
          >
            <NidhamBot className="w-full" />
          </motion.div>

          {/* Chat card */}
          <motion.div
            animate={reduce ? undefined : { y: [0, -8, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            className="relative mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-4 pt-8 shadow-2xl ring-1 ring-cyan-500/10"
          >
            {/* Card header */}
            <div className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-cyan to-brand-navy text-lg font-black text-white font-display">
                ن
              </span>
              <div className="flex-1">
                <div className="text-sm font-black text-slate-800 font-cairo">مساعد نِظام — الموارد البشرية</div>
                <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-cairo">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> متصل · بيرد على واتساب
                </div>
              </div>
              <span className="text-lg" aria-hidden>💬</span>
            </div>

            {/* Bubbles */}
            <motion.div variants={chatList} initial={initial} animate="visible" className="space-y-2.5">
              {CHAT.map((m, i) =>
                m.who === "user" ? (
                  <motion.div key={i} variants={bubble} className="flex justify-end">
                    <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-cyan-50 px-3.5 py-2 text-sm text-slate-700 font-cairo">
                      {m.text}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key={i} variants={bubble} className="flex justify-start">
                    <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-slate-900 px-3.5 py-2 text-sm text-white font-cairo leading-relaxed">
                      {m.text}
                    </div>
                  </motion.div>
                ),
              )}
              {/* typing shimmer */}
              {!reduce && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 1, 0] }}
                  transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 1.5, delay: 3.2 }}
                  className="flex justify-start"
                >
                  <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-slate-100 px-3 py-2.5">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Floating live-status pills */}
            <motion.div
              animate={reduce ? undefined : { y: [0, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-4 -right-3 flex items-center gap-1.5 rounded-xl border border-emerald-100 bg-white px-3 py-2 text-xs font-bold font-cairo text-emerald-700 shadow-lg"
            >
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              ٤٧ موظف حاضر دلوقتي
            </motion.div>
            <motion.div
              animate={reduce ? undefined : { y: [0, 8, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute -bottom-4 -left-3 flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold font-cairo text-cyan-300 shadow-lg"
            >
              🛡️ متوافق مع القانون ١٠٠٪
            </motion.div>
          </motion.div>

          <p className="mt-8 text-center text-[11px] font-cairo text-slate-500">
            بوت واتساب الموارد البشرية — بيرد على الموظفين تلقائيًا
          </p>
        </motion.div>
      </div>
    </section>
  );
}
