import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "نظام توظيف - منصة توظيف ذكية",
    template: "%s | نظام توظيف",
  },
  description: "منصة توظيف ذكية تستخدم الذكاء الاصطناعي لربط الشركات بالمرشحين في مصر والوطن العربي",
  openGraph: {
    title: "نظام توظيف",
    description: "منصة توظيف ذكية في مصر والوطن العربي",
    locale: "ar_EG",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="flex min-h-screen flex-col">
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
