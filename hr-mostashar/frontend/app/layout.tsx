import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "مستشار HR - مساعد قانون العمل المصري",
  description: "مستشارك الذكي لقانون العمل المصري والتأمينات الاجتماعية. اسأل، احسب، حمّل نماذج جاهزة.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
