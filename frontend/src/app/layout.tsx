import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'HR BASEM AZAB — نظام إدارة الموارد البشرية',
  description: 'نظام إدارة موارد بشرية متكامل للشركات الصناعية المصرية',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-tajawal antialiased">
        {children}
      </body>
    </html>
  );
}
