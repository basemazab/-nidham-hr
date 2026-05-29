"use client";

import AppLayout from "@/components/shared/AppLayout";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { fetchEmployeeStats } from "@/lib/hrms-api";
import Link from "next/link";

export default function DashboardPage() {
  const { user } = useAuth();
  const [usage, setUsage] = useState<Record<string, any>[]>([]);
  const [subscription, setSubscription] = useState<Record<string, any> | null>(null);
  const [empStats, setEmpStats] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    api.subscriptions.getUsage().then(setUsage).catch(() => {});
    api.subscriptions.getMySubscription().then(setSubscription).catch(() => {});
    fetchEmployeeStats().then(setEmpStats).catch(() => {});
  }, []);

  const planNames: Record<string, string> = {
    free: "مجاني",
    pro: "احترافي",
    business: "أعمال",
    lifetime: "مدى الحياة",
  };

  return (
    <AppLayout>
      <div className="max-w-6xl">
        <h1 className="text-3xl font-bold text-primary font-heading mb-2">مرحباً، {user?.full_name}</h1>
        <p className="text-gray-500 mb-8">لوحة التحكم الخاصة بك</p>

        {/* Employee Quick Stats */}
        {empStats && (
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">إجمالي الموظفين</p>
                  <p className="text-3xl font-bold text-primary">{empStats.total_employees}</p>
                </div>
                <div className="text-4xl">👥</div>
              </div>
              <Link href="/employees" className="text-sm text-accent hover:underline mt-2 inline-block">
                عرض الكل ←
              </Link>
            </div>
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">نشط</p>
                  <p className="text-3xl font-bold text-emerald-600">{empStats.active_employees}</p>
                </div>
                <div className="text-4xl">✅</div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">إجازة طويلة</p>
                  <p className="text-3xl font-bold text-amber-600">{empStats.on_leave}</p>
                </div>
                <div className="text-4xl">🏖️</div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">إجمالي الرواتب</p>
                  <p className="text-xl font-bold text-primary">
                    {Number(empStats.total_payroll || 0).toLocaleString("ar-EG")}
                  </p>
                </div>
                <div className="text-4xl">💰</div>
              </div>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="card text-center">
            <div className="text-3xl mb-2">💬</div>
            <div className="text-2xl font-bold text-primary">
              {usage.find((u: any) => u.feature === "chat")?.count || 0}
            </div>
            <p className="text-sm text-gray-500">أسئلة هذا الشهر</p>
          </div>
          <div className="card text-center">
            <div className="text-3xl mb-2">📄</div>
            <div className="text-2xl font-bold text-primary">
              {usage.find((u: any) => u.feature === "template")?.count || 0}
            </div>
            <p className="text-sm text-gray-500">نماذج محملة</p>
          </div>
          <div className="card text-center">
            <div className="text-3xl mb-2">💎</div>
            <div className="text-lg font-bold text-accent">
              {planNames[subscription?.plan] || "مجاني"}
            </div>
            <p className="text-sm text-gray-500">الاشتراك الحالي</p>
          </div>
          <div className="card text-center">
            <div className="text-3xl mb-2">📅</div>
            <div className="text-lg font-bold text-primary">
              {subscription?.expires_at
                ? new Date(subscription.expires_at).toLocaleDateString("ar-EG")
                : "غير محدود"}
            </div>
            <p className="text-sm text-gray-500">تاريخ الانتهاء</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="text-xl font-bold text-primary mb-4">⚡ وصول سريع</h2>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/chat" className="bg-primary text-white p-4 rounded-lg text-center hover:bg-primary-light transition">
                <div className="text-2xl mb-2">💬</div>
                <div>ابدأ محادثة</div>
              </Link>
              <Link href="/calculators" className="bg-accent text-primary p-4 rounded-lg text-center hover:bg-accent-light transition">
                <div className="text-2xl mb-2">🧮</div>
                <div>الحاسبات</div>
              </Link>
              <Link href="/employees" className="bg-[#0D1B2A] text-white p-4 rounded-lg text-center hover:bg-[#1a2d42] transition">
                <div className="text-2xl mb-2">👥</div>
                <div>الموظفون</div>
              </Link>
              <Link href="/templates" className="bg-gray-600 text-white p-4 rounded-lg text-center hover:bg-gray-700 transition">
                <div className="text-2xl mb-2">📄</div>
                <div>النماذج</div>
              </Link>
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-bold text-primary mb-4">📊 استخدامك</h2>
            {usage.length > 0 ? (
              <div className="space-y-4">
                {usage.map((u: any) => (
                  <div key={u.feature}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600">
                        {u.feature === "chat" ? "أسئلة" : "نماذج"}
                      </span>
                      <span className="text-sm font-bold">
                        {u.remaining === -1 ? "غير محدود" : `${u.remaining} متبقي`}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-accent h-2 rounded-full"
                        style={{
                          width: u.limit === -1 ? "100%" : `${(u.count / u.limit) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">لا يوجد استخدام هذا الشهر</p>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
