"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, MapPin, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

const JOB_TYPES = [
  { value: "ALL", label: "الكل" },
  { value: "FULL_TIME", label: "دوام كامل" },
  { value: "PART_TIME", label: "دوام جزئي" },
  { value: "REMOTE", label: "عن بُعد" },
  { value: "CONTRACT", label: "عقد" },
  { value: "INTERNSHIP", label: "تدريب" },
];

const LOCATIONS = [
  "القاهرة",
  "الإسكندرية",
  "الجيزة",
  "المنصورة",
  "طنطا",
  "الشرقية",
  "عن بُعد",
];

export function JobSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [location, setLocation] = useState(searchParams.get("location") || "");
  const [type, setType] = useState(searchParams.get("type") || "ALL");
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (location) params.set("location", location);
    if (type !== "ALL") params.set("type", type);

    router.push(`/jobs?${params.toString()}`);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="rounded-2xl bg-white p-4 shadow-xl shadow-gray-200/50">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="ابحث عن وظيفة، شركة، أو مهارة..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pr-12 pl-4 text-right outline-none transition-all focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          <div className="relative md:w-48">
            <MapPin className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 py-3 pr-12 pl-4 text-right outline-none transition-all focus:border-primary-500 focus:bg-white"
            >
              <option value="">كل المدن</option>
              {LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          <Button
            onClick={handleSearch}
            className="md:w-32"
          >
            ابحث
          </Button>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary-800 transition-colors"
          >
            <SlidersHorizontal className="h-4 w-4" />
            فلاتر متقدمة
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            <div className="flex flex-wrap gap-2">
              {JOB_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setType(t.value)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    type === t.value
                      ? "bg-primary-800 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
