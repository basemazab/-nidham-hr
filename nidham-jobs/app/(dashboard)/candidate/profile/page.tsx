"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "@/components/forms/profile-form";
import { Badge } from "@/components/ui/badge";

export default function CandidateProfilePage() {
  const handleSubmit = async (data: any) => {
    console.log("Profile update:", data);
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">ملفي الشخصي</h1>
        <p className="mt-1 text-gray-600">قم بتحديث معلوماتك الشخصية والمهنية</p>
      </div>

      {/* AI Score Card */}
      <Card className="mb-6">
        <CardContent className="p-6 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
            <span className="text-2xl font-bold text-success">٧٥</span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">درجة المطابقة الذكية</h3>
            <p className="text-sm text-gray-500">نسبة اكتمال ملفك وتحسين فرصك في الحصول على وظيفة</p>
            <div className="mt-2 flex gap-1">
              <span className="text-xs text-success font-medium">قوي</span>
              <div className="flex-1 h-2 rounded-full bg-gray-200">
                <div className="h-2 rounded-full bg-success w-3/4" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>المعلومات الشخصية</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm onSubmit={handleSubmit} />
        </CardContent>
      </Card>

      {/* Resume Upload */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>السيرة الذاتية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 rounded-xl border-2 border-dashed border-gray-200 p-6">
            <input type="file" accept=".pdf" className="text-sm" />
            <p className="text-sm text-gray-500">ارفع سيرتك الذاتية بصيغة PDF</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
