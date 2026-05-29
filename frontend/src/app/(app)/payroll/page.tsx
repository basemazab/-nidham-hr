'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Banknote, Plus, Eye, Lock, FileText, Download } from 'lucide-react';

const statusConfig: Record<string, { label: string; variant: 'default' | 'warning' | 'success' | 'info' }> = {
  DRAFT: { label: 'مسودة', variant: 'default' },
  PREVIEW: { label: 'معاينة', variant: 'warning' },
  COMMITTED: { label: 'معتمد', variant: 'success' },
  PAID: { label: 'مدفوع', variant: 'info' },
};

const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

const mockRuns = [
  { id: '1', month: 1, year: 2025, status: 'COMMITTED', totalGross: 450000, totalNet: 380000, totalTax: 15000, itemCount: 40 },
  { id: '2', month: 12, year: 2024, status: 'COMMITTED', totalGross: 445000, totalNet: 376000, totalTax: 14500, itemCount: 40 },
  { id: '3', month: 11, year: 2024, status: 'COMMITTED', totalGross: 440000, totalNet: 372000, totalTax: 14000, itemCount: 38 },
  { id: '4', month: 2, year: 2025, status: 'DRAFT', totalGross: 0, totalNet: 0, totalTax: 0, itemCount: 0 },
];

export default function PayrollPage() {
  const [showNewRun, setShowNewRun] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-cairo font-bold">المرتبات</h1>
          <p className="text-muted-foreground mt-1">إدارة مسيرات الرواتب</p>
        </div>
        <Button variant="secondary" onClick={() => setShowNewRun(!showNewRun)}>
          <Plus className="w-4 h-4 ml-2" />
          مسير رواتب جديد
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">آخر مسير</p>
            <p className="text-2xl font-bold font-cairo">يناير ٢٠٢٥</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">إجمالي المرتبات</p>
            <p className="text-2xl font-bold font-cairo text-gold-500">٤٥٠,٠٠٠</p>
            <p className="text-xs text-muted-foreground">ج.م</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">صافي المرتبات</p>
            <p className="text-2xl font-bold font-cairo text-green-600">٣٨٠,٠٠٠</p>
            <p className="text-xs text-muted-foreground">ج.م</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">الضريبة + التأمينات</p>
            <p className="text-2xl font-bold font-cairo text-red-500">٥٠,٠٠٠</p>
            <p className="text-xs text-muted-foreground">ج.م</p>
          </CardContent>
        </Card>
      </div>

      {/* Payroll Runs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Banknote className="w-5 h-5 text-gold-500" />
            مسيرات الرواتب
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockRuns.map((run) => (
              <div
                key={run.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-navy-800 flex items-center justify-center">
                    <Banknote className="w-6 h-6 text-gold-500" />
                  </div>
                  <div>
                    <p className="font-medium font-cairo">
                      {monthNames[run.month - 1]} {run.year}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {run.itemCount} موظف
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {run.status === 'COMMITTED' && (
                    <div className="text-left">
                      <p className="text-sm text-muted-foreground">إجمالي</p>
                      <p className="font-bold font-cairo">{run.totalGross.toLocaleString('ar-EG')} ج.م</p>
                    </div>
                  )}
                  {run.status === 'COMMITTED' && (
                    <div className="text-left">
                      <p className="text-sm text-muted-foreground">صافي</p>
                      <p className="font-bold font-cairo text-green-600">{run.totalNet.toLocaleString('ar-EG')} ج.م</p>
                    </div>
                  )}

                  <Badge variant={statusConfig[run.status].variant}>
                    {statusConfig[run.status].label}
                  </Badge>

                  <div className="flex gap-1">
                    {run.status === 'DRAFT' && (
                      <>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 ml-1" />
                          معاينة
                        </Button>
                        <Button variant="secondary" size="sm">
                          <Lock className="w-4 h-4 ml-1" />
                          اعتماد
                        </Button>
                      </>
                    )}
                    {run.status === 'COMMITTED' && (
                      <>
                        <Button variant="outline" size="sm">
                          <FileText className="w-4 h-4 ml-1" />
                          مفردات
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 ml-1" />
                          Excel
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
