'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Factory, Users, MapPin } from 'lucide-react';

const companies = [
  {
    id: '1',
    nameAr: 'مجموعة الاتحاد للصناعات',
    nameEn: 'Al-Ittihad Industrial Group',
    address: 'مدينة العاشر من رمضان - المنطقة الصناعية',
    employeeCount: 40,
    factories: [
      { nameAr: 'مصنع الإنتاج الرئيسي', nameEn: 'Main Production Factory', employees: 25 },
      { nameAr: 'مصنع التشطيبات', nameEn: 'Finishing Factory', employees: 15 },
    ],
  },
  {
    id: '2',
    nameAr: 'أبواب WPC للصناعات الخشبية',
    nameEn: 'WPC Doors Manufacturing',
    address: 'مدينة السادس من أكتوبر - المنطقة الصناعية',
    employeeCount: 20,
    factories: [
      { nameAr: 'مصنع أبواب WPC', nameEn: 'WPC Doors Factory', employees: 20 },
    ],
  },
];

export default function CompaniesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-cairo font-bold">الشركات والمصانع</h1>
        <p className="text-muted-foreground mt-1">إدارة الشركات المتعددة</p>
      </div>

      <div className="space-y-6">
        {companies.map((company) => (
          <Card key={company.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-navy-800 flex items-center justify-center">
                    <Building2 className="w-7 h-7 text-gold-500" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{company.nameAr}</CardTitle>
                    <p className="text-sm text-muted-foreground">{company.nameEn}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  <Users className="w-4 h-4 ml-1" />
                  {company.employeeCount} موظف
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <MapPin className="w-4 h-4" />
                {company.address}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {company.factories.map((factory, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Factory className="w-5 h-5 text-gold-500" />
                    <div>
                      <p className="font-medium text-sm">{factory.nameAr}</p>
                      <p className="text-xs text-muted-foreground">{factory.employees} موظف</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
