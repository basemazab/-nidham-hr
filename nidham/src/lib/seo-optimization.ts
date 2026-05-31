/**
 * تحسينات SEO
 * - Open Graph
 * - Twitter Card
 * - Sitemap
 * - Robots.txt
 */

export interface SEOMetadata {
  title: string;
  description: string;
  keywords: string[];
  image?: string;
  url: string;
  author?: string;
  publishedDate?: string;
  modifiedDate?: string;
  type?: "article" | "website";
  locale?: string;
}

/**
 * generateOpenGraphTags — توليد Open Graph tags
 */
export function generateOpenGraphTags(metadata: SEOMetadata) {
  return {
    "og:title": metadata.title,
    "og:description": metadata.description,
    "og:image": metadata.image || "/og-local.png",
    "og:url": metadata.url,
    "og:type": metadata.type || "website",
    "og:locale": metadata.locale || "ar_EG",
  };
}

/**
 * generateTwitterCardTags — توليد Twitter Card tags
 */
export function generateTwitterCardTags(metadata: SEOMetadata) {
  return {
    "twitter:card": "summary_large_image",
    "twitter:title": metadata.title,
    "twitter:description": metadata.description,
    "twitter:image": metadata.image || "/og-local.png",
    "twitter:site": "@nidham_hr",
  };
}

/**
 * blogKeywords — الكلمات المفتاحية الشاملة للمدونة
 */
export const blogKeywords = {
  hr: [
    "إدارة الموارد البشرية",
    "نظام HR",
    "إدارة الموظفين",
    "الرواتب والتأمينات",
    "قانون العمل المصري",
  ],
  payroll: [
    "حساب الرواتب",
    "التأمينات الاجتماعية",
    "ضريبة الدخل",
    "الخصومات",
    "الراتب الصافي",
  ],
  attendance: [
    "نظام الحضور والغياب",
    "ZKTeco",
    "بصمة الموظفين",
    "تقارير الحضور",
  ],
  leave: [
    "إدارة الإجازات",
    "الإجازة السنوية",
    "الإجازة المرضية",
    "قانون العمل الإجازات",
  ],
};

/**
 * generateSitemap — توليد sitemap للمدونة
 */
export function generateSitemap(posts: Array<{
  slug: string;
  title: string;
  publishedDate: string;
  modifiedDate?: string;
}>) {
  const baseUrl = "https://nidham-hr.vercel.app";

  const urls = [
    {
      loc: baseUrl,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: "weekly",
      priority: "1.0",
    },
    {
      loc: `${baseUrl}/blog`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: "daily",
      priority: "0.9",
    },
    ...posts.map((post) => ({
      loc: `${baseUrl}/blog/${post.slug}`,
      lastmod: (post.modifiedDate || post.publishedDate).split('T')[0],
      changefreq: "monthly" as const,
      priority: "0.8",
    })),
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;
}

/**
 * generateRobotsTxt — توليد robots.txt
 */
export function generateRobotsTxt() {
  return `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api
Disallow: /private

Sitemap: https://nidham-hr.vercel.app/sitemap.xml

User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

Crawl-delay: 1`;
}

/**
 * optimizeImageForSEO — تحسين الصور للـ SEO
 */
export function optimizeImageForSEO({
  src,
  alt,
  title,
}: {
  src: string;
  alt: string;
  title?: string;
}) {
  return {
    src,
    alt,
    title: title || alt,
    loading: "lazy" as const,
    decoding: "async" as const,
  };
}

/**
 * generateHeadingHierarchy — التحقق من هرمية العناوين
 */
export function validateHeadingHierarchy(headings: Array<{
  level: number;
  text: string;
}>) {
  const issues: string[] = [];

  if (headings.length === 0) {
    issues.push("لا توجد عناوين في الصفحة");
    return issues;
  }

  if (headings[0].level !== 1) {
    issues.push("يجب أن يبدأ العنوان الأول بـ H1");
  }

  for (let i = 1; i < headings.length; i++) {
    const currentLevel = headings[i].level;
    const previousLevel = headings[i - 1].level;

    if (currentLevel > previousLevel + 1) {
      issues.push(
        `قفزة في مستوى العنوان من H${previousLevel} إلى H${currentLevel}`
      );
    }
  }

  return issues;
}

/**
 * generateBlogPostSEO — توليد بيانات SEO كاملة لمقالة المدونة
 */
export function generateBlogPostSEO({
  title,
  slug,
  excerpt,
  content,
  image,
  author,
  publishedDate,
  modifiedDate,
  category,
  tags,
}: {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image: string;
  author: string;
  publishedDate: string;
  modifiedDate?: string;
  category: string;
  tags: string[];
}) {
  const url = `https://nidham-hr.vercel.app/blog/${slug}`;
  const keywords = [...tags, category, ...blogKeywords.hr];

  return {
    title: `${title} | مدونة نيدهام HR`,
    description: excerpt,
    keywords: keywords.slice(0, 10),
    image,
    url,
    author,
    publishedDate,
    modifiedDate: modifiedDate || publishedDate,
    type: "article" as const,
    locale: "ar_EG",
    schema: {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: title,
      description: excerpt,
      image: image,
      author: {
        "@type": "Person",
        name: author,
      },
      datePublished: publishedDate,
      dateModified: modifiedDate || publishedDate,
      url: url,
      articleBody: content,
      keywords: keywords.join(", "),
      inLanguage: "ar",
    },
  };
}

/**
 * generateCanonicalURL — توليد Canonical URL
 */
export function generateCanonicalURL(path: string): string {
  const baseUrl = "https://nidham-hr.vercel.app";
  return `${baseUrl}${path}`;
}

/**
 * generateAlternateLanguageLinks — توليد روابط اللغات البديلة
 */
export function generateAlternateLanguageLinks(slug: string) {
  const baseUrl = "https://nidham-hr.vercel.app";
  return {
    ar: `${baseUrl}/ar/blog/${slug}`,
    en: `${baseUrl}/en/blog/${slug}`,
  };
}
