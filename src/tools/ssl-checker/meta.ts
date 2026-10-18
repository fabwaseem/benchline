import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "ssl-checker",
  name: "SSL checker",
  tagline: "Expiry, names, and the chain for a certificate on port 443.",
  description:
    "Free SSL certificate checker. Connect to a public host on port 443 and report days until expiry, the subject, issuer, subject alternative names, protocol, and chain. Private addresses are refused.",
  category: "tls",
  tags: ["ssl", "tls"],
  keywords: ["ssl checker", "certificate expiry", "tls checker"],
  status: "new",
  createdAt: "2026-10-18",
  updatedAt: "2026-10-18",
  icon: "ShieldCheck",
  related: ["http-headers-checker", "dns-lookup", "csp-generator", "url-codec"],
  faqs: [
    { q: "Which port is checked?", a: "Only 443. The check opens a TLS socket from the server. It does not download the page." },
    { q: "What if the certificate is not trusted?", a: "The handshake still completes so you can read the certificate. Trust is reported separately from the dates and names." },
    { q: "Are private hosts allowed?", a: "No. Loopback, private, and link-local addresses are refused before the socket opens." },
  ],
  seo: {
    title: "SSL certificate checker",
    description: "Check a public host's TLS certificate: expiry, subject alternative names, protocol, and chain.",
  },
  howTo: [
    { name: "Enter a hostname", text: "example.com or https://example.com. Anything other than port 443 is refused." },
    { name: "Read the dates", text: "Days remaining is counted from the not-after date. Under 14 days fails the grade." },
    { name: "Read the names", text: "The checklist says whether the hostname is covered by a subject alternative name." },
  ],
  inputs: "A public hostname or HTTPS URL.",
  outputs: "Subject, issuer, validity, names, protocol, chain, and a grade.",
  runsLocally: false,
  badges: ["Port 443"],
} satisfies ToolMeta;
