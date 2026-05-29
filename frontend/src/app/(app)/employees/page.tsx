'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Search, Filter, Download } from 'lucide-react';

const categoryLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'info' }> = {
  MONTHLY: { label: 'شهري', variant: 'default' },
  WEEKLY: { label: 'أسبوعي', variant: 'secondary' },
  HOURLY: { label: 'بالساعة', variant: 'info' },
};

const mockEmployees = Array.from({ length: 20 }, (_, i) => ({
  id: `${i + 1}`,
  employeeCode: `EMP-${String(i + 1).padStart(4, '0')}`,
  nameAr: ['أحمد أبو زيد', 'محمد الشريف', 'عبدالله العربي', 'إبراهيم حسين', 'عمر إسماعيل',
    'خالد عبدالرحمن', 'حسن المصري', 'علي السيد', 'يوسف رمضان', 'طارق عبدالغني',
    'مصطفى النجار', 'عادل الحداد', 'سمير البنا', 'جمال عطية', 'فاروق محمود',
    'رامي سليمان', 'هاني فرج', 'ياسر شاهين', 'وائل درويش', 'شريف غنيم'][i],
  department: { nameAr: ['الإنتاج', 'المبيعات', 'المخازن', 'الإدارة', 'الموارد البشرية', 'الصيانة', 'الجودة'][i % 7] },
  position: { nameAr: ['عامل إنتاج', 'مشرف', 'فني', 'أمين مخزن', 'محاسب', 'مندوب', 'مفتش'][i % 7] },
  factory: { nameAr: i % 2 === 0 ? 'مصنع الإنتاج الرئيسي' : 'مصنع التشطيبات' },
  category: i < 10 ? 'MONTHLY' : i < 15 ? 'WEEKLY' : 'HOURLY',
  status: i === 3 ? 'ON_LEAVE' : 'ACTIVE',
  basicSalary: 4000 + i * 200,
  phone: `+20-10-${String(10000000 + i * 1234).slice(0, 8)}`,
}));

export default function EmployeesPage() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const filtered = mockEmployees.filter((emp) => {
    if (search && !emp.nameAr.includes(search) && !emp.employeeCode.includes(search)) return false;
    if (categoryFilter && emp.category !== categoryFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-cairo font-bold">الموظفين</h1>
          <p className="text-muted-foreground mt-1">إدارة بيانات الموظفين</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 ml-2" />
            تصدير Excel
          </Button>
          <Button variant="secondary">
            <Plus className="w-4 h-4 ml-2" />
            إضافة موظف
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold font-cairo">60</p>
            <p className="text-sm text-muted-foreground">إجمالي</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold font-cairo text-blue-600">30</p>
            <p className="text-sm text-muted-foreground">شهري</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold font-cairo text-gold-500">15</p>
            <p className="text-sm text-muted-foreground">أسبوعي</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold font-cairo text-green-600">15</p>
            <p className="text-sm text-muted-foreground">بالساعة</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث بالاسم أو الكود..."
                className="pr-10"
              />
            </div>
            <div className="flex gap-2">
              {['', 'MONTHLY', 'WEEKLY', 'HOURLY'].map((cat) => (
                <Button
                  key={cat}
                  variant={categoryFilter === cat ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCategoryFilter(cat)}
                >
                  {cat === '' ? 'الكل' : categoryLabels[cat].label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">الكود</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">الاسم</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">القسم</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">الوظيفة</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">المصنع</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">الفئة</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">الحالة</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp) => (
                  <tr key={emp.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                    <td className="p-4 text-sm font-mono" dir="ltr">{emp.employeeCode}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-navy-800 flex items-center justify-center text-white text-xs font-bold">
                          {emp.nameAr.charAt(0)}
                        </div>
                        <span className="font-medium text-sm">{emp.nameAr}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm">{emp.department.nameAr}</td>
                    <td className="p-4 text-sm">{emp.position.nameAr}</td>
                    <td className="p-4 text-sm">{emp.factory.nameAr}</td>
                    <td className="p-4">
                      <Badge variant={categoryLabels[emp.category].variant as any}>
                        {categoryLabels[emp.category].label}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge variant={emp.status === 'ACTIVE' ? 'success' : 'warning'}>
                        {emp.status === 'ACTIVE' ? 'نشط' : 'في إجازة'}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Button variant="ghost" size="sm">عرض</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
