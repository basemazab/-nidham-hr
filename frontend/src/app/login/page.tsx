'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'خطأ في تسجيل الدخول');
      }

      const data = await res.json();
      localStorage.setItem('hrms_token', data.access_token);
      localStorage.setItem('hrms_user', JSON.stringify(data.user));
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-800 p-4">
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-cairo font-bold text-gold-500 mb-2">HR BASEM AZAB</h1>
          <p className="text-navy-300 text-lg">نظام إدارة الموارد البشرية</p>
          <p className="text-navy-400 text-sm mt-1">للشركات الصناعية المصرية</p>
        </div>

        <Card className="border-navy-600 bg-navy-700/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white text-center">تسجيل الدخول</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-md bg-red-500/20 text-red-300 text-sm text-center">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm text-navy-200 mb-1.5">اسم المستخدم</label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="bg-navy-600 border-navy-500 text-white placeholder:text-navy-400"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-sm text-navy-200 mb-1.5">كلمة المرور</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-navy-600 border-navy-500 text-white placeholder:text-navy-400"
                  dir="ltr"
                />
              </div>

              <Button
                type="submit"
                variant="secondary"
                className="w-full"
                disabled={loading}
              >
                {loading ? 'جاري الدخول...' : 'دخول'}
              </Button>

              <div className="text-center text-xs text-navy-400 mt-4">
                <p>الحساب التجريبي: admin / admin123</p>
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-navy-500 text-xs mt-6">
          HR BASEM AZAB © {new Date().getFullYear()} — جميع الحقوق محفوظة
        </p>
      </div>
    </div>
  );
}
