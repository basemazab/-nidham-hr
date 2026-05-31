import { ReactNode } from "react";

interface BlogSchemaProps {
  title: string;
  description: string;
  image?: string;
  author?: string;
  datePublished: string;
  dateModified?: string;
  url: string;
  content?: string;
  keywords?: string[];
}

/**
 * BlogSchemaMarkup — Schema Markup محسّن للمقالات
 * يساعد محركات البحث على فهم محتوى المدونة بشكل أفضل
 */
export function BlogSchemaMarkup({
  title,
  description,
  image,
  author = "Nidham HR",
  datePublished,
  dateModified,
  url,
  content,
  keywords = [],
}: BlogSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description: description,
    image: image || "/og-local.png",
    author: {
      "@type": "Person",
      name: author,
    },
    datePublished: datePublished,
    dateModified: dateModified || datePublished,
    url: url,
    articleBody: content,
    keywords: keywords.join(", "),
    inLanguage: "ar",
    publisher: {
      "@type": "Organization",
      name: "Nidham HR",
      logo: {
        "@type": "ImageObject",
        url: "/logo.png",
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * OrganizationSchemaMarkup — Schema Markup للمنظمة
 */
export function OrganizationSchemaMarkup() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Nidham HR",
    url: "https://nidham-hr.vercel.app",
    logo: "/logo.png",
    description:
      "نظام إدارة موارد بشرية متكامل مصمم خصيصاً للشركات الصناعية المصرية",
    sameAs: [
      "https://twitter.com/nidham_hr",
      "https://linkedin.com/company/nidham-hr",
    ],
    contact: {
      "@type": "ContactPoint",
      contactType: "Customer Support",
      email: "support@nidham-hr.com",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * FAQSchemaMarkup — Schema Markup للأسئلة الشائعة
 */
export function FAQSchemaMarkup({
  faqs,
}: {
  faqs: Array<{ question: string; answer: string }>;
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * BreadcrumbSchemaMarkup — Schema Markup لسلسلة التنقل
 */
export function BreadcrumbSchemaMarkup({
  items,
}: {
  items: Array<{ name: string; url: string }>;
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * ArticleSchemaMarkup — Schema Markup متقدم للمقالات
 */
export function ArticleSchemaMarkup({\n  title,\n  description,\n  image,\n  author,\n  datePublished,\n  dateModified,\n  url,\n  wordCount,\n  articleSection,\n  keywords,\n}: {\n  title: string;\n  description: string;\n  image?: string;\n  author: string;\n  datePublished: string;\n  dateModified?: string;\n  url: string;\n  wordCount?: number;\n  articleSection?: string;\n  keywords?: string[];\n}) {\n  const schema = {\n    "@context": "https://schema.org",\n    "@type": "Article",\n    headline: title,\n    description: description,\n    image: image || "/og-local.png",\n    author: {\n      "@type": "Person",\n      name: author,\n    },\n    datePublished: datePublished,\n    dateModified: dateModified || datePublished,\n    url: url,\n    wordCount: wordCount || 1000,\n    articleSection: articleSection || "HR",\n    keywords: keywords?.join(", ") || "",\n    inLanguage: "ar",\n  };\n\n  return (\n    <script\n      type="application/ld+json"\n      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}\n    />\n  );\n}\n
