"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/shared/AppLayout";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";

export default function AccountPage() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<any>(null);
  const [usage, setUsage] = useState<any[]>([]);
  const [plans, setPlans] = useState<Record<string, any>>({});
  const [subscribeLoading, setSubscribeLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    api.subscriptions.getMySubscription().then(setSubscription).catch(() => {});
    api.subscriptions.getUsage().then(setUsage).catch(() => {});
    api.subscriptions.getPlans().then(setPlans).catch(() => {});
  }, []);

  const handleSubscribe = async (plan: string) => {
    setSubscribeLoading(true);
    setMessage("");
    try {
      const res = await api.subscriptions.subscribe(plan, "manual");
      setMessage(res.message);
      setSubscription({ ...subscription, plan, status: "pending" });
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setSubscribeLoading(false);
    }
  };

  const planNames: Record<string, string> = { free: "مجاني", pro: "احترافي", business: "أعمال", lifetime: "مدى الحياة" };

  return (
    <AppLayout>
      <h1 className="text-3xl font-bold text-primary font-heading mb-6">⚙️ حسابي</h1>

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl">
        <div className="card">
          <h2 className="text-xl font-bold text-primary mb-4">بيانات الحساب</h2>
          <div className="space-y-3">
            <p><strong>الاسم:</strong> {user?.full_name}</p>
            <p><strong>البريد:</strong> {user?.email}</p>
            <p><strong>الاشتراك:</strong> {planNames[subscription?.plan] || "مجاني"}</p>
            {subscription?.expires_at && (
              <p><strong>ينتهي في:</strong> {new Date(subscription.expires_at).toLocaleDateString("ar-EG")}</p>
            )}
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold text-primary mb-4">الاستخدام</h2>
          {usage.length > 0 ? (
            <div className="space-y-3">
              {usage.map((u) => (
                <div key={u.feature}>
                  <div className="flex justify-between text-sm">
                    <span>{u.feature === "chat" ? "أسئلة" : "نماذج"}</span>
                    <span>{u.remaining === -1 ? "غير محدود" : `${u.count}/${u.limit}`}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div
                      className="bg-accent h-2 rounded-full"
                      style={{ width: u.limit === -1 ? "100%" : `${(u.count / u.limit) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">لا يوجد استخدام</p>
          )}
        </div>

        <div className="card md:col-span-2">
          <h2 className="text-xl font-bold text-primary mb-4">💎 ترقية الاشتراك</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {Object.entries(plans)
              .filter(([key]) => key !== "free")
              .map(([key, plan]: [string, any]) => (
                <div
                  key={key}
                  className={`border-2 rounded-xl p-4 text-center ${
                    subscription?.plan === key ? "border-accent bg-accent/10" : "border-gray-200"
                  }`}
                >
                  <h3 className="font-bold text-primary">{plan.name}</h3>
                  <p className="text-2xl font-bold text-accent my-2">
                    {plan.price} {plan.price === 999 ? "جنيه (مرة واحدة)" : "جنيه/شهر"}
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1 mb-4">
                    {plan.features?.map((f: string, i: number) => (
                      <li key={i}>✓ {f}</li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handleSubscribe(key)}
                    disabled={subscribeLoading || subscription?.plan === key}
                    className="btn-accent w-full text-sm disabled:opacity-50"
                  >
                    {subscription?.plan === key ? "مشترك حالياً" : "اشترك الآن"}
                  </button>
                </div>
              ))}
          </div>

          {message && (
            <div className={`mt-4 p-3 rounded-lg text-center text-sm ${message.includes("خطأ") ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
