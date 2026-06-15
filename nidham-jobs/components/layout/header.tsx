"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Menu, X, Bell, ChevronDown, Briefcase, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "الوظائف", href: "/jobs" },
  { label: "للشركات", href: "/for-companies" },
  { label: "عن نظام", href: "/about" },
];

export function Header() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-800 text-white text-sm font-bold">
            ن
          </div>
          <span className="text-xl font-bold text-gray-900">نظام توظيف</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-gray-600 transition-colors hover:text-primary-800"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Auth / User Menu */}
        <div className="hidden md:flex items-center gap-3">
          {session?.user ? (
            <>
              <button className="relative p-2 text-gray-600 hover:text-primary-800 transition-colors">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-danger" />
              </button>
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-800 text-white text-xs font-bold">
                    {session.user.name?.charAt(0) || "U"}
                  </div>
                  {session.user.name}
                  <ChevronDown className="h-4 w-4" />
                </button>
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute left-0 top-full mt-2 w-56 rounded-xl border bg-white py-2 shadow-lg z-20">
                      {session.user.role === "COMPANY" ? (
                        <>
                          <Link
                            href="/dashboard/company/jobs"
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <Building2 className="h-4 w-4" />
                            لوحة التحكم
                          </Link>
                        </>
                      ) : (
                        <>
                          <Link
                            href="/dashboard/candidate/profile"
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <Briefcase className="h-4 w-4" />
                            ملفي الشخصي
                          </Link>
                        </>
                      )}
                      <hr className="my-2" />
                      <button
                        onClick={() => signOut()}
                        className="w-full px-4 py-2 text-right text-sm text-danger hover:bg-gray-50"
                      >
                        تسجيل الخروج
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost">تسجيل الدخول</Button>
              </Link>
              <Link href="/register">
                <Button variant="accent">إنشاء حساب</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2 text-gray-600"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="md:hidden border-t bg-white">
          <div className="space-y-1 px-4 py-4">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <hr className="my-2" />
            {session?.user ? (
              <button
                onClick={() => signOut()}
                className="block w-full rounded-lg px-4 py-2 text-right text-sm font-medium text-danger hover:bg-gray-50"
              >
                تسجيل الخروج
              </button>
            ) : (
              <div className="flex gap-2 pt-2">
                <Link href="/login" className="flex-1" onClick={() => setIsOpen(false)}>
                  <Button variant="outline" className="w-full">تسجيل الدخول</Button>
                </Link>
                <Link href="/register" className="flex-1" onClick={() => setIsOpen(false)}>
                  <Button className="w-full">إنشاء حساب</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
