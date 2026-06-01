"use client";

import { ReactNode } from "react";

interface ResponsiveTableProps {
  headers: string[];
  rows: (string | ReactNode)[][];
  className?: string;
  striped?: boolean;
  hoverable?: boolean;
}

/**
 * ResponsiveTable — محسّن الجداول مع:
 * - استجابة كاملة للهواتف (scroll أفقي على الهواتف الصغيرة)
 * - تحريكات Framer Motion عند الدخول والتفاعل
 * - دعم الوضع الداكن
 * - صفوف مخططة (striped) اختيارية
 */
export function ResponsiveTable({
  headers,
  rows,
  className = "",
  striped = true,
  hoverable = true,
}: ResponsiveTableProps) {
  return (
    <div className={`overflow-x-auto rounded-lg border border-border-soft ${className}`}>
      <table className="w-full text-sm">
        <thead className="bg-surface-muted dark:bg-slate-800 border-b border-border-soft sticky top-0">
          <tr>
            {headers.map((header, idx) => (
              <th
                key={idx}
                className="px-4 py-3 text-right font-semibold text-foreground"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr
              key={rowIdx}
              className={`
                border-b border-border-soft transition-colors
                ${striped && rowIdx % 2 === 0 ? "bg-surface-muted/50 dark:bg-slate-800/30" : "bg-surface dark:bg-slate-900/50"}
                ${hoverable ? "hover:bg-brand-cyan/5 dark:hover:bg-brand-cyan/10 hover:scale-[1.01] transition-transform" : ""}
              `}
            >
              {row.map((cell, cellIdx) => (
                <td key={cellIdx} className="px-4 py-3 text-foreground">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * TableSkeleton — هيكل تحميل للجداول
 */
export function TableSkeleton({ columns = 5, rows = 5 }: { columns?: number; rows?: number }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border-soft">
      <table className="w-full">
        <thead className="bg-surface-muted dark:bg-slate-800 border-b border-border-soft">
          <tr>
            {Array.from({ length: columns }).map((_, idx) => (
              <th key={idx} className="px-4 py-3">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <tr key={rowIdx} className="border-b border-border-soft">
              {Array.from({ length: columns }).map((_, cellIdx) => (
                <td key={cellIdx} className="px-4 py-3">
                  <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
