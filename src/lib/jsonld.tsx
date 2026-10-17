import { toolCover } from "@/lib/assets";
import { absoluteUrl, SITE_NAME, SITE_URL } from "@/lib/site";
import type { ToolMeta } from "@/registry/schema";

export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

export function toolGraph(tool: ToolMeta, categoryName: string) {
  const url = absoluteUrl(`/t/${tool.slug}`);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["SoftwareApplication", "WebApplication"],
        "@id": `${url}#app`,
        name: tool.name,
        description: tool.description,
        url,
        applicationCategory: "DeveloperApplication",
        applicationSubCategory: categoryName,
        operatingSystem: "Web",
        browserRequirements: "Requires a modern browser",
        isAccessibleForFree: true,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
        },
        image: absoluteUrl(toolCover(tool.slug)),
        author: { "@id": `${SITE_URL}#organization` },
        publisher: { "@id": `${SITE_URL}#organization` },
        provider: { "@id": `${SITE_URL}#organization` },
        isPartOf: { "@id": `${SITE_URL}#website` },
      },
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        url,
        mainEntity: tool.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.q,
          acceptedAnswer: { "@type": "Answer", text: faq.a },
        })),
      },
      {
        "@type": "HowTo",
        "@id": `${url}#howto`,
        name: `How to use ${tool.name}`,
        description: tool.description,
        totalTime: "PT2M",
        step: tool.howTo.map((step, index) => ({
          "@type": "HowToStep",
          position: index + 1,
          name: step.name,
          text: step.text,
          url: `${url}#how-to`,
        })),
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: categoryName, item: absoluteUrl(`/${tool.category}`) },
          { "@type": "ListItem", position: 3, name: tool.name, item: url },
        ],
      },
    ],
  };
}

export function collectionGraph(input: {
  url: string;
  name: string;
  description: string;
  items: { name: string; url: string }[];
}) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${input.url}#collection`,
        url: input.url,
        name: input.name,
        description: input.description,
        isPartOf: { "@id": `${SITE_URL}#website` },
      },
      {
        "@type": "ItemList",
        "@id": `${input.url}#list`,
        name: input.name,
        itemListElement: input.items.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          url: item.url,
        })),
      },
      websiteNode(),
    ],
  };
}

export function websiteNode() {
  return {
    "@type": "WebSite",
    "@id": `${SITE_URL}#website`,
    url: SITE_URL,
    name: SITE_NAME,
    description: "A precise bench of developer tools for AI search, SEO, and shipping Next.js.",
    publisher: { "@id": `${SITE_URL}#organization` },
  };
}
