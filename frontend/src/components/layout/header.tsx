'use client';

import React from 'react';
import { Bell, Moon, Sun, Globe, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  user?: {
    nameAr: string;
    nameEn: string;
    role: string;
    companies?: { id: string; nameAr: string; nameEn: string; isDefault: boolean }[];
    currentCompanyId?: string;
  };
  onSwitchCompany?: (companyId: string) => void;
}

export function Header({ user, onSwitchCompany }: HeaderProps) {
  const [darkMode, setDarkMode] = React.useState(false);
  const [lang, setLang] = React.useState<'ar' | 'en'>('ar');

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const currentCompany = user?.companies?.find(c => c.id === user?.currentCompanyId) || user?.companies?.[0];

  return (
    <header className="sticky top-0 z-30 bg-card border-b border-border px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Company Switcher */}
          {user?.companies && user.companies.length > 1 && (
            <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
              {user.companies.map((company) => (
                <button
                  key={company.id}
                  onClick={() => onSwitchCompany?.(company.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                    company.id === user.currentCompanyId
                      ? 'bg-navy-800 text-white'
                      : 'text-muted-foreground hover:bg-background'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  {lang === 'ar' ? company.nameAr : company.nameEn}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Language Toggle */}
          <Button variant="ghost" size="icon" onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}>
            <Globe className="w-5 h-5" />
          </Button>

          {/* Dark Mode Toggle */}
          <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -left-1 w-4 h-4 bg-gold-500 text-navy-800 text-xs rounded-full flex items-center justify-center font-bold">
              3
            </span>
          </Button>

          {/* User Info */}
          <div className="flex items-center gap-2 pr-3 border-r border-border">
            <div className="w-8 h-8 rounded-full bg-gold-500 flex items-center justify-center text-navy-800 font-bold text-sm">
              {user?.nameAr?.charAt(0) || 'م'}
            </div>
            <div className="text-sm">
              <p className="font-medium">{user?.nameAr || 'مدير النظام'}</p>
              <p className="text-xs text-muted-foreground">{roleLabel(user?.role)}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function roleLabel(role?: string): string {
  const map: Record<string, string> = {
    SUPER_ADMIN: 'مدير النظام',
    HR_MANAGER: 'مدير الموارد البشرية',
    HR_OFFICER: 'مسؤول HR',
    MANAGER: 'مدير',
    EMPLOYEE: 'موظف',
  };
  return map[role || ''] || role || '';
}
