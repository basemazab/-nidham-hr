"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import {
  Briefcase,
  Users,
  BarChart3,
  Settings,
  UserCircle,
  Heart,
  BookmarkCheck,
  Lightbulb,
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();

  if (!session) {
    redirect("/login");
  }

  const isCompany = session.user.role === "COMPANY";

  const companySidebarItems = [
    { label: "الوظائف", href: "/dashboard/company/jobs", icon: <Briefcase className="h-5 w-5" /> },
    { label: "المتقدمون", href: "/dashboard/company/applicants", icon: <Users className="h-5 w-5" /> },
    { label: "الإحصائيات", href: "/dashboard/company/analytics", icon: <BarChart3 className="h-5 w-5" /> },
    { label: "الإعدادات", href: "/dashboard/company/settings", icon: <Settings className="h-5 w-5" /> },
  ];

  const candidateSidebarItems = [
    { label: "ملفي الشخصي", href: "/dashboard/candidate/profile", icon: <UserCircle className="h-5 w-5" /> },
    { label: "طلباتي", href: "/dashboard/candidate/applications", icon: <BookmarkCheck className="h-5 w-5" /> },
    { label: "الوظائف المحفوظة", href: "/dashboard/candidate/saved", icon: <Heart className="h-5 w-5" /> },
    { label: "التوصيات", href: "/dashboard/candidate/recommendations", icon: <Lightbulb className="h-5 w-5" /> },
  ];

  const items = isCompany ? companySidebarItems : candidateSidebarItems;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar items={items} title={isCompany ? "لوحة الشركة" : "لوحة الباحث"} />
      <div className="flex-1 lg:mr-64">
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
