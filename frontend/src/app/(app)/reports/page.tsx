'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, BarChart3, PieChart, TrendingUp } from 'lucide-react';

const reports = [
  { title: 'تقرير الرواتب الشهري', titleEn: 'Monthly Payroll Report', icon: FileText, description: 'تفاصيل مرتبات جميع الموظفين' },
  { title: 'تقرير الحضور', titleEn: 'Attendance Report', icon: BarChart3, description: 'ملخص الحضور والغياب والتأخير' },
  { title: 'تقرير أرصدة الإجازات', titleEn: 'Leave Balance Report', icon: PieChart, description: 'أرصدة الإجازات لجميع الموظفين' },
  { title: 'نموذج 1 تأمينات', titleEn: 'SI Form 1', icon: FileText, description: 'نموذج اشتراكات التأمينات الاجتماعية' },
  { title: 'نموذج 2 تأمينات', titleEn: 'SI Form 2', icon: FileText, description: 'إقرار الاشتراكات الشهرية' },
  { title: 'نموذج 6 تأمينات', titleEn: 'SI Form 6', icon: FileText, description: 'بيان بأجور العاملين' },
  { title: 'تقرير تكلفة الرواتب', titleEn: 'Payroll Cost Trend', icon: TrendingUp, description: 'تطور تكلفة الرواتب شهرياً' },
  { title: 'ملف تحويل بنكي', titleEn: 'Bank Transfer File', icon: Download, description: 'ملف التحويل البنكي (CIB, NBE, Banque Misr)' },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-cairo font-bold">التقارير</h1>
        <p className="text-muted-foreground mt-1">التقارير والإحصائيات</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((report, i) => (
          <Card key={i} className="hover:border-gold-500 transition-colors cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-navy-800">
                  <report.icon className="w-6 h-6 text-gold-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium font-cairo">{report.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
                  <div className="flex gap-2 mt-3">
                    <Button variant="outline" size="sm">
                      <Download className="w-3 h-3 ml-1" />
                      Excel
                    </Button>
                    <Button variant="outline" size="sm">
                      <FileText className="w-3 h-3 ml-1" />
                      PDF
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
