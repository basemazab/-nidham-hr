'use client';

import React, { useState } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { cn } from '@/lib/utils';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);

  // Mock user for initial render
  const mockUser = {
    nameAr: 'مدير النظام',
    nameEn: 'System Admin',
    role: 'SUPER_ADMIN',
    currentCompanyId: '1',
    companies: [
      { id: '1', nameAr: 'مجموعة الاتحاد', nameEn: 'Al-Ittihad Group', isDefault: true },
      { id: '2', nameAr: 'أبواب WPC', nameEn: 'WPC Doors', isDefault: false },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className={cn('transition-all duration-300', collapsed ? 'mr-16' : 'mr-64')}>
        <Header user={mockUser} onSwitchCompany={(id) => console.log('Switch to', id)} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
