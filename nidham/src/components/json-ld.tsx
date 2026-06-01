// ============================================================================
// JSON-LD structured data helpers
// ============================================================================
//
// Server Components that render <script type="application/ld+json"> tags
// with schema.org markup. Google reads these to power Rich Results
// (org cards, software ratings, FAQ accordions, breadcrumbs, etc.).
//
// Why this matters for Egyptian SaaS ranking:
//   • OrganizationSchema → Google knows "نِظام" is a brand, links to
//     social profiles + logo in the Knowledge Panel
//   • SoftwareApplicationSchema → eligible for product-style results
//     in Google Search ("نظام HR مصري" → rich card with price + rating)
//   • FAQPageSchema → captures Featured Snippets and the People Also
//     Ask box. Doubles CTR for ranking pages.
//   • BreadcrumbListSchema → cleaner site links under the main result

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.nidhamhr.com").replace(/\/$/, "");

// ── Organization (brand identity) ──
export function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE}/#organization`,
    name: "Nidham",
    alternateName: ["نِظام", "نظام", "Nidham HR"],
    url: SITE,
    logo: `${SITE}/icon.svg`,
    description:
      "نظام HR + Payroll + CRM + AI متكامل مبني خصيصاً للسوق المصري. متوافق مع قانون العمل المصري 12/2003 وقانون التأمينات 148/2019.",
    foundingDate: "2026",
    foundingLocation: {
      "@type": "Place",
      name: "Damietta, Egypt",
      address: {
        "@type": "PostalAddress",
        addressCountry: "EG",
        addressRegion: "Damietta",
      },
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+201080053809",
      contactType: "customer service",
      areaServed: "EG",
      availableLanguage: ["Arabic", "English"],
    },
    sameAs: [
      "https://www.facebook.com/profile.php?id=61589810406479",
      "https://wa.me/201080053809",
    ],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ── SoftwareApplication (product card) ──
export function SoftwareApplicationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${SITE}/#software`,
    name: "Nidham HR",
    alternateName: "نِظام",
    operatingSystem: "Web, iOS, Android (PWA)",
    applicationCategory: "BusinessApplication",
    applicationSubCategory: "HumanResourcesSoftware",
    description:
      "نظام HR + Payroll + CRM + AI شامل للشركات المصرية. متوافق مع قانون العمل 12/2003 والتأمينات 148/2019. إدارة موظفين، حضور GPS، مرتبات، إجازات، توقيع إلكتروني، واتساب بوت.",
    url: SITE,
    image: `${SITE}/api/og?title=${encodeURIComponent("نظام HR و Payroll و AI للشركات المصرية")}`,
    offers: [
      {
        "@type": "Offer",
        name: "Free Plan",
        price: "0",
        priceCurrency: "EGP",
        priceValidUntil: "2027-12-31",
        availability: "https://schema.org/InStock",
        description: "حتى 5 موظفين · مجاني للأبد",
      },
      {
        "@type": "Offer",
        name: "Starter Plan",
        price: "500",
        priceCurrency: "EGP",
        priceValidUntil: "2027-12-31",
        availability: "https://schema.org/InStock",
        description: "حتى 25 موظف · شهري",
      },
      {
        "@type": "Offer",
        name: "Pro Plan",
        price: "1500",
        priceCurrency: "EGP",
        priceValidUntil: "2027-12-31",
        availability: "https://schema.org/InStock",
        description: "حتى 100 موظف · شهري · يشمل AI Assistant + WhatsApp Bot",
      },
      {
        "@type": "Offer",
        name: "Business Plan",
        price: "3500",
        priceCurrency: "EGP",
        priceValidUntil: "2027-12-31",
        availability: "https://schema.org/InStock",
        description: "حتى 500 موظف · شهري",
      },
    ],
    featureList: [
      "إدارة الموظفين الكاملة",
      "حساب المرتبات والتأمينات والضرايب (قانون 148/2019)",
      "حضور GPS + سيلفي + Geofencing",
      "ربط أجهزة ZKTeco / Hikvision",
      "إدارة الإجازات والورديات",
      "9 نماذج رسمية (1, 2, 6) للتأمينات والضرايب",
      "المساعد الذكي AI بالعربي",
      "بوت واتساب للموظفين",
      "التوقيع الإلكتروني على العقود",
      "إدارة العملاء (CRM) مع Pipeline",
      "استوديو تسويق بالذكاء الاصطناعي (Enterprise)",
      "فحص السير الذاتية بالـ AI",
      "Bridge Analytics (HR + CRM)",
      "تقارير وتحليلات متقدمة",
      "Audit Log + تشفير AES-256",
      "متوافق مع PDPL 151/2020",
    ],
    inLanguage: ["ar", "en"],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "12",
      bestRating: "5",
      worstRating: "1",
    },
    publisher: { "@id": `${SITE}/#organization` },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ── WebSite (sitelinks search box) ──
export function WebsiteSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE}/#website`,
    url: SITE,
    name: "نِظام · Nidham HR",
    description:
      "نظام HR + Payroll + AI متكامل للشركات المصرية - متوافق مع قانون العمل والتأمينات",
    publisher: { "@id": `${SITE}/#organization` },
    inLanguage: "ar-EG",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ── FAQ Page (Featured Snippets + People Also Ask) ──
export function FAQPageSchema({
  questions,
}: {
  questions: { question: string; answer: string }[];
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: q.answer,
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

// ── BlogPosting (Article rich result for /blog/[slug]) ──
//
// Triggers the Article-style search result with author, publish date, and
// the "Top stories" carousel eligibility. Per Google's policy, this needs:
//   • headline (≤ 110 chars)
//   • datePublished + dateModified in ISO-8601
//   • author with @type Person (NOT just a string)
//   • publisher referencing OrganizationSchema via @id
//
// We don't include `image` here because we don't have post-specific OG
// images yet — when we do, add it via the `image` prop (absolute URL).
export function BlogPostingSchema({
  slug,
  title,
  description,
  author,
  publishedAt,
  updatedAt,
  tags,
  image,
}: {
  slug: string;
  title: string;
  description: string;
  author: string;
  publishedAt: string;
  updatedAt: string;
  tags?: string[];
  image?: string;
}) {
  const url = `${SITE}/blog/${slug}`;
  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#blogposting`,
    headline: title,
    description,
    url,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    datePublished: publishedAt,
    dateModified: updatedAt,
    author: {
      "@type": "Person",
      name: author,
    },
    publisher: {
      "@id": `${SITE}/#organization`,
    },
    inLanguage: "ar-EG",
    ...(image ? { image: image.startsWith("http") ? image : `${SITE}${image}` } : {}),
    ...(tags && tags.length > 0 ? { keywords: tags.join(", ") } : {}),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ── Breadcrumb (cleaner search result presentation) ──
export function BreadcrumbSchema({
  items,
}: {
  items: { name: string; url: string }[];
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${SITE}${item.url}`,
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
