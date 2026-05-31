import type { Metadata, Viewport } from "next";
import { Tajawal, Cairo, Reem_Kufi } from "next/font/google";
import { Suspense } from "react";
import { Toaster } from "sonner";
import "./globals.css";
import { UrlToasts } from "@/components/url-toasts";
import { ThemeProvider } from "@/components/theme-provider";
import { MetaPixel } from "@/components/meta-pixel";
import { PWAInstaller } from "@/components/pwa-installer";
import { AppProviders } from "@/lib/providers/app-providers";
import {
  OrganizationSchema,
  SoftwareApplicationSchema,
  WebsiteSchema,
} from "@/components/json-ld";

const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic"],
  weight: ["400", "700"],
  display: "optional",
});

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic"],
  weight: ["400", "700"],
  display: "optional",
});

const reemKufi = Reem_Kufi({
  variable: "--font-reem-kufi",
  subsets: ["arabic"],
  weight: ["400", "700"],
  display: "optional",
});

// metadataBase is required for OG / Twitter card resolution. NEXT_PUBLIC_SITE_URL
// is read at build time on Vercel; fall back to the canonical Cloud URL if it's
// missing (e.g. local dev) so social-link unfurls still work in staging.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://nidhamhr.com";

// Viewport must be in its own export per Next.js 15+ convention. The
// theme-color paints the Android status bar + iOS PWA chrome to match
// our brand cyan so the installed app feels integrated, not webview-y.
export const viewport: Viewport = {
  themeColor: "#0891b2",
  width: "device-width",
  initialScale: 1,
  // iOS-only: prevent zoom on input focus (annoying on signup forms)
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  // SEO O2: title front-loads the most-searched Egyptian Arabic keywords
  // ("نظام إدارة موارد بشرية", "مرتبات", "مصر") to maximize click-through
  // from search results. 60-char limit respected. Brand at the end —
  // it's strong enough to stand without being first.
  title: {
    default:
      "نظام إدارة موارد بشرية ومرتبات للشركات المصرية | نِظام",
    template: "%s | نِظام HR",
  },
  description:
    "أفضل نظام HR ومرتبات مصري بـ AI — متوافق مع قانون 12/2003 والتأمينات 148/2019. حضور GPS، رواتب آلي، نماذج تأمينات، توقيع إلكتروني، CRM، استوديو تسويق. جرّب مجاناً 14 يوم — ما تحتاجش بطاقة ائتمان.",
  keywords: [
    // ── Marketing / CRM keywords ──
    "نظام CRM مصري",
    "برنامج CRM للشركات",
    "استوديو تسويق AI",
    "تسويق بالذكاء الاصطناعي",
    "نظام متكامل HR CRM",
    "إدارة العملاء والموظفين",
    "منصة موارد بشرية متكاملة",
    "أفضل نظام HR في مصر",
    "بديل Excel للموارد البشرية",
    // ── Primary Arabic intent keywords ──
    "نظام HR مصري",
    "برنامج موارد بشرية",
    "نظام مرتبات مصري",
    "برنامج مرتبات للشركات",
    "نظام حضور وانصراف",
    "حضور وانصراف GPS",
    "نظام تأمينات اجتماعية",
    "حساب التأمينات والضرايب",
    "نموذج 1 تأمينات",
    "نموذج 6 تأمينات",
    "شهادة خبرة جاهزة",
    "حساب نهاية الخدمة",
    "برنامج إدارة العملاء",
    // ── Comparative / alternative ──
    "بديل Bayzat",
    "بديل ZenHR",
    "Bayzat alternative Egypt",
    // ── English ──
    "egyptian hr software",
    "egypt payroll system",
    "hr software egypt",
    "egypt labor law compliance",
    "arabic hr system",
    // ── Brand ──
    "نِظام",
    "Nidham HR",
    "نظام نظام",
  ],
  applicationName: "Nidham",
  // PWA / install metadata
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Nidham",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
    shortcut: "/icon.svg",
  },
  openGraph: {
    type: "website",
    siteName: "Nidham HR",
    title: "نظام إدارة موارد بشرية ومرتبات للشركات المصرية | نِظام",
    description:
      "أفضل نظام HR ومرتبات مصري بـ AI — متوافق مع قانون 12/2003. حضور بالـ GPS، نماذج تأمينات، توقيع إلكتروني. 14 يوم مجاناً.",
    locale: "ar_EG",
    alternateLocale: ["en_US"],
    images: [{ url: "/api/og?title=" + encodeURIComponent("نظام HR و Payroll و AI للشركات المصرية"), width: 1200, height: 630, alt: "نِظام — نظام HR + Payroll + AI لمصر" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "نظام HR ومرتبات للشركات المصرية | نِظام",
    description:
      "أفضل نظام HR + Payroll + AI مصري · متوافق قانونياً · حضور GPS · 14 يوم مجاناً.",
    site: "@nidham_hr",
  },
  // SEO O2: explicit canonical to prevent www / non-www duplication
  alternates: {
    canonical: siteUrl,
    languages: {
      "ar-EG": siteUrl,
      "x-default": siteUrl,
    },
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      // suppressHydrationWarning is required by next-themes — the
      // provider sets `class="dark"` on <html> BEFORE React hydrates,
      // and React would otherwise complain about the className
      // mismatch between the SSR'd output and the client tree.
      suppressHydrationWarning
      className={`${tajawal.variable} ${cairo.variable} ${reemKufi.variable} h-full antialiased`}
    >
      <head>
        {/* Preconnect to Google Fonts CDN — reduces font load latency
            by ~300ms on cold starts. Required because next/font/google
            injects the @font-face CSS dynamically. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://connect.facebook.net" />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        {/* SEO: schema.org structured data on every page.
            Organization + SoftwareApplication + WebSite power
            Google's Knowledge Panel, rich card results, and the
            sitelinks search box. */}
        <OrganizationSchema />
        <SoftwareApplicationSchema />
        <WebsiteSchema />
        <ThemeProvider>
          <AppProviders>
          {children}
          {/* Sonner toaster — top-center so RTL feels natural. richColors
              gives success / error a subtle tint instead of the plain
              dark default. theme="system" lets sonner pick light/dark
              based on the resolved next-themes value. */}
          <Toaster
            position="top-center"
            dir="rtl"
            richColors
            theme="system"
            expand={false}
            closeButton={false}
            toastOptions={{
              classNames: {
                toast:
                  "font-cairo !shadow-lg !rounded-2xl !border !px-4 !py-3 !text-sm",
                title: "font-bold",
                description: "text-slate-600",
              },
            }}
          />
          <Suspense fallback={null}>
            <UrlToasts />
          </Suspense>
          {/* Meta Pixel — no-ops until NEXT_PUBLIC_META_PIXEL_ID is set in
              Vercel env. Lives outside ThemeProvider so theme transitions
              don't trigger spurious PageView re-fires. */}
          <MetaPixel />
          {/* PWA bootstrap — registers the service worker + captures the
              `beforeinstallprompt` event so <PWAInstallButton /> can fire
              it on user demand. Headless component. */}
          <PWAInstaller />
          {/* Floating WhatsApp CTA — يظهر على كل الصفحات العامة */}
          <a
            href="https://wa.me/201055356622?text=أهلاً، شفت موقع نِظام وعايز أسأل عن النظام"
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-20 left-4 sm:left-6 z-50 w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#20bd5a] shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 flex items-center justify-center text-white text-2xl"
            aria-label="كلمنا على واتساب"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </a>
          </AppProviders>
        </ThemeProvider>
      </body>
    </html>
  );
}
