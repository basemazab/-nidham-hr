"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { ApplicationFormBuilder, type Question } from "@/components/jobs/application-form-builder";

type Props = {
  initialQuestions: Question[];
  initialShowSalary: boolean;
};

export function EditJobFormClient({ initialQuestions, initialShowSalary }: Props) {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    const titleInput = document.getElementById("title") as HTMLInputElement;
    const deptInput = document.getElementById("department") as HTMLInputElement;
    const expInput = document.getElementById("experience_years_min") as HTMLInputElement;
    const typeSelect = document.getElementById("job_type") as HTMLSelectElement;
    const locInput = document.getElementById("location") as HTMLInputElement;

    const titleVal = titleInput?.value?.trim();
    if (!titleVal || titleVal.length < 2) {
      titleInput?.focus();
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch("/api/jobs/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: titleVal,
          department: deptInput?.value || undefined,
          experience_years_min: expInput?.value ? Number(expInput.value) : undefined,
          job_type: typeSelect?.value || undefined,
          location: locInput?.value || undefined,
        }),
      });

      const data = await res.json();
      if (data.ok && data.questions) {
        setQuestions(data.questions);
        const descField = document.getElementById("description") as HTMLTextAreaElement;
        const reqField = document.getElementById("requirements") as HTMLTextAreaElement;
        const respField = document.getElementById("responsibilities") as HTMLTextAreaElement;
        if (descField && data.description) descField.value = data.description;
        if (reqField && data.requirements) reqField.value = data.requirements;
        if (respField && data.responsibilities) respField.value = data.responsibilities;
      }
    } catch { /* silent */ }
    setGenerating(false);
  };

  return (
    <>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 text-white text-sm font-bold shadow-md hover:shadow-lg transition-all font-cairo disabled:opacity-50"
        >
          {generating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {generating ? "جاري التوليد..." : "توليد بالذكاء الاصطناعي ✦"}
        </button>
      </div>

      <ApplicationFormBuilder questions={questions} onChange={setQuestions} />
      <input type="hidden" name="application_form" value={JSON.stringify(questions)} />

      <label className="flex items-center gap-2 cursor-pointer mt-3">
        <input
          type="checkbox"
          name="show_salary"
          defaultChecked={initialShowSalary}
          className="w-4 h-4 rounded border-slate-300 text-brand-cyan focus:ring-brand-cyan"
        />
        <span className="text-sm text-slate-700 font-cairo">
          عرض المرتب في الإعلان العام
        </span>
      </label>
    </>
  );
}
