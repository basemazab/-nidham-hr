"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
import { formatEGP } from "@/lib/payroll";

interface MonthlyRow {
  id: string;
  year: number;
  month: number;
  status: string;
  payroll_entries: {
    gross_salary: number;
    net_salary: number;
    total_deductions: number;
    social_insurance: number;
    income_tax: number;
    bonuses: number;
  }[];
}

interface DeptRow {
  net_salary: number;
  gross_salary: number;
  employees: {
    department: string;
    status: string;
  }[];
}

interface RecentPeriod {
  id: string;
  year: number;
  month: number;
  status: string;
  start_date: string;
  end_date: string;
  working_days: number;
}

interface Props {
  monthlyData: MonthlyRow[];
  deptData: DeptRow[];
  empCount: number;
  recentPeriods: RecentPeriod[];
}

const MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

const STATUS_MAP: Record<string, { label: string; classes: string }> = {
  paid: {
    label: "تم الصرف",
    classes: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  },
  approved: {
    label: "معتمد",
    classes: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  },
  draft: {
    label: "مسودة",
    classes: "bg-slate-50 text-slate-600 ring-1 ring-slate-200",
  },
  cancelled: {
    label: "ملغي",
    classes: "bg-red-50 text-red-600 ring-1 ring-red-200",
  },
};

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number; color?: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur-sm rtl:text-right">
      <p className="mb-2 text-xs font-semibold text-slate-600">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ background: p.color }}
          />
          <span className="text-slate-500">{p.name}:</span>
          <span className="font-bold text-slate-800">
            {formatEGP(p.value ?? 0)}
          </span>
        </div>
      ))}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  gradient,
  icon,
  trend,
}: {
  label: string;
  value: string;
  sub?: string;
  gradient: string;
  icon: string;
  trend?: { dir: "up" | "down"; pct: string };
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl p-5 text-white shadow-2xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl ${gradient}`}
    >
      <div className="absolute -left-6 -top-6 h-24 w-24 rounded-full bg-white/5 blur-xl" />
      <div className="absolute -bottom-4 -right-4 h-16 w-16 rounded-full bg-white/5 blur-lg" />
      <div className="relative flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-white/80">{label}</p>
          <p className="text-3xl font-black tracking-tight">{value}</p>
          {sub && <p className="text-xs text-white/60">{sub}</p>}
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-3xl drop-shadow-lg">{icon}</span>
          {trend && (
            <span
              className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                trend.dir === "up"
                  ? "bg-emerald-400/20 text-emerald-200"
                  : "bg-red-400/20 text-red-200"
              }`}
            >
              {trend.dir === "up" ? "↑" : "↓"} {trend.pct}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function PayrollAnalyticsClient({
  monthlyData,
  deptData,
  empCount,
  recentPeriods,
}: Props) {
  const monthlyChart = monthlyData.map((p) => {
    const gross = p.payroll_entries.reduce((s, e) => s + Number(e.gross_salary || 0), 0);
    const net = p.payroll_entries.reduce((s, e) => s + Number(e.net_salary || 0), 0);
    const deductions = p.payroll_entries.reduce(
      (s, e) => s + Number(e.total_deductions || 0),
      0,
    );
    const tax = p.payroll_entries.reduce((s, e) => s + Number(e.income_tax || 0), 0);
    const ins = p.payroll_entries.reduce((s, e) => s + Number(e.social_insurance || 0), 0);
    const bonuses = p.payroll_entries.reduce((s, e) => s + Number(e.bonuses || 0), 0);
    return {
      name: `${MONTHS[p.month - 1] || p.month} ${p.year}`,
      gross: Math.round(gross),
      net: Math.round(net),
      deductions: Math.round(deductions),
      tax: Math.round(tax),
      insurance: Math.round(ins),
      bonuses: Math.round(bonuses),
    };
  });

  const deptMap = new Map<string, { gross: number; net: number; count: number }>();
  for (const row of deptData) {
    const emp = Array.isArray(row.employees) ? row.employees[0] : row.employees;
    const dept = emp?.department || "بدون قسم";
    const cur = deptMap.get(dept) || { gross: 0, net: 0, count: 0 };
    cur.gross += Number(row.gross_salary || 0);
    cur.net += Number(row.net_salary || 0);
    cur.count++;
    deptMap.set(dept, cur);
  }
  const deptChart = Array.from(deptMap.entries())
    .map(([name, data]) => ({
      name,
      value: Math.round(data.gross),
      employees: data.count,
    }))
    .sort((a, b) => b.value - a.value);

  const totalGross = monthlyChart.reduce((s, m) => s + m.gross, 0);
  const totalNet = monthlyChart.reduce((s, m) => s + m.net, 0);
  const totalTax = monthlyChart.reduce((s, m) => s + m.tax, 0);
  const totalIns = monthlyChart.reduce((s, m) => s + m.insurance, 0);
  const totalBonuses = monthlyChart.reduce((s, m) => s + m.bonuses, 0);
  const totalDeductions = monthlyChart.reduce((s, m) => s + m.deductions, 0);

  const monthlyAvg = monthlyChart.length ? Math.round(totalGross / monthlyChart.length) : 0;
  const costPerEmp = empCount ? Math.round(monthlyAvg / empCount) : 0;

  const gradientOffset = () => {
    if (monthlyChart.length < 2) return 0;
    const max = Math.max(...monthlyChart.map((m) => m.net));
    const min = Math.min(...monthlyChart.map((m) => m.net));
    return max <= 0 ? 0 : max / (max - min);
  };

  const off = gradientOffset();

  return (
    <div className="space-y-6 p-4 md:p-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="inline-block rounded-full bg-gradient-to-r from-cyan-500/10 to-blue-500/10 px-3 py-1 text-[11px] font-bold text-cyan-700 ring-1 ring-cyan-200/50">
            تقارير مالية
          </div>
          <h1 className="mt-2 text-3xl font-black text-slate-800">
            تحليلات المرتبات
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            نظرة شاملة على تكاليف الرواتب والضرائب والتأمينات
          </p>
        </div>
        <div className="hidden items-center gap-2 rounded-xl bg-white px-4 py-2 shadow-sm ring-1 ring-slate-100 md:flex">
          <span className="text-sm text-slate-500">آخر ١٢ شهر</span>
          <span className="h-4 w-px bg-slate-200" />
          <span className="text-sm font-bold text-slate-700">
            {monthlyChart.length} فترة
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="إجمالي المرتبات"
          value={formatEGP(totalGross)}
          sub={`${empCount} موظف نشط`}
          gradient="bg-gradient-to-br from-cyan-600 via-cyan-500 to-cyan-400"
          icon="💰"
        />
        <StatCard
          label="صافي المرتبات"
          value={formatEGP(totalNet)}
          sub={`معدل ${formatEGP(monthlyAvg)}/شهر`}
          gradient="bg-gradient-to-br from-emerald-600 via-emerald-500 to-emerald-400"
          icon="✓"
        />
        <StatCard
          label="الضرائب والتأمينات"
          value={formatEGP(totalTax + totalIns)}
          sub={`ضريبة ${formatEGP(totalTax)} · تأمينات ${formatEGP(totalIns)}`}
          gradient="bg-gradient-to-br from-amber-600 via-amber-500 to-amber-400"
          icon="📊"
        />
        <StatCard
          label="تكلفة الموظف"
          value={`${formatEGP(costPerEmp)}/شهر`}
          sub={`الحوافز ${formatEGP(totalBonuses)}`}
          gradient="bg-gradient-to-br from-purple-600 via-purple-500 to-purple-400"
          icon="👤"
        />
      </div>

      {/* Secondary KPIs row */}
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-100">
          <p className="text-[11px] font-medium text-slate-400">إجمالي الخصومات</p>
          <p className="mt-0.5 text-lg font-bold text-slate-700">
            {formatEGP(totalDeductions)}
          </p>
        </div>
        <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-100">
          <p className="text-[11px] font-medium text-slate-400">متوسط صافي الراتب</p>
          <p className="mt-0.5 text-lg font-bold text-emerald-600">
            {empCount ? formatEGP(Math.round(totalNet / empCount)) : formatEGP(0)}
          </p>
        </div>
        <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-100">
          <p className="text-[11px] font-medium text-slate-400">إجمالي الحوافز</p>
          <p className="mt-0.5 text-lg font-bold text-amber-600">
            {formatEGP(totalBonuses)}
          </p>
        </div>
        <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-100">
          <p className="text-[11px] font-medium text-slate-400">نسبة الخصم</p>
          <p className="mt-0.5 text-lg font-bold text-rose-600">
            {totalGross
              ? `${((totalDeductions / totalGross) * 100).toFixed(1)}%`
              : "0%"}
          </p>
        </div>
      </div>

      {/* Charts grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Monthly trend — AreaChart (spans 2 cols) */}
        <div className="lg:col-span-2 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
          <div className="border-b border-slate-100 p-5">
            <h3 className="font-bold text-slate-800">اتجاه المرتبات الشهرية</h3>
            <p className="text-xs text-slate-400 mt-0.5">
          إجمالي vs صافي — آخر ١٢ شهر
            </p>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={340}>
              <AreaChart data={monthlyChart}>
                <defs>
                  <linearGradient id="splitGross" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0891b2" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#0891b2" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="splitNet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="gross"
                  name="إجمالي"
                  stroke="#0891b2"
                  strokeWidth={2.5}
                  fill="url(#splitGross)"
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
                <Area
                  type="monotone"
                  dataKey="net"
                  name="صافي"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fill="url(#splitNet)"
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Pie — 1 col */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
          <div className="border-b border-slate-100 p-5">
            <h3 className="font-bold text-slate-800">التوزيع حسب القسم</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              إجمالي المرتبات لكل قسم
            </p>
          </div>
          <div className="p-4">
            {deptChart.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={deptChart}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={100}
                      paddingAngle={3}
                      strokeWidth={0}
                    >
                      {deptChart.map((_, i) => (
                        <Cell
                          key={i}
                          fill={
                            [
                              "#0891b2",
                              "#0e7490",
                              "#0369a1",
                              "#059669",
                              "#65a30d",
                              "#d97706",
                              "#dc2626",
                              "#7c3aed",
                            ][i % 8]
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload as {
                          name?: string;
                          value?: number;
                          employees?: number;
                        };
                        return (
                          <div className="rounded-xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur-sm">
                            <p className="mb-1 text-xs font-bold text-slate-700">{d.name}</p>
                            <p className="text-xs text-slate-500">
                              {formatEGP(d.value ?? 0)} · {d.employees} موظف
                            </p>
                          </div>
                        );
                      }}
                    />
                    <Legend
                      formatter={(value: string) => (
                        <span className="text-xs text-slate-600">{value}</span>
                      )}
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: 11 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 space-y-1.5 px-1">
                  {deptChart.slice(0, 5).map((d, i) => (
                    <div key={d.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{
                            background: [
                              "#0891b2",
                              "#0e7490",
                              "#0369a1",
                              "#059669",
                              "#65a30d",
                            ][i % 5],
                          }}
                        />
                        <span className="text-slate-600">{d.name}</span>
                      </div>
                      <span className="font-semibold text-slate-800">
                        {formatEGP(d.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="py-12 text-center text-sm text-slate-400">
                لا توجد بيانات أقسام كافية
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom row: Tax/Insurance line + Breakdown bars */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Tax & Insurance */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
          <div className="border-b border-slate-100 p-5">
            <h3 className="font-bold text-slate-800">الضرائب والتأمينات</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              تحليل الخصومات الشهرية
            </p>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyChart} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="tax"
                  name="ضريبة"
                  fill="#d97706"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={20}
                />
                <Bar
                  dataKey="insurance"
                  name="تأمينات"
                  fill="#7c3aed"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Breakdown bars */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
          <div className="border-b border-slate-100 p-5">
            <h3 className="font-bold text-slate-800">تفصيل المرتب الشهري</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              متوسط تكوين الراتب لكل شهر
            </p>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={monthlyChart}
                layout="vertical"
                barGap={2}
                barCategoryGap="20%"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 9, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  width={65}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="bonuses"
                  name="حوافز"
                  stackId="a"
                  fill="#65a30d"
                  radius={[0, 4, 4, 0]}
                />
                <Bar
                  dataKey="net"
                  name="صافي"
                  stackId="a"
                  fill="#10b981"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="deductions"
                  name="خصومات"
                  stackId="a"
                  fill="#ef4444"
                  radius={[4, 0, 0, 4]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent periods */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <div>
            <h3 className="font-bold text-slate-800">آخر فترات المرتبات</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              سجل الفترات المالية السابقة
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500">
            {recentPeriods.length} فترة
          </span>
        </div>
        <div className="p-5">
          {recentPeriods.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-semibold text-slate-400">
                    <th className="pb-3 text-right font-cairo">الشهر</th>
                    <th className="pb-3 text-right font-cairo">من</th>
                    <th className="pb-3 text-right font-cairo">إلى</th>
                    <th className="pb-3 text-right font-cairo">أيام العمل</th>
                    <th className="pb-3 text-right font-cairo">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPeriods.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-slate-50 transition-colors hover:bg-slate-50/50"
                    >
                      <td className="py-3 font-semibold text-slate-800">
                        {MONTHS[p.month - 1] || p.month} {p.year}
                      </td>
                      <td className="py-3 text-slate-500">
                        {new Date(p.start_date).toLocaleDateString("ar-EG")}
                      </td>
                      <td className="py-3 text-slate-500">
                        {new Date(p.end_date).toLocaleDateString("ar-EG")}
                      </td>
                      <td className="py-3 font-semibold text-slate-700">
                        {p.working_days} يوم
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            STATUS_MAP[p.status]?.classes ??
                            "bg-slate-50 text-slate-600 ring-1 ring-slate-200"
                          }`}
                        >
                          {STATUS_MAP[p.status]?.label ?? p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-slate-400">
              لا توجد فترات مرتبات سابقة
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
