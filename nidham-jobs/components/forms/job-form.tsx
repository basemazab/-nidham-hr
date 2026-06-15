"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { jobSchema, type JobInput } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

const JOB_TYPE_OPTIONS = [
  { value: "FULL_TIME", label: "دوام كامل" },
  { value: "PART_TIME", label: "دوام جزئي" },
  { value: "CONTRACT", label: "عقد" },
  { value: "FREELANCE", label: "حر" },
  { value: "INTERNSHIP", label: "تدريب" },
];

const JOB_LEVEL_OPTIONS = [
  { value: "ENTRY", label: "مبتدئ" },
  { value: "MID", label: "متوسط" },
  { value: "SENIOR", label: "خبير" },
  { value: "LEAD", label: "قائد فريق" },
  { value: "MANAGER", label: "مدير" },
  { value: "DIRECTOR", label: "مدير عام" },
  { value: "EXECUTIVE", label: "تنفيذي" },
];

interface JobFormProps {
  initialData?: JobInput;
  onSubmit: (data: JobInput) => Promise<void>;
}

export function JobForm({ initialData, onSubmit }: JobFormProps) {
  const [skillsInput, setSkillsInput] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<JobInput>({
    resolver: zodResolver(jobSchema),
    defaultValues: initialData || {
      type: "FULL_TIME",
      level: "MID",
      salaryCurrency: "EGP",
      isRemote: false,
      isSalaryVisible: false,
      skills: [],
    },
  });

  const skills = watch("skills") || [];
  const addSkill = () => {
    const s = skillsInput.trim();
    if (s && !skills.includes(s)) {
      setValue("skills", [...skills, s]);
      setSkillsInput("");
    }
  };

  const removeSkill = (skill: string) => {
    setValue("skills", skills.filter((s) => s !== skill));
  };

  const submit = async (data: JobInput) => {
    setLoading(true);
    await onSubmit(data);
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label="عنوان الوظيفة"
          placeholder="مثال: مهندس برمجيات أول"
          error={errors.title?.message}
          {...register("title")}
        />
        <Select
          label="نوع الوظيفة"
          options={JOB_TYPE_OPTIONS}
          error={errors.type?.message}
          {...register("type")}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Select
          label="المستوى الوظيفي"
          options={JOB_LEVEL_OPTIONS}
          error={errors.level?.message}
          {...register("level")}
        />
        <Input
          label="التصنيف"
          placeholder="مثال: تكنولوجيا المعلومات"
          error={errors.category?.message}
          {...register("category")}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          الوصف الوظيفي
        </label>
        <textarea
          rows={5}
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-right outline-none transition-all focus:border-primary-500 focus:bg-white"
          placeholder="صف المسؤوليات والمهام..."
          {...register("description")}
        />
        {errors.description && (
          <p className="mt-1 text-sm text-danger">{errors.description.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          المتطلبات
        </label>
        <textarea
          rows={4}
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-right outline-none transition-all focus:border-primary-500 focus:bg-white"
          placeholder="المؤهلات والخبرات المطلوبة..."
          {...register("requirements")}
        />
        {errors.requirements && (
          <p className="mt-1 text-sm text-danger">{errors.requirements.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          المميزات (اختياري)
        </label>
        <textarea
          rows={3}
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-right outline-none transition-all focus:border-primary-500 focus:bg-white"
          placeholder="ما تقدمه الشركة..."
          {...register("benefits")}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Input
          label="الموقع"
          placeholder="القاهرة"
          error={errors.location?.message}
          {...register("location")}
        />
        <Input
          label="الراتب الأدنى"
          type="number"
          placeholder="مثال: 5000"
          error={errors.salaryMin?.message}
          {...register("salaryMin", { valueAsNumber: true })}
        />
        <Input
          label="الراتب الأعلى"
          type="number"
          placeholder="مثال: 15000"
          error={errors.salaryMax?.message}
          {...register("salaryMax", { valueAsNumber: true })}
        />
      </div>

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" {...register("isRemote")} className="h-4 w-4 rounded border-gray-300" />
          <span className="text-sm text-gray-700">عن بُعد</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" {...register("isSalaryVisible")} className="h-4 w-4 rounded border-gray-300" />
          <span className="text-sm text-gray-700">إظهار الراتب</span>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          المهارات المطلوبة
        </label>
        <div className="flex gap-2 mb-2">
          <input
            value={skillsInput}
            onChange={(e) => setSkillsInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
            placeholder="اكتب مهارة ثم Enter..."
            className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm outline-none transition-all focus:border-primary-500"
          />
          <Button type="button" variant="secondary" onClick={addSkill}>
            إضافة
          </Button>
        </div>
        {errors.skills && <p className="text-sm text-danger">{errors.skills.message}</p>}
        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-800"
            >
              {skill}
              <button type="button" onClick={() => removeSkill(skill)} className="hover:text-danger">&times;</button>
            </span>
          ))}
        </div>
      </div>

      <Button type="submit" isLoading={loading} className="w-full lg:w-auto">
        {initialData ? "تحديث الوظيفة" : "نشر الوظيفة"}
      </Button>
    </form>
  );
}
