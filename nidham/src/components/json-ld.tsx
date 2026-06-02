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
      telephone: "+201055356622",
      contactType: "customer service",
      areaServed: "EG",
      availableLanguage: ["Arabic", "English"],
    },
    sameAs: [
      "https://www.facebook.com/profile.php?id=61589810406479",
      "https://wa.me/201055356622",
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
    // NOTE: aggregateRating intentionally omitted. A hardcoded rating (we had
    // a fabricated 4.8/12) violates Google's review-snippet policy and risks a
    // manual action that strips ALL rich results site-wide. Re-add ONLY when
    // wired to real, verifiable reviews (e.g. a reviews table) — never hardcoded.
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
// ── Review (customer testimonials → trust signals for AI) ──
export function ReviewSchema({
  items,
}: {
  items: { author: string; reviewBody: string; ratingValue?: number; datePublished?: string }[];
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Review",
    itemReviewed: {
      "@type": "SoftwareApplication",
      name: "Nidham HR",
      alternateName: "نِظام",
      applicationCategory: "BusinessApplication",
      url: SITE,
    },
    review: items.map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.author },
      reviewBody: r.reviewBody,
      ...(r.ratingValue ? { reviewRating: { "@type": "Rating", ratingValue: r.ratingValue, bestRating: "5" } } : {}),
      ...(r.datePublished ? { datePublished: r.datePublished } : {}),
      publisher: { "@id": `${SITE}/#organization` },
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ── VideoObject (prepares for video content → boosts Gemini/Perplexity visibility) ──
export function VideoObjectSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "@id": `${SITE}/#video`,
    name: "نِظام HR — نظام إدارة موارد بشرية مصري بالذكاء الاصطناعي",
    description:
      "شوف بنفسك ازاي Nidham HR بيحل مشاكل المرتبات والحضور والموظفين في الشركات المصرية. حضور GPS، رواتب آلية، نماذج تأمينات، AI Agent.",
    thumbnailUrl: `${SITE}/api/og?title=${encodeURIComponent("نظام HR مصري بالذكاء الاصطناعي | نِظام")}`,
    uploadDate: "2026-01-01",
    duration: "PT2M",
    publisher: { "@id": `${SITE}/#organization` },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ── LocalBusiness (enhanced organization with physical location) ──
export function LocalBusinessSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${SITE}/#localbusiness`,
    name: "Nidham HR",
    alternateName: "نِظام",
    url: SITE,
    logo: `${SITE}/icon.svg`,
    description:
      "شركة نِظام لتكنولوجيا الموارد البشرية — نظام HR + Payroll + CRM + AI للشركات المصرية.",
    foundingDate: "2026",
    address: [
      {
        "@type": "PostalAddress",
        addressLocality: "دمياط",
        addressRegion: "دمياط",
        addressCountry: "EG",
      },
      {
        "@type": "PostalAddress",
        addressLocality: "القاهرة",
        addressRegion: "القاهرة",
        addressCountry: "EG",
      },
    ],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+201055356622",
      contactType: "customer service",
      areaServed: "EG",
      availableLanguage: ["Arabic", "English"],
    },
    sameAs: [
      "https://www.facebook.com/profile.php?id=61589810406479",
      "https://wa.me/201055356622",
    ],
    priceRange: "$$",
    areaServed: "EG",
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "نظام HR",
      itemListElement: [
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "نظام موارد بشرية (HRMS)" } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "نظام رواتب ومرتبات" } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "نظام حضور وانصراف" } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "نظام CRM" } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "AI Agent للموارد البشرية" } },
      ],
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

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

// ── HowTo (step-by-step rich result for calculator/tool pages) ──
//
// Eligible for the "HowTo" rich result on Google: a numbered, expandable
// step list under the search result. Strong CTR boost for "ازاي احسب..."
// queries that the calculator tools target.
export function HowToSchema({
  name,
  description,
  steps,
}: {
  name: string;
  description: string;
  steps: { name: string; text: string }[];
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name,
    description,
    inLanguage: "ar-EG",
    step: steps.map((s, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: s.name,
      text: s.text,
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
