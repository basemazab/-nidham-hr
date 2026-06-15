"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { applicationSchema, type ApplicationInput } from "@/lib/validators";
import { Button } from "@/components/ui/button";

interface ApplicationFormProps {
  jobId: string;
  onSubmit: (data: ApplicationInput) => Promise<void>;
}

export function ApplicationForm({ jobId, onSubmit }: ApplicationFormProps) {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ApplicationInput>({
    resolver: zodResolver(applicationSchema),
    defaultValues: { jobId },
  });

  const submit = async (data: ApplicationInput) => {
    if (!file) return;
    setLoading(true);
    // In production: upload file to cloud storage first
    data.resumeUrl = URL.createObjectURL(file);
    await onSubmit(data);
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          السيرة الذاتية (PDF)
        </label>
        <input
          type="file"
          accept=".pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-primary-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-800"
        />
        {errors.resumeUrl && (
          <p className="mt-1 text-sm text-danger">{errors.resumeUrl.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          رسالة التقديم (اختياري)
        </label>
        <textarea
          rows={4}
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-right outline-none transition-all focus:border-primary-500 focus:bg-white"
          placeholder="اكتب رسالة تعريفية..."
          {...register("coverLetter")}
        />
      </div>

      <Button type="submit" isLoading={loading} className="w-full">
        تقديم الطلب
      </Button>
    </form>
  );
}
