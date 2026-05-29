"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/shared/AppLayout";
import { api } from "@/lib/api";

export default function AdminPage() {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadData = () => {
    setLoading(true);
    Promise.all([api.admin.getStats(), api.admin.getPending()]).then(([s, p]) => {
      setStats(s);
      setPending(p);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleActivate = async (id: string) => {
    try {
      await api.admin.activateSubscription(id);
      setMessage("تم تفعيل الاشتراك بنجاح");
      loadData();
    } catch (err: any) {
      setMessage(err.message);
    }
  };

  return (
    <AppLayout>
      <h1 className="text-3xl font-bold text-primary font-heading mb-6">🛡️ لوحة الإدارة</h1>

      {message && (
        <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-4 text-center">{message}</div>
      )}

      {loading ? (
        <p className="text-gray-500">جاري التحميل...</p>
      ) : (
        <>
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <div className="card text-center">
              <div className="text-3xl font-bold text-primary">{stats.total_users || 0}</div>
              <p className="text-sm text-gray-500">إجمالي المستخدمين</p>
            </div>
            <div className="card text-center">
              <div className="text-3xl font-bold text-primary">{stats.total_subscriptions || 0}</div>
              <p className="text-sm text-gray-500">إجمالي الاشتراكات</p>
            </div>
            <div className="card text-center">
              <div className="text-3xl font-bold text-accent">{stats.active_subscriptions || 0}</div>
              <p className="text-sm text-gray-500">اشتراكات نشطة</p>
            </div>
            <div className="card text-center">
              <div className="text-3xl font-bold text-red-500">{stats.pending_subscriptions || 0}</div>
              <p className="text-sm text-gray-500">في الانتظار</p>
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-bold text-primary mb-4">اشتراكات في الانتظار</h2>
            {pending.length === 0 ? (
              <p className="text-gray-500 text-sm">لا توجد اشتراكات معلقة</p>
            ) : (
              <div className="space-y-3">
                {pending.map((p) => (
                  <div key={p.id} className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
                    <div>
                      <p className="font-bold">المستخدم: {p.user_id?.slice(0, 8)}...</p>
                      <p className="text-sm text-gray-500">
                        الخطة: {p.plan} | المرجع: {p.payment_reference || "غير محدد"}
                      </p>
                    </div>
                    <button
                      onClick={() => handleActivate(p.id)}
                      className="btn-accent text-sm"
                    >
                      تفعيل
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </AppLayout>
  );
}
