import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "dns-lookup",
  name: "DNS lookup",
  tagline: "Query A, AAAA, MX, TXT, CNAME, and CAA over DNS-over-HTTPS.",
  description:
    "Free DNS lookup. Ask Cloudflare or Google for A, AAAA, MX, TXT, CNAME, and CAA records, and read SPF and DMARC from the TXT answers. Queries run on the server. Private names are refused.",
  category: "dns",
  tags: ["dns", "network"],
  keywords: ["dns lookup", "mx lookup", "dmarc lookup", "spf check"],
  status: "new",
  createdAt: "2026-10-18",
  updatedAt: "2026-10-18",
  icon: "Globe",
  related: ["http-headers-checker", "ssl-checker", "ip-cidr-calculator", "url-codec"],
  faqs: [
    { q: "Which resolvers are used?", a: "Cloudflare (1.1.1.1) or Google (8.8.8.8), over HTTPS. The hostname is not contacted directly." },
    { q: "Does this look up private names?", a: "No. localhost, .local, and .internal are refused. A public resolver would not see those names anyway." },
    { q: "Where do SPF and DMARC come from?", a: "SPF is the TXT record that starts with v=spf1. DMARC is the TXT record at _dmarc.your domain." },
  ],
  seo: {
    title: "DNS lookup — A, MX, TXT, SPF, DMARC",
    description: "Look up DNS records over HTTPS and parse SPF and DMARC. Private hostnames are refused.",
  },
  howTo: [
    { name: "Enter a hostname", text: "Use a name such as example.com. A bare label or a URL is not a DNS query." },
    { name: "Pick records and a resolver", text: "Choose the types you need and Cloudflare or Google." },
    { name: "Read the answers", text: "Each row is type, name, TTL, and data. SPF and DMARC are parsed beside the raw TXT." },
  ],
  inputs: "A public hostname, record types, and a resolver.",
  outputs: "DNS records, response codes, and parsed SPF and DMARC.",
  runsLocally: false,
  badges: ["DoH · SPF · DMARC"],
} satisfies ToolMeta;
