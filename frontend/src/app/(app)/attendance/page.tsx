'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Clock, Upload, Calendar, Users } from 'lucide-react';

const statusConfig: Record<string, { label: string; color: string; variant: 'success' | 'destructive' | 'warning' | 'info' }> = {
  PRESENT: { label: 'حاضر', color: 'bg-green-500', variant: 'success' },
  ABSENT: { label: 'غائب', color: 'bg-red-500', variant: 'destructive' },
  LATE: { label: 'متأخر', color: 'bg-yellow-500', variant: 'warning' },
  ON_LEAVE: { label: 'إجازة', color: 'bg-blue-500', variant: 'info' },
};

const mockAttendance = Array.from({ length: 20 }, (_, i) => ({
  employee: {
    employeeCode: `EMP-${String(i + 1).padStart(4, '0')}`,
    nameAr: ['أحمد أبو زيد', 'محمد الشريف', 'عبدالله العربي', 'إبراهيم حسين', 'عمر إسماعيل',
      'خالد عبدالرحمن', 'حسن المصري', 'علي السيد', 'يوسف رمضان', 'طارق عبدالغني',
      'مصطفى النجار', 'عادل الحداد', 'سمير البنا', 'جمال عطية', 'فاروق محمود',
      'رامي سليمان', 'هاني فرج', 'ياسر شاهين', 'وائل درويش', 'شريف غنيم'][i],
  },
  record: {
    status: i === 5 ? 'ABSENT' : i === 3 ? 'ON_LEAVE' : i % 5 === 0 ? 'LATE' : 'PRESENT',
    checkIn: i === 5 ? null : i % 5 === 0 ? `08:${15 + i}` : '08:00',
    checkOut: i === 5 ? null : `16:${String(i % 30).padStart(2, '0')}`,
    lateMinutes: i % 5 === 0 ? 15 + i : 0,
    overtimeMinutes: i % 7 === 0 ? 60 : 0,
    workedHours: i === 5 ? 0 : 7 + (i % 3) * 0.5,
  },
}));

export default function AttendancePage() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [showImport, setShowImport] = useState(false);

  const summary = {
    total: mockAttendance.length,
    present: mockAttendance.filter(a => a.record.status === 'PRESENT').length,
    late: mockAttendance.filter(a => a.record.status === 'LATE').length,
    absent: mockAttendance.filter(a => a.record.status === 'ABSENT').length,
    onLeave: mockAttendance.filter(a => a.record.status === 'ON_LEAVE').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-cairo font-bold">الحضور والانصراف</h1>
          <p className="text-muted-foreground mt-1">متابعة الحضور اليومي</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowImport(!showImport)}>
            <Upload className="w-4 h-4 ml-2" />
            استيراد ZKTeco
          </Button>
        </div>
      </div>

      {/* Import Dialog */}
      {showImport && (
        <Card className="border-gold-500">
          <CardHeader>
            <CardTitle className="text-lg">استيراد بيانات ZKTeco</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                ارفع ملف .dat أو .xls المصدّر من جهاز ZKTeco البصمة
              </p>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">اسحب الملف هنا أو اضغط للاختيار</p>
                <input type="file" accept=".dat,.xls,.xlsx,.csv" className="mt-2" />
              </div>
              <div className="flex gap-2">
                <Button variant="secondary">رفع واستيراد</Button>
                <Button variant="outline" onClick={() => setShowImport(false)}>إلغاء</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Date & Summary */}
      <div className="flex gap-4 items-start">
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-48"
          dir="ltr"
        />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1">
          <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
            <p className="text-2xl font-bold text-green-600">{summary.present}</p>
            <p className="text-xs text-green-600/80">حاضر</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
            <p className="text-2xl font-bold text-red-600">{summary.absent}</p>
            <p className="text-xs text-red-600/80">غائب</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
            <p className="text-2xl font-bold text-yellow-600">{summary.late}</p>
            <p className="text-xs text-yellow-600/80">متأخر</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
            <p className="text-2xl font-bold text-blue-600">{summary.onLeave}</p>
            <p className="text-xs text-blue-600/80">إجازة</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">الكود</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">الاسم</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">الحالة</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">وقت الحضور</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">وقت الانصراف</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">التأخير</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">إضافي</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">ساعات العمل</th>
                </tr>
              </thead>
              <tbody>
                {mockAttendance.map((att, i) => (
                  <tr key={i} className="border-t border-border hover:bg-muted/30">
                    <td className="p-4 text-sm font-mono" dir="ltr">{att.employee.employeeCode}</td>
                    <td className="p-4 font-medium text-sm">{att.employee.nameAr}</td>
                    <td className="p-4">
                      <Badge variant={statusConfig[att.record.status].variant}>
                        {statusConfig[att.record.status].label}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm" dir="ltr">{att.record.checkIn || '—'}</td>
                    <td className="p-4 text-sm" dir="ltr">{att.record.checkOut || '—'}</td>
                    <td className="p-4 text-sm">
                      {att.record.lateMinutes > 0 && (
                        <span className="text-yellow-600">{att.record.lateMinutes} دقيقة</span>
                      )}
                    </td>
                    <td className="p-4 text-sm">
                      {att.record.overtimeMinutes > 0 && (
                        <span className="text-green-600">{att.record.overtimeMinutes} دقيقة</span>
                      )}
                    </td>
                    <td className="p-4 text-sm font-mono" dir="ltr">{att.record.workedHours.toFixed(1)}</td>
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
