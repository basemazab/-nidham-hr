"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";

const navItems = [
  { href: "/chat", icon: "💬", label: "الدردشة" },
  { href: "/calculators", icon: "🧮", label: "الحاسبات" },
  { href: "/employees", icon: "👥", label: "الموظفون" },
  { href: "/templates", icon: "📄", label: "النماذج" },
  { href: "/account", icon: "⚙️", label: "حسابي" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 bg-primary min-h-screen text-white flex flex-col">
      <div className="p-6 border-b border-white/10">
        <h1 className="text-xl font-bold text-accent font-heading">مستشار HR</h1>
        <p className="text-sm text-gray-400 mt-1">{user?.full_name}</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                active ? "bg-accent text-primary font-bold" : "text-gray-300 hover:bg-white/10"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}

        {user?.is_admin && (
          <Link
            href="/admin"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              pathname === "/admin" ? "bg-accent text-primary font-bold" : "text-gray-300 hover:bg-white/10"
            }`}
          >
            <span className="text-lg">🛡️</span>
            <span>لوحة الإدارة</span>
          </Link>
        )}
      </nav>

      <div className="p-4 border-t border-white/10">
        <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-white/10 transition">
          <span className="text-lg">🏠</span>
          <span>الرئيسية</span>
        </Link>
        <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-white/10 transition">
          <span className="text-lg">🚪</span>
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  );
}
