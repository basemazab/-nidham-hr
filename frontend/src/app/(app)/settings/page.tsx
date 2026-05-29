'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, Shield, Palette, Globe } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-cairo font-bold">الإعدادات</h1>
        <p className="text-muted-foreground mt-1">إعدادات النظام</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-gold-500" />
              المظهر
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>الوضع الليلي</span>
              <Button variant="outline" size="sm">تفعيل</Button>
            </div>
            <div className="flex items-center justify-between">
              <span>حجم الخط</span>
              <Button variant="outline" size="sm">متوسط</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-gold-500" />
              اللغة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>اللغة الأساسية</span>
              <Badge variant="secondary">العربية</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>اتجاه الصفحة</span>
              <Badge variant="outline">RTL</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-gold-500" />
              الأمان
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>المصادقة الثنائية</span>
              <Button variant="outline" size="sm">تفعيل</Button>
            </div>
            <div className="flex items-center justify-between">
              <span>تغيير كلمة المرور</span>
              <Button variant="outline" size="sm">تغيير</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-gold-500" />
              النظام
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>الإصدار</span>
              <Badge variant="outline">1.0.0</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>العلامة التجارية</span>
              <Badge variant="secondary">HR BASEM AZAB</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
