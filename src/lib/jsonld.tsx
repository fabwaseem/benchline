import { toolCover } from "@/lib/assets";
import { FOUNDER } from "@/lib/founder";
import { absoluteUrl, GITHUB_URL, SITE_NAME, SITE_URL } from "@/lib/site";
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

export function toolGraph(
  tool: ToolMeta,
  categoryName: string,
  crumbs?: { name: string; href: string }[],
) {
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
        screenshot: absoluteUrl(toolCover(tool.slug)),
        keywords: tool.keywords.join(", "),
        featureList: [tool.tagline, `Input: ${tool.inputs}`, `Output: ${tool.outputs}`, ...(tool.badges ?? [])],
        datePublished: tool.createdAt,
        dateModified: tool.updatedAt,
        inLanguage: "en",
        mainEntityOfPage: url,
        author: { "@id": FOUNDER_ID },
        creator: { "@id": FOUNDER_ID },
        publisher: { "@id": `${SITE_URL}#organization` },
        provider: { "@id": `${SITE_URL}#organization` },
        isPartOf: { "@id": `${SITE_URL}#website` },
        potentialAction: { "@type": "UseAction", target: url },
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
          ...(crumbs ?? [{ name: categoryName, href: `/${tool.category}` }]).map((crumb, index) => ({
            "@type": "ListItem",
            position: index + 2,
            name: crumb.name,
            item: absoluteUrl(crumb.href),
          })),
          {
            "@type": "ListItem",
            position: (crumbs?.length ?? 1) + 2,
            name: tool.name,
            item: url,
          },
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

export const FOUNDER_ID = `${SITE_URL}#founder`;

export function websiteNode() {
  return {
    "@type": "WebSite",
    "@id": `${SITE_URL}#website`,
    url: SITE_URL,
    name: SITE_NAME,
    description: "Free browser tools for PDF, images, JSON, security, and SEO. Files stay on your device, and every tool is callable over MCP.",
    inLanguage: "en",
    publisher: { "@id": `${SITE_URL}#organization` },
    creator: { "@id": FOUNDER_ID },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/tools?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

export function organizationNode() {
  return {
    "@type": "Organization",
    "@id": `${SITE_URL}#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: { "@type": "ImageObject", url: `${SITE_URL}/app-icon-512.png`, width: 512, height: 512 },
    founder: { "@id": FOUNDER_ID },
    sameAs: [GITHUB_URL],
  };
}

export function founderNode() {
  return {
    "@type": "Person",
    "@id": FOUNDER_ID,
    name: FOUNDER.name,
    jobTitle: FOUNDER.jobTitle,
    description: FOUNDER.bio,
    url: FOUNDER.url,
    sameAs: [...FOUNDER.sameAs],
    worksFor: { "@id": `${SITE_URL}#organization` },
  };
}
