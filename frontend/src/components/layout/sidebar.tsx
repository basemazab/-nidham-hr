'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Users, Clock, Calendar, Banknote,
  FileText, Settings, Building2, LogOut, ChevronLeft,
} from 'lucide-react';

const menuItems = [
  { href: '/dashboard', icon: LayoutDashboard, labelAr: 'لوحة المعلومات', labelEn: 'Dashboard' },
  { href: '/employees', icon: Users, labelAr: 'الموظفين', labelEn: 'Employees' },
  { href: '/attendance', icon: Clock, labelAr: 'الحضور والانصراف', labelEn: 'Attendance' },
  { href: '/leave', icon: Calendar, labelAr: 'الإجازات', labelEn: 'Leave' },
  { href: '/payroll', icon: Banknote, labelAr: 'المرتبات', labelEn: 'Payroll' },
  { href: '/reports', icon: FileText, labelAr: 'التقارير', labelEn: 'Reports' },
  { href: '/companies', icon: Building2, labelAr: 'الشركات', labelEn: 'Companies' },
  { href: '/settings', icon: Settings, labelAr: 'الإعدادات', labelEn: 'Settings' },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'fixed top-0 right-0 z-40 h-screen bg-navy-800 text-white transition-all duration-300 flex flex-col',
        collapsed ? 'w-16' : 'w-64',
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-navy-700">
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-gold-500 font-cairo font-bold text-lg">HR BASEM AZAB</span>
            <span className="text-xs text-navy-300">نظام الموارد البشرية</span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-md hover:bg-navy-700 transition-colors"
        >
          <ChevronLeft className={cn('w-5 h-5 transition-transform', collapsed && 'rotate-180')} />
        </button>
      </div>

      {/* Menu */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center px-4 py-3 mx-2 rounded-lg transition-colors mb-1',
                isActive
                  ? 'bg-gold-500 text-navy-800 font-semibold'
                  : 'text-navy-200 hover:bg-navy-700 hover:text-white',
              )}
            >
              <item.icon className={cn('w-5 h-5 shrink-0', !collapsed && 'ml-3')} />
              {!collapsed && <span className="text-sm">{item.labelAr}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-navy-700">
        <button className="flex items-center w-full px-2 py-2 rounded-lg text-navy-300 hover:bg-navy-700 hover:text-white transition-colors">
          <LogOut className={cn('w-5 h-5 shrink-0', !collapsed && 'ml-3')} />
          {!collapsed && <span className="text-sm">تسجيل الخروج</span>}
        </button>
      </div>
    </aside>
  );
}
