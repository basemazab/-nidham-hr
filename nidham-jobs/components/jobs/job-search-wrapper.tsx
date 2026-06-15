import { Suspense } from "react";
import { JobSearch } from "./job-search";

export function JobSearchWrapper() {
  return (
    <Suspense fallback={<div className="h-20 rounded-2xl bg-gray-100 animate-pulse" />}>
      <JobSearch />
    </Suspense>
  );
}
