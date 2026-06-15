"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema, type ProfileInput } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ProfileFormProps {
  initialData?: Partial<ProfileInput>;
  onSubmit: (data: ProfileInput) => Promise<void>;
}

export function ProfileForm({ initialData, onSubmit }: ProfileFormProps) {
  const [loading, setLoading] = useState(false);
  const [skillsInput, setSkillsInput] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: initialData || { skills: [] },
  });

  const skills = watch("skills") || [];
  const addSkill = () => {
    const s = skillsInput.trim();
    if (s && !skills.includes(s)) {
      setValue("skills", [...skills, s]);
      setSkillsInput("");
    }
  };

  const submit = async (data: ProfileInput) => {
    setLoading(true);
    await onSubmit(data);
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Input label="الاسم الكامل" error={errors.name?.message} {...register("name")} />
        <Input label="رقم الهاتف" type="tel" {...register("phone")} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Input label="المسمى الوظيفي" placeholder="مثال: مهندس برمجيات" {...register("title")} />
        <Input label="الموقع" placeholder="القاهرة" {...register("location")} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">نبذة عني</label>
        <textarea
          rows={4}
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-right outline-none transition-all focus:border-primary-500 focus:bg-white"
          placeholder="اكتب ملخصاً عن خبراتك..."
          {...register("summary")}
        />
      </div>

      <Input
        label="الراتب المتوقع"
        type="number"
        placeholder="مثال: 10000"
        {...register("salaryExpectation", { valueAsNumber: true })}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">المهارات</label>
        <div className="flex gap-2 mb-2">
          <input
            value={skillsInput}
            onChange={(e) => setSkillsInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
            placeholder="اكتب مهارة..."
            className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm outline-none focus:border-primary-500"
          />
          <Button type="button" variant="secondary" onClick={addSkill}>إضافة</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {skills.map((s) => (
            <span key={s} className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-800">
              {s}
              <button type="button" onClick={() => setValue("skills", skills.filter((x) => x !== s))}>&times;</button>
            </span>
          ))}
        </div>
      </div>

      <Button type="submit" isLoading={loading} className="w-full lg:w-auto">
        حفظ التغييرات
      </Button>
    </form>
  );
}
