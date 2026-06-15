"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const JOB_TYPES = [
  { value: "FULL_TIME", label: "دوام كامل" },
  { value: "PART_TIME", label: "دوام جزئي" },
  { value: "CONTRACT", label: "عقد" },
  { value: "FREELANCE", label: "حر" },
  { value: "INTERNSHIP", label: "تدريب" },
];

const JOB_LEVELS = [
  { value: "ENTRY", label: "مبتدئ" },
  { value: "MID", label: "متوسط" },
  { value: "SENIOR", label: "خبير" },
  { value: "LEAD", label: "قائد" },
  { value: "MANAGER", label: "مدير" },
  { value: "EXECUTIVE", label: "تنفيذي" },
];

const CITIES = [
  "القاهرة", "الإسكندرية", "الجيزة", "المنصورة",
  "طنطا", "الشرقية", "أسوان", "الأقصر", "بورسعيد", "السويس",
];

export function JobFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedTypes, setSelectedTypes] = useState<string[]>(
    searchParams.get("type")?.split(",").filter(Boolean) || []
  );
  const [selectedLevels, setSelectedLevels] = useState<string[]>(
    searchParams.get("level")?.split(",").filter(Boolean) || []
  );
  const [selectedCity, setSelectedCity] = useState(searchParams.get("location") || "");
  const [isRemote, setIsRemote] = useState(searchParams.get("isRemote") === "true");
  const [salaryMin, setSalaryMin] = useState(searchParams.get("salaryMin") || "");
  const [salaryMax, setSalaryMax] = useState(searchParams.get("salaryMax") || "");

  const toggleArray = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (selectedTypes.length) params.set("type", selectedTypes.join(","));
    if (selectedLevels.length) params.set("level", selectedLevels.join(","));
    if (selectedCity) params.set("location", selectedCity);
    if (isRemote) params.set("isRemote", "true");
    if (salaryMin) params.set("salaryMin", salaryMin);
    if (salaryMax) params.set("salaryMax", salaryMax);

    router.push(`/jobs?${params.toString()}`);
  };

  const resetFilters = () => {
    setSelectedTypes([]);
    setSelectedLevels([]);
    setSelectedCity("");
    setIsRemote(false);
    setSalaryMin("");
    setSalaryMax("");
    router.push("/jobs");
  };

  const hasFilters = selectedTypes.length || selectedLevels.length || selectedCity || isRemote || salaryMin || salaryMax;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5 text-gray-700" />
          <span className="font-semibold text-gray-900">الفلاتر</span>
        </div>
        {hasFilters && (
          <button onClick={resetFilters} className="flex items-center gap-1 text-sm text-gray-500 hover:text-danger transition-colors">
            <RotateCcw className="h-3 w-3" />
            إعادة ضبط
          </button>
        )}
      </div>

      {/* Job Type */}
      <div>
        <h4 className="mb-3 text-sm font-medium text-gray-700">نوع الوظيفة</h4>
        <div className="space-y-2">
          {JOB_TYPES.map(({ value, label }) => (
            <label key={value} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedTypes.includes(value)}
                onChange={() => setSelectedTypes(toggleArray(selectedTypes, value))}
                className="h-4 w-4 rounded border-gray-300 text-primary-800 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-600">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Job Level */}
      <div>
        <h4 className="mb-3 text-sm font-medium text-gray-700">المستوى الوظيفي</h4>
        <div className="space-y-2">
          {JOB_LEVELS.map(({ value, label }) => (
            <label key={value} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedLevels.includes(value)}
                onChange={() => setSelectedLevels(toggleArray(selectedLevels, value))}
                className="h-4 w-4 rounded border-gray-300 text-primary-800 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-600">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Location */}
      <div>
        <h4 className="mb-3 text-sm font-medium text-gray-700">المدينة</h4>
        <div className="grid grid-cols-2 gap-2">
          {CITIES.map((city) => (
            <button
              key={city}
              onClick={() => setSelectedCity(selectedCity === city ? "" : city)}
              className={cn(
                "rounded-lg px-3 py-2 text-xs font-medium transition-all",
                selectedCity === city
                  ? "bg-primary-800 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      {/* Remote toggle */}
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={isRemote}
          onChange={(e) => setIsRemote(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-primary-800 focus:ring-primary-500"
        />
        <span className="text-sm text-gray-700">عن بُعد فقط</span>
      </label>

      {/* Salary Range */}
      <div>
        <h4 className="mb-3 text-sm font-medium text-gray-700">الراتب المتوقع</h4>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="من"
            value={salaryMin}
            onChange={(e) => setSalaryMin(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-primary-500"
          />
          <input
            type="number"
            placeholder="إلى"
            value={salaryMax}
            onChange={(e) => setSalaryMax(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-primary-500"
          />
        </div>
      </div>

      <Button onClick={applyFilters} className="w-full">
        تطبيق الفلاتر
      </Button>
    </div>
  );
}
