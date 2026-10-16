export const schemaTypes = [
  "Article",
  "BlogPosting",
  "FAQPage",
  "HowTo",
  "Product",
  "Organization",
  "Person",
  "LocalBusiness",
  "BreadcrumbList",
  "SoftwareApplication",
  "WebSite",
  "Event",
] as const;

export type SchemaType = (typeof schemaTypes)[number];
export type FieldValue = string | { q?: string; a?: string; name?: string; text?: string; url?: string }[];
export type SchemaValues = Record<string, FieldValue>;

export type SchemaCheck = { level: "pass" | "warn" | "fail"; label: string; detail: string };

const iso = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?(Z|[+-]\d{2}:\d{2})?)?$/;

export function exampleValues(type: SchemaType): SchemaValues {
  const shared = {
    Article: { headline: "How a bench stays precise", description: "A short article.", image: "https://example.com/cover.png", datePublished: "2026-10-16", author: "Waseem Anjum", url: "https://example.com/article" },
    BlogPosting: { headline: "Notes from the bench", description: "A blog post.", image: "https://example.com/cover.png", datePublished: "2026-10-16", author: "Waseem Anjum", url: "https://example.com/blog/notes" },
    FAQPage: { name: "Benchline FAQ", faqs: [{ q: "Does it store the page?", a: "No." }] },
    HowTo: { name: "Ship a Dockerfile", description: "Three steps.", steps: [{ name: "Pick Node", text: "Choose 22." }, { name: "Build", text: "docker build ." }] },
    Product: { name: "Bench lamp", description: "A small lamp.", price: "48", currency: "USD", brand: "Benchline", ratingValue: "4.8", ratingCount: "12", url: "https://example.com/lamp" },
    Organization: { name: "Benchline", url: "https://tools.fabwaseem.com", logo: "https://tools.fabwaseem.com/icon", sameAs: "https://github.com/fabwaseem" },
    Person: { name: "Waseem Anjum", jobTitle: "Engineer", url: "https://example.com" },
    LocalBusiness: { name: "Bench Studio", street: "1 Paper Street", city: "Lahore", hours: "Mo-Fr 09:00-17:00", url: "https://example.com" },
    BreadcrumbList: { items: [{ name: "Home", url: "https://example.com" }, { name: "Tools", url: "https://example.com/tools" }] },
    SoftwareApplication: { name: "Benchline", operatingSystem: "Web", category: "DeveloperApplication", url: "https://tools.fabwaseem.com" },
    WebSite: { name: "Benchline", url: "https://tools.fabwaseem.com", searchUrl: "https://tools.fabwaseem.com/?q={search_term_string}" },
    Event: { name: "Bench hours", startDate: "2026-11-01T09:00:00Z", location: "Lahore", url: "https://example.com/event" },
  } as const;
  return shared[type] as SchemaValues;
}

export function buildSchema(type: SchemaType, values: SchemaValues): Record<string, unknown> {
  const text = (key: string) => (typeof values[key] === "string" ? values[key].trim() : "");
  const clean = (record: Record<string, unknown>) => {
    for (const [key, value] of Object.entries(record)) {
      if (value === "" || value === undefined || value === null || (Array.isArray(value) && value.length === 0)) delete record[key];
    }
    return record;
  };
  if (type === "Article" || type === "BlogPosting") {
    return clean({
      "@context": "https://schema.org",
      "@type": type,
      headline: text("headline"),
      description: text("description"),
      image: text("image"),
      datePublished: text("datePublished"),
      author: text("author") ? { "@type": "Person", name: text("author") } : undefined,
      url: text("url"),
    });
  }
  if (type === "FAQPage") {
    const faqs = Array.isArray(values.faqs) ? values.faqs : [];
    return clean({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      name: text("name"),
      mainEntity: faqs
        .filter((item) => item.q && item.a)
        .map((item) => ({ "@type": "Question", name: item.q, acceptedAnswer: { "@type": "Answer", text: item.a } })),
    });
  }
  if (type === "HowTo") {
    const steps = Array.isArray(values.steps) ? values.steps : [];
    return clean({
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: text("name"),
      description: text("description"),
      step: steps.filter((item) => item.name || item.text).map((item, index) => ({ "@type": "HowToStep", position: index + 1, name: item.name, text: item.text })),
    });
  }
  if (type === "Product") {
    const offer = text("price") ? { "@type": "Offer", price: text("price"), priceCurrency: text("currency") || "USD" } : undefined;
    const rating = text("ratingValue") ? { "@type": "AggregateRating", ratingValue: text("ratingValue"), reviewCount: text("ratingCount") } : undefined;
    return clean({
      "@context": "https://schema.org",
      "@type": "Product",
      name: text("name"),
      description: text("description"),
      brand: text("brand") ? { "@type": "Brand", name: text("brand") } : undefined,
      url: text("url"),
      offers: offer,
      aggregateRating: rating,
    });
  }
  if (type === "Organization" || type === "Person" || type === "LocalBusiness") {
    const sameAs = text("sameAs").split(/\s+/).filter(Boolean);
    return clean({
      "@context": "https://schema.org",
      "@type": type,
      name: text("name"),
      url: text("url"),
      logo: text("logo"),
      jobTitle: text("jobTitle"),
      address: text("street") ? { "@type": "PostalAddress", streetAddress: text("street"), addressLocality: text("city") } : undefined,
      openingHours: text("hours"),
      sameAs: sameAs.length ? sameAs : undefined,
    });
  }
  if (type === "BreadcrumbList") {
    const items = Array.isArray(values.items) ? values.items : [];
    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: items.filter((item) => item.name).map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.name, item: item.url })),
    };
  }
  if (type === "SoftwareApplication") {
    return clean({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: text("name"),
      operatingSystem: text("operatingSystem"),
      applicationCategory: text("category"),
      url: text("url"),
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    });
  }
  if (type === "WebSite") {
    return clean({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: text("name"),
      url: text("url"),
      potentialAction: text("searchUrl")
        ? { "@type": "SearchAction", target: text("searchUrl"), "query-input": "required name=search_term_string" }
        : undefined,
    });
  }
  return clean({
    "@context": "https://schema.org",
    "@type": "Event",
    name: text("name"),
    startDate: text("startDate"),
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: text("location") ? { "@type": "Place", name: text("location") } : undefined,
    url: text("url"),
  });
}

