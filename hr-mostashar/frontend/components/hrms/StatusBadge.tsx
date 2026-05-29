import { EmployeeStatus, EMPLOYEE_STATUS_LABELS, EMPLOYEE_STATUS_COLORS } from "@/lib/hrms-types";

interface Props {
  status: EmployeeStatus;
}

export function StatusBadge({ status }: Props) {
  const colorClass = EMPLOYEE_STATUS_COLORS[status] || "bg-gray-100 text-gray-800";
  const label = EMPLOYEE_STATUS_LABELS[status] || status;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
        status === "active" ? "bg-emerald-500" :
        status === "long_leave" ? "bg-amber-500" :
        status === "suspended" ? "bg-red-500" :
        "bg-gray-500"
      }`} />
      {label}
    </span>
  );
}
