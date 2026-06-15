import Link from "next/link";
import { MapPin, Clock, Building2, Briefcase } from "lucide-react";
import { cn, formatDate, formatSalary } from "@/lib/utils";

interface JobCardProps {
  id: string;
  title: string;
  company: string;
  logo?: string | null;
  location: string;
  type: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  currency?: string;
  createdAt: Date;
  isFeatured?: boolean;
}

export function JobCard({
  id,
  title,
  company,
  logo,
  location,
  type,
  salaryMin,
  salaryMax,
  currency,
  createdAt,
  isFeatured,
}: JobCardProps) {
  return (
    <Link
      href={`/jobs/${id}`}
      className={cn(
        "group relative flex items-start gap-4 rounded-2xl border bg-white p-6 transition-all hover:shadow-lg hover:border-primary-200",
        isFeatured && "border-accent-200 bg-accent-50/30"
      )}
    >
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-800">
        {logo ? (
          <img src={logo} alt={company} className="h-10 w-10 rounded-lg object-cover" />
        ) : (
          <Building2 className="h-7 w-7" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-800 transition-colors">
            {title}
          </h3>
          <p className="mt-0.5 text-sm text-gray-600">{company}</p>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            {location}
          </span>
          <span className="flex items-center gap-1">
            <Briefcase className="h-4 w-4" />
            {type}
          </span>
          {(salaryMin || salaryMax) && (
            <span className="font-medium text-success">
              {formatSalary(salaryMin, salaryMax, currency)}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {formatDate(createdAt)}
          </span>
        </div>
      </div>
    </Link>
  );
}