export function validateSchema(type: SchemaType, values: SchemaValues): SchemaCheck[] {
  const data = buildSchema(type, values);
  const checks: SchemaCheck[] = [];
  const requireText = (label: string, present: boolean) => {
    checks.push({ level: present ? "pass" : "fail", label, detail: present ? "Present." : "Required." });
  };
  if (type === "Article" || type === "BlogPosting") {
    requireText("headline", Boolean(data.headline));
    checks.push({ level: data.image ? "pass" : "warn", label: "image", detail: data.image ? "Present." : "Google recommends an image." });
    checks.push(dateCheck("datePublished", typeof data.datePublished === "string" ? data.datePublished : ""));
    checks.push({ level: data.author ? "pass" : "warn", label: "author", detail: data.author ? "Present." : "Recommended." });
  } else if (type === "FAQPage") {
    const count = Array.isArray(data.mainEntity) ? data.mainEntity.length : 0;
    requireText("At least one question", count > 0);
  } else if (type === "HowTo") {
    requireText("name", Boolean(data.name));
    requireText("steps", Array.isArray(data.step) && data.step.length > 0);
  } else if (type === "Product") {
    requireText("name", Boolean(data.name));
    requireText("offers, review, or rating", Boolean(data.offers || data.aggregateRating));
    if (typeof values.url === "string" && values.url) checks.push(urlCheck(values.url));
  } else if (type === "BreadcrumbList") {
    requireText("items", Array.isArray(data.itemListElement) && data.itemListElement.length > 0);
  } else if (type === "Event") {
    requireText("name", Boolean(data.name));
    checks.push(dateCheck("startDate", typeof data.startDate === "string" ? data.startDate : ""));
  } else {
    requireText("name", Boolean(data.name));
    if (type === "WebSite" || type === "Organization" || type === "LocalBusiness") {
      checks.push(urlCheck(typeof data.url === "string" ? data.url : ""));
    }
  }
  return checks;
}

function dateCheck(label: string, value: string): SchemaCheck {
  if (!value) return { level: "warn", label, detail: "Recommended, as an ISO date." };
  return iso.test(value) ? { level: "pass", label, detail: "ISO date." } : { level: "fail", label, detail: "Use an ISO date such as 2026-10-16." };
}

function urlCheck(value: string): SchemaCheck {
  if (!value) return { level: "warn", label: "url", detail: "Recommended." };
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:"
      ? { level: "pass", label: "url", detail: "Absolute URL." }
      : { level: "fail", label: "url", detail: "Use http or https." };
  } catch {
    return { level: "fail", label: "url", detail: "Not a valid URL." };
  }
}

export function scriptTag(data: unknown) {
  const json = JSON.stringify(data, null, 2).replace(/</g, "\\u003c");
  return `<script type="application/ld+json">\n${json}\n</script>\n`;
}

export function nextSnippet(data: unknown) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return `<script\n  type="application/ld+json"\n  dangerouslySetInnerHTML={{ __html: JSON.stringify(${json}).replace(/</g, "\\\\u003c") }}\n/>\n`;
}

export function graphOf(entities: Record<string, unknown>[]) {
  const graph = entities.map((entity) => {
    const copy = { ...entity };
    delete copy["@context"];
    return copy;
  });
  return { "@context": "https://schema.org", "@graph": graph };
}
