import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "http-headers-checker",
  name: "HTTP headers",
  tagline: "Follow redirects and grade the security headers on a public URL.",
  description:
    "Free HTTP header checker. Fetch a public URL, list the redirect chain, and grade HSTS, Content-Security-Policy, framing, nosniff, and Referrer-Policy. Private addresses are refused. The body is discarded.",
  category: "http",
  tags: ["http", "headers", "security"],
  keywords: ["check http headers", "security headers", "hsts checker"],
  status: "new",
  createdAt: "2026-10-18",
  updatedAt: "2026-10-18",
  icon: "Waypoints",
  related: ["ssl-checker", "csp-generator", "dns-lookup", "meta-tags-inspector"],
  faqs: [
    { q: "What does the grade measure?", a: "HSTS on HTTPS, Content-Security-Policy, framing, X-Content-Type-Options, and Referrer-Policy. Missing ones lower the grade. A server banner is a warning." },
    { q: "Are redirects followed?", a: "Yes, up to four hops, and only to public http and https URLs on ports 80 and 443." },
    { q: "Is the page body stored?", a: "No. The check reads response headers and cancels the body." },
  ],
  seo: {
    title: "HTTP headers and security header checker",
    description: "Inspect response headers, the redirect chain, and a grade for HSTS, CSP, and related headers.",
  },
  howTo: [
    { name: "Enter a public URL", text: "A bare domain is treated as HTTPS. Local and private addresses are refused." },
    { name: "Read the chain", text: "Each redirect shows the status and the location it pointed at." },
    { name: "Read the grade", text: "The checklist names the header that passed, warned, or failed." },
  ],
  inputs: "A public http or https URL.",
  outputs: "Final status, redirect hops, response headers, a grade, and a checklist.",
  runsLocally: false,
  badges: ["Redirects · Grade"],
} satisfies ToolMeta;
