import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "csp-generator",
  name: "CSP builder",
  tagline: "Build a Content-Security-Policy and a Next.js headers snippet.",
  description:
    "Free Content-Security-Policy generator. Fill in directives or paste a policy, then copy the header and a next.config headers() snippet. Warnings call out wildcards, unsafe-inline, and a missing object-src or frame-ancestors.",
  category: "headers",
  tags: ["csp", "headers"],
  keywords: ["csp generator", "content security policy generator"],
  status: "new",
  createdAt: "2026-10-18",
  updatedAt: "2026-10-18",
  icon: "Shield",
  related: ["http-headers-checker", "nextjs-dockerfile-generator", "meta-tags-inspector", "robots-txt-checker"],
  faqs: [
    { q: "Does this publish the header?", a: "No. It writes the header line and a Next.js config snippet. You add that snippet to the app that serves the page." },
    { q: "Why warn on unsafe-inline?", a: "It allows inline scripts or styles, which is how many XSS bugs run. A nonce or a hash is tighter for scripts." },
    { q: "What does object-src 'none' do?", a: "It blocks plugin embeds such as Flash and generic object tags. Most sites can set it and notice nothing." },
  ],
  seo: {
    title: "Content-Security-Policy generator",
    description: "Build and lint a Content-Security-Policy header, with a Next.js headers() snippet.",
  },
  howTo: [
    { name: "Start from a preset or paste a policy", text: "Strict blocks by default. The Next.js preset allows what a typical app needs, and the notes say what is loose." },
    { name: "Edit directives", text: "Each field is one directive. Leave a field blank to omit it." },
    { name: "Copy the snippet", text: "The header line and the next.config snippet stay in sync with the fields." },
  ],
  inputs: "CSP directive values, or a policy to parse.",
  outputs: "A policy, a header line, a Next.js headers snippet, and warnings.",
  runsLocally: true,
  badges: ["Header · next.config"],
} satisfies ToolMeta;
