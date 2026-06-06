"use client";

// ============================================================================
// Landing-page motion primitives — Reveal / CountUp / ScrollProgress
// ============================================================================
//
// Lightweight, reusable framer-motion helpers that make the marketing page
// feel alive without bloating each section:
//
//   <Reveal>            — fade + rise the moment it scrolls into view (once).
//   <CountUp value={…}/> — animates a number up from 0 when it appears.
//   <ScrollProgress />   — a thin gradient bar that fills as you scroll.
//
// All three respect prefers-reduced-motion: they render the final state
// instantly so motion-sensitive users get a clean, static page.

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  animate,
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useSpring,
  type Variants,
} from "framer-motion";

// ── Reveal: fade + rise on scroll-into-view ──
export function Reveal({
  children,
  delay = 0,
  y = 28,
  className,
  once = true,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  once?: boolean;
}) {
  const reduce = useReducedMotion();
  const variants: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : y },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1], delay },
    },
  };
  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-12% 0px -12% 0px" }}
    >
      {children}
    </motion.div>
  );
}

// ── CountUp: tween a number from 0 → value when it enters the viewport ──
export function CountUp({
  value,
  suffix = "",
  prefix = "",
  decimals = 0,
  duration = 1.7,
  className,
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px" });
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setDisplay(value);
      return;
    }
    const controls = animate(0, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [inView, value, duration, reduce]);

  const formatted = display.toLocaleString("en-US", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  });

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}

// ── ScrollProgress: top-of-page gradient bar tracking scroll depth ──
// transform-origin is right because the page is RTL — it should fill from
// the right edge toward the left as the reader scrolls down.
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });
  return (
    <motion.div
      aria-hidden
      style={{ scaleX, transformOrigin: "right" }}
      className="fixed inset-x-0 top-0 z-[60] h-1 bg-gradient-to-l from-brand-cyan via-brand-cyan-dark to-brand-gold"
    />
  );
}
