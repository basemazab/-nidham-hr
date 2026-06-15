import { cn } from "@/lib/utils";

interface StatsCardProps {
  label: string;
  value: string | number;
  change?: number;
  trend?: "up" | "down" | "neutral";
  icon?: React.ReactNode;
}

export function StatsCard({ label, value, change, trend, icon }: StatsCardProps) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change !== undefined && trend && (
            <p
              className={cn(
                "text-sm font-medium",
                trend === "up" && "text-success",
                trend === "down" && "text-danger"
              )}
            >
              {change > 0 ? "+" : ""}
              {change}%
            </p>
          )}
        </div>
        {icon && (
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-800">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
