"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

const COMPANY_SIZE = [
  { value: "STARTUP", label: "ناشئة (١-١٠)" },
  { value: "SMALL", label: "صغيرة (١١-٥٠)" },
  { value: "MEDIUM", label: "متوسطة (٥١-٢٠٠)" },
  { value: "LARGE", label: "كبيرة (٢٠١-١٠٠٠)" },
  { value: "ENTERPRISE", label: "مؤسسة (١٠٠٠+)" },
];

export default function CompanySettingsPage() {
  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">إعدادات الشركة</h1>
        <p className="mt-1 text-gray-600">إدارة معلومات شركتك</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>معلومات الشركة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="اسم الشركة" placeholder="شركة نظام" />
            <Input label="الموقع الإلكتروني" type="url" placeholder="https://example.com" />
          </div>
          <Input label="البريد الإلكتروني" type="email" placeholder="info@company.com" />
          <Input label="رقم الهاتف" type="tel" placeholder="+20 100 000 0000" />
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="المجال" placeholder="تكنولوجيا المعلومات" />
            <Select label="حجم الشركة" options={COMPANY_SIZE} placeholder="اختر الحجم" />
          </div>
          <Input label="الموقع" placeholder="القاهرة، مصر" />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">عن الشركة</label>
            <textarea
              rows={4}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-right outline-none focus:border-primary-500"
              placeholder="اكتب وصفاً للشركة..."
            />
          </div>
          <Button>حفظ التغييرات</Button>
        </CardContent>
      </Card>
    </div>
  );
}
