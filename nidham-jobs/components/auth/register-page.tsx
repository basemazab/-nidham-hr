"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "candidate";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      router.push("/login");
    }, 1000);
  };

  return (
    <div className="rounded-2xl bg-white p-8 shadow-xl">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900">إنشاء حساب جديد</h1>
        <p className="mt-2 text-gray-600">
          {type === "company" ? "للشركات" : "للباحثين عن عمل"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {type === "company" ? "اسم الشركة" : "الاسم الكامل"}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-right outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
            placeholder={type === "company" ? "اسم الشركة" : "محمد أحمد"}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            البريد الإلكتروني
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-right outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
            placeholder="name@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            كلمة المرور
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-right outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
            placeholder="٨ أحرف على الأقل"
          />
        </div>

        <Button type="submit" isLoading={loading} className="w-full">
          إنشاء الحساب
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        لديك حساب بالفعل؟{" "}
        <Link href="/login" className="font-semibold text-primary-800 hover:text-primary-900">
          تسجيل الدخول
        </Link>
      </p>
    </div>
  );
}
