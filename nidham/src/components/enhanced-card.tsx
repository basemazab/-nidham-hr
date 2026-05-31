"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface EnhancedCardProps {
  children: ReactNode;
  className?: string;
  hoverable?: boolean;
  clickable?: boolean;
  onClick?: () => void;
  delay?: number;
  icon?: ReactNode;
  title?: string;
  description?: string;
}

/**
 * EnhancedCard — بطاقة محسّنة مع تحريكات وتأثيرات
 * - تأثير hover سلس
 * - ظل ديناميكي
 * - دعم الوضع الداكن
 * - تحريك الدخول
 */
export function EnhancedCard({
  children,
  className = "",
  hoverable = true,
  clickable = false,
  onClick,
  delay = 0,
  icon,
  title,
  description,
}: EnhancedCardProps) {
  return (
    <motion.div
      className={`
        rounded-xl border border-border-soft bg-surface dark:bg-slate-900
        transition-all duration-300
        ${hoverable ? "cursor-pointer" : ""}
        ${clickable ? "cursor-pointer" : ""}
        ${className}
      `}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut", delay }}
      whileHover={
        hoverable || clickable
          ? {
              y: -4,
              boxShadow: "0 20px 40px rgba(34, 211, 238, 0.1)",
            }
          : {}
      }
      onClick={onClick}
    >
      {icon && title ? (
        <div className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="text-2xl">{icon}</div>
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          </div>
          {description && <p className="text-sm text-foreground/70 mb-4">{description}</p>}
          {children}
        </div>
      ) : (
        children
      )}
    </motion.div>
  );
}

/**
 * CardGrid — شبكة من البطاقات مع تحريك متسلسل
 */
export function CardGrid({
  children,
  columns = 3,
  className = "",
}: {
  children: ReactNode[];
  columns?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={`grid gap-6 ${
        columns === 1
          ? "grid-cols-1"
          : columns === 2
            ? "grid-cols-1 md:grid-cols-2"
            : columns === 3
              ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
              : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
      } ${className}`}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2,
          },
        },
      }}
    >
      {children.map((child, idx) => (
        <motion.div
          key={idx}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: {
              opacity: 1,
              y: 0,
              transition: { duration: 0.4 },
            },
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

/**
 * StatCard — بطاقة إحصائية محسّنة
 */
export function StatCard({
  label,
  value,
  icon,
  trend,
  trendDirection = "up",
  className = "",
  delay = 0,
}: {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: string | number;
  trendDirection?: "up" | "down" | "neutral";
  className?: string;
  delay?: number;
}) {
  const trendColor =
    trendDirection === "up"
      ? "text-green-600 dark:text-green-400"
      : trendDirection === "down"
        ? "text-red-600 dark:text-red-400"
        : "text-slate-600 dark:text-slate-400";

  return (
    <EnhancedCard
      className={`p-6 ${className}`}
      hoverable={false}
      delay={delay}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground/70 mb-2">{label}</p>
          <p className="text-3xl font-bold text-foreground mb-2">{value}</p>
          {trend && (
            <p className={`text-xs font-semibold ${trendColor}`}>
              {trendDirection === "up" ? "↑" : trendDirection === "down" ? "↓" : "→"} {trend}
            </p>
          )}
        </div>
        {icon && <div className="text-3xl opacity-50">{icon}</div>}
      </div>
    </EnhancedCard>
  );
}
