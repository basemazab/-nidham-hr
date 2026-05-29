'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, Banknote, Calendar, TrendingUp, Factory, AlertTriangle } from 'lucide-react';

const stats = [
  { title: 'إجمالي الموظفين', value: '60', change: '+3', icon: Users, color: 'text-blue-500' },
  { title: 'الحضور اليوم', value: '54', change: '90%', icon: Clock, color: 'text-green-500' },
  { title: 'تكلفة الرواتب', value: '٤٥٠,٠٠٠', change: 'ج.م', icon: Banknote, color: 'text-gold-500' },
  { title: 'طلبات الإجازات', value: '5', change: 'معلقة', icon: Calendar, color: 'text-orange-500' },
];

const recentEmployees = [
  { name: 'أحمد أبو زيد', department: 'الإنتاج', category: 'MONTHLY', status: 'ACTIVE' },
  { name: 'محمد الشريف', department: 'المبيعات', category: 'WEEKLY', status: 'ACTIVE' },
  { name: 'عبدالله العربي', department: 'المخازن', category: 'HOURLY', status: 'ACTIVE' },
  { name: 'إبراهيم حسين', department: 'الصيانة', category: 'MONTHLY', status: 'ON_LEAVE' },
  { name: 'عمر إسماعيل', department: 'الجودة', category: 'MONTHLY', status: 'ACTIVE' },
];

const categoryLabels: Record<string, string> = {
  MONTHLY: 'شهري',
  WEEKLY: 'أسبوعي',
  HOURLY: 'بالساعة',
};

const statusLabels: Record<string, { label: string; variant: 'success' | 'warning' | 'destructive' }> = {
  ACTIVE: { label: 'نشط', variant: 'success' },
  ON_LEAVE: { label: 'في إجازة', variant: 'warning' },
  SUSPENDED: { label: 'موقوف', variant: 'destructive' },
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-cairo font-bold text-foreground">لوحة المعلومات</h1>
          <p className="text-muted-foreground mt-1">مرحباً بك في نظام HR BASEM AZAB</p>
        </div>
        <Badge variant="secondary" className="text-sm px-3 py-1">
          <Factory className="w-4 h-4 ml-1" />
          مجموعة الاتحاد للصناعات
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold font-cairo mt-1">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                </div>
                <div className={`p-3 rounded-lg bg-muted ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Employees */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-gold-500" />
              أحدث الموظفين
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentEmployees.map((emp, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-navy-800 flex items-center justify-center text-white font-bold text-sm">
                      {emp.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{emp.name}</p>
                      <p className="text-xs text-muted-foreground">{emp.department}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{categoryLabels[emp.category]}</Badge>
                    <Badge variant={statusLabels[emp.status].variant} className="text-xs">
                      {statusLabels[emp.status].label}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Attendance Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-gold-500" />
              ملخص الحضور اليوم
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                  <p className="text-3xl font-bold text-green-600">54</p>
                  <p className="text-sm text-green-600/80">حاضر</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
                  <p className="text-3xl font-bold text-red-600">3</p>
                  <p className="text-sm text-red-600/80">غائب</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                  <p className="text-3xl font-bold text-yellow-600">7</p>
                  <p className="text-sm text-yellow-600/80">متأخر</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <p className="text-3xl font-bold text-blue-600">3</p>
                  <p className="text-sm text-blue-600/80">في إجازة</p>
                </div>
              </div>

              {/* Alerts */}
              <div className="p-3 rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
                <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">7 موظفين تأخروا أكثر من 15 دقيقة</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payroll Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Banknote className="w-5 h-5 text-gold-500" />
              ملخص آخر مسير رواتب
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                <span className="text-sm text-muted-foreground">إجمالي المرتبات</span>
                <span className="font-bold font-cairo">٤٥٠,٠٠٠ ج.م</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                <span className="text-sm text-muted-foreground">صافي المرتبات</span>
                <span className="font-bold font-cairo">٣٨٠,٠٠٠ ج.م</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                <span className="text-sm text-muted-foreground">التأمينات الاجتماعية</span>
                <span className="font-bold font-cairo">٣٥,٠٠٠ ج.م</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                <span className="text-sm text-muted-foreground">ضريبة الدخل</span>
                <span className="font-bold font-cairo">١٥,٠٠٠ ج.م</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-gold-500" />
              إجراءات سريعة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'إضافة موظف', href: '/employees/new', icon: '👤' },
                { label: 'استيراد حضور', href: '/attendance/import', icon: '📥' },
                { label: 'تشغيل مسير الرواتب', href: '/payroll/new', icon: '💰' },
                { label: 'طلب إجازة', href: '/leave/new', icon: '📅' },
                { label: 'تقرير التأمينات', href: '/reports/si', icon: '📊' },
                { label: 'طباعة مفردات', href: '/payroll/payslips', icon: '🖨️' },
              ].map((action, i) => (
                <a
                  key={i}
                  href={action.href}
                  className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-muted transition-colors"
                >
                  <span className="text-xl">{action.icon}</span>
                  <span className="text-sm font-medium">{action.label}</span>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
