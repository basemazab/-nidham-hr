import Link from "next/link";

const FOOTER_LINKS = {
  الشركة: [
    { label: "عن نظام", href: "/about" },
    { label: "المدونة", href: "/blog" },
    { label: "وظائف في نظام", href: "/careers" },
    { label: "اتصل بنا", href: "/contact" },
  ],
  الدعم: [
    { label: "مساعدة", href: "/help" },
    { label: "الدعم الفني", href: "/support" },
    { label: "خصوصية", href: "/privacy" },
    { label: "الشروط", href: "/terms" },
  ],
  للشركات: [
    { label: "نشر وظيفة", href: "/register?type=company" },
    { label: "باقة للشركات", href: "/pricing" },
    { label: "API", href: "/api-docs" },
    { label: "شركاء", href: "/partners" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-800 text-white text-sm font-bold">
                ن
              </div>
              <span className="text-xl font-bold text-gray-900">نظام توظيف</span>
            </Link>
            <p className="mt-4 text-sm text-gray-600 leading-relaxed">
              منصة توظيف ذكية تستخدم الذكاء الاصطناعي لربط أفضل المواهب مع أفضل الفرص في مصر والوطن العربي.
            </p>
          </div>

          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
              <ul className="mt-4 space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-600 transition-colors hover:text-primary-800"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-gray-100 pt-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} نظام توظيف. جميع الحقوق محفوظة.
            </p>
            <p className="text-sm text-gray-500">
              صُنع في مصر
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
