"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/shared/AppLayout";
import { FileText, ArrowRight, ChevronLeft } from "lucide-react";

interface TemplateItem {
  id: string;
  name: string;
  category: string;
  fields: string[];
}

const PRO_TEMPLATES = [
  {
    id: "employment_contract",
    name: "عقد عمل",
    description: "عقد عمل قانوني شامل مع بنود مفصلة وفقاً لقانون العمل",
    icon: "📋",
    path: "/templates/employment-contract",
    category: "عقود",
  },
  {
    id: "appointment_letter",
    name: "خطاب تعيين",
    description: "خطاب تعيين رسمي صادر من إدارة الموارد البشرية",
    icon: "📝",
    path: "/templates/appointment-letter",
    category: "إدارية",
  },
  {
    id: "experience_certificate",
    name: "شهادة خبرة",
    description: "شهادة خبرة رسمية مع التقييم والمهام",
    icon: "🏆",
    path: "/templates/experience-certificate",
    category: "إدارية",
  },
  {
    id: "salary_certificate",
    name: "شهادة راتب",
    description: "شهادة راتب مصدقة مع تفاصيل المرتب والبدلات",
    icon: "💰",
    path: "/templates/salary-certificate",
    category: "إدارية",
  },
  {
    id: "warning_letter",
    name: "خطاب إنذار",
    description: "خطاب إنذار رسمي مع الأساس القانوني",
    icon: "⚠️",
    path: "/templates/warning-letter",
    category: "إنذارات",
  },
  {
    id: "termination_letter",
    name: "خطاب إنهاء خدمة",
    description: "خطاب إنهاء خدمة مع المستحقات المالية",
    icon: "📤",
    path: "/templates/termination-letter",
    category: "إنذارات",
  },
];

export default function TemplatesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Record<string, TemplateItem[]>>({});

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/templates`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
    })
      .then((res) => res.json())
      .then(setCategories)
      .catch(() => {});
  }, []);

  return (
    <AppLayout>
      <h1 className="text-3xl font-bold text-primary font-heading mb-2">📄 مكتبة النماذج الاحترافية</h1>
      <p className="text-gray-500 mb-6">نماذج HR قانونية احترافية بتصميم موحد وجاهزة للطباعة</p>

      {/* Pro Templates Section */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-accent mb-4 flex items-center gap-2">
          ⭐ النماذج الاحترافية
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PRO_TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => router.push(template.path)}
              className="card text-right hover:border-accent transition border-2 border-transparent group"
            >
              <div className="flex items-start gap-3">
                <div className="text-3xl">{template.icon}</div>
                <div className="flex-1">
                  <div className="font-bold text-primary text-lg group-hover:text-accent transition">{template.name}</div>
                  <div className="text-sm text-gray-500 mt-1">{template.description}</div>
                  <div className="flex items-center gap-1 text-accent text-sm mt-3">
                    فتح النموذج <ChevronLeft className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Classic Templates Section */}
      {Object.keys(categories).length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-primary mb-4">النماذج الأخرى</h2>
          <div className="space-y-6">
            {Object.entries(categories).map(([category, templates]) => (
              <div key={category}>
                <h3 className="text-lg font-bold text-primary mb-3">{category}</h3>
                <div className="grid md:grid-cols-3 gap-3">
                  {templates.map((t) => (
                    <button
                      key={t.id}
                      className="card text-right hover:border-accent transition border-2 border-transparent"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-gray-400" />
                        <div>
                          <div className="font-bold text-primary">{t.name}</div>
                          <div className="text-sm text-gray-500 mt-1">{t.fields.length} حقول</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
