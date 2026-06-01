function JsonLd({ schema }: { schema: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}

export interface BlogSchemaProps {
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
    description,
    image: image || "/og-local.png",
    author: { "@type": "Person", name: author },
    datePublished,
    dateModified: dateModified || datePublished,
    url,
    articleBody: content ? (content.length > 500 ? content.slice(0, 500) + "..." : content) : undefined,
    keywords: keywords.join(", "),
    inLanguage: "ar",
    publisher: {
      "@type": "Organization",
      name: "Nidham HR",
      logo: { "@type": "ImageObject", url: "/logo.png" },
    },
  };

  return <JsonLd schema={schema} />;
}

export function FAQSchemaMarkup({ faqs }: { faqs: Array<{ question: string; answer: string }> }) {
  return (
    <JsonLd
      schema={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
      }}
    />
  );
}

export function BreadcrumbSchemaMarkup({ items }: { items: Array<{ name: string; url: string }> }) {
  return (
    <JsonLd
      schema={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          item: item.url,
        })),
      }}
    />
  );
}

export function ArticleSchemaMarkup({
  title,
  description,
  image,
  author,
  datePublished,
  dateModified,
  url,
  wordCount,
  articleSection,
  keywords,
}: {
  title: string;
  description: string;
  image?: string;
  author: string;
  datePublished: string;
  dateModified?: string;
  url: string;
  wordCount?: number;
  articleSection?: string;
  keywords?: string[];
}) {
  return (
    <JsonLd
      schema={{
        "@context": "https://schema.org",
        "@type": "Article",
        headline: title,
        description,
        image: image || "/og-local.png",
        author: { "@type": "Person", name: author },
        datePublished,
        dateModified: dateModified || datePublished,
        url,
        wordCount,
        articleSection: articleSection || "HR",
        keywords: keywords?.join(", ") || "",
        inLanguage: "ar",
      }}
    />
  );
}
