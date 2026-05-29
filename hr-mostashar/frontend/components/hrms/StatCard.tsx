interface Props {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: number; label: string; positive?: boolean };
  color?: string;
}

export function StatCard({ title, value, icon, trend, color = "bg-[#C9A84C]" }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-[#0D1B2A]">{value}</p>
          {trend && (
            <p className={`text-xs mt-1 ${trend.positive !== false ? "text-emerald-600" : "text-red-600"}`}>
              {trend.positive !== false ? "↑" : "↓"} {trend.value}% {trend.label}
            </p>
          )}
        </div>
        <div className={`${color} p-3 rounded-lg`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
