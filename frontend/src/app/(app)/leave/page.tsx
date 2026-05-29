'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Plus, Check, X } from 'lucide-react';

const leaveTypeLabels: Record<string, string> = {
  ANNUAL: 'سنوية',
  CASUAL: 'عارضة',
  SICK: 'مرضية',
  MATERNITY: 'أمومة',
  HAJJ: 'حج',
  MARRIAGE: 'زواج',
  BEREAVEMENT: 'عزاء',
  EXAM: 'امتحانات',
  UNPAID: 'بدون راتب',
};

const statusConfig: Record<string, { label: string; variant: 'warning' | 'success' | 'destructive' | 'info' }> = {
  PENDING: { label: 'معلقة', variant: 'warning' },
  HR_APPROVED: { label: 'موافق عليها', variant: 'success' },
  REJECTED: { label: 'مرفوضة', variant: 'destructive' },
  MANAGER_APPROVED: { label: 'موافقة المدير', variant: 'info' },
};

const mockRequests = [
  { id: '1', employee: { nameAr: 'أحمد أبو زيد', employeeCode: 'EMP-0001', department: { nameAr: 'الإنتاج' } }, leaveType: 'ANNUAL', startDate: '2025-02-10', endDate: '2025-02-14', days: 5, status: 'PENDING', reason: 'إجازة عائلية' },
  { id: '2', employee: { nameAr: 'محمد الشريف', employeeCode: 'EMP-0002', department: { nameAr: 'المبيعات' } }, leaveType: 'CASUAL', startDate: '2025-02-05', endDate: '2025-02-06', days: 2, status: 'PENDING', reason: 'ظرف طارئ' },
  { id: '3', employee: { nameAr: 'عبدالله العربي', employeeCode: 'EMP-0003', department: { nameAr: 'المخازن' } }, leaveType: 'SICK', startDate: '2025-01-28', endDate: '2025-01-30', days: 3, status: 'HR_APPROVED', reason: 'مرض - شهادة طبية مرفقة' },
  { id: '4', employee: { nameAr: 'خالد عبدالرحمن', employeeCode: 'EMP-0006', department: { nameAr: 'الصيانة' } }, leaveType: 'ANNUAL', startDate: '2025-01-20', endDate: '2025-01-24', days: 5, status: 'HR_APPROVED', reason: 'سفر' },
  { id: '5', employee: { nameAr: 'إبراهيم حسين', employeeCode: 'EMP-0004', department: { nameAr: 'الإدارة' } }, leaveType: 'MARRIAGE', startDate: '2025-03-01', endDate: '2025-03-03', days: 3, status: 'PENDING', reason: 'زواج' },
];

export default function LeavePage() {
  const [filter, setFilter] = useState('');

  const filtered = filter ? mockRequests.filter(r => r.status === filter) : mockRequests;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-cairo font-bold">الإجازات</h1>
          <p className="text-muted-foreground mt-1">إدارة طلبات الإجازات</p>
        </div>
        <Button variant="secondary">
          <Plus className="w-4 h-4 ml-2" />
          طلب إجازة جديد
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold font-cairo text-yellow-600">{mockRequests.filter(r => r.status === 'PENDING').length}</p>
            <p className="text-sm text-muted-foreground">معلقة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold font-cairo text-green-600">{mockRequests.filter(r => r.status === 'HR_APPROVED').length}</p>
            <p className="text-sm text-muted-foreground">موافق عليها</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold font-cairo">21</p>
            <p className="text-sm text-muted-foreground">رصيد سنوية (متوسط)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold font-cairo">6</p>
            <p className="text-sm text-muted-foreground">رصيد عارضة (متوسط)</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['', 'PENDING', 'HR_APPROVED', 'REJECTED'].map((s) => (
          <Button
            key={s}
            variant={filter === s ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(s)}
          >
            {s === '' ? 'الكل' : statusConfig[s].label}
          </Button>
        ))}
      </div>

      {/* Requests */}
      <div className="space-y-3">
        {filtered.map((req) => (
          <Card key={req.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-navy-800 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-gold-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{req.employee.nameAr}</p>
                      <span className="text-xs text-muted-foreground font-mono" dir="ltr">{req.employee.employeeCode}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{req.employee.department.nameAr}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div>
                    <Badge variant="outline">{leaveTypeLabels[req.leaveType]}</Badge>
                  </div>
                  <div className="text-sm">
                    <p>{req.startDate} — {req.endDate}</p>
                    <p className="text-muted-foreground">{req.days} أيام</p>
                  </div>
                  <Badge variant={statusConfig[req.status].variant}>
                    {statusConfig[req.status].label}
                  </Badge>

                  {req.status === 'PENDING' && (
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" className="text-green-600 hover:bg-green-50">
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              {req.reason && (
                <p className="text-sm text-muted-foreground mt-2 mr-16">{req.reason}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
