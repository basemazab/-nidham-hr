"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary to-primary-dark flex items-center justify-center px-4" dir="rtl">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-accent font-heading">مستشار HR</h1>
          <p className="text-gray-400 mt-2">سجل دخولك للمتابعة</p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-xl">
          <h2 className="text-xl font-bold text-primary mb-6 text-center">تسجيل الدخول</h2>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 text-center">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-primary mb-1">البريد الإلكتروني</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="example@email.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-primary mb-1">كلمة المرور</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                required
              />
            </div>
            <button type="submit" disabled={loading} className="btn-accent w-full disabled:opacity-50">
              {loading ? "جاري الدخول..." : "تسجيل الدخول"}
            </button>
          </form>

          <p className="text-center text-gray-500 mt-6 text-sm">
            ليس لديك حساب؟{" "}
            <Link href="/register" className="text-accent font-bold hover:underline">
              سجل الآن
            </Link>
          </p>
        </div>

        <p className="text-center text-gray-500 mt-4 text-sm">
          <Link href="/" className="hover:text-accent">← العودة للرئيسية</Link>
        </p>
      </div>
    </div>
  );
}
