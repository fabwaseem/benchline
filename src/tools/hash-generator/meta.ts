import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "hash-generator",
  name: "Hash generator",
  tagline: "MD5, SHA-1, SHA-256, and SHA-512 checksums for text or a file, with HMAC.",
  description:
    "Free SHA-256 and MD5 hash generator. Checksum text or a file with MD5, SHA-1, SHA-256, and SHA-512, copy hex or base64, compare an expected digest, and compute HMAC. The bytes stay in the browser.",
  category: "crypto",
  tags: ["hash", "sha256", "md5", "checksum"],
  keywords: ["sha256 generator", "md5 hash", "file checksum", "hmac generator"],
  status: "new",
  createdAt: "2026-10-18",
  updatedAt: "2026-10-18",
  icon: "Hash",
  related: ["password-generator", "jwt-decoder", "uuid-generator", "unix-timestamp"],
  faqs: [
    { q: "Which hash should I use for a file checksum?", a: "SHA-256 is the usual choice. SHA-512 is fine too. MD5 and SHA-1 still show up in older manifests, but they are not collision-resistant." },
    { q: "Is the file uploaded?", a: "No. The browser reads the file and hashes it locally. Nothing is posted." },
    { q: "What is HMAC?", a: "HMAC mixes the message with a secret key before hashing. The same text and the same key always produce the same digest. A plain checksum has no key." },
    { q: "Can I check a published checksum?", a: "Yes. Paste the expected hex or base64 digest. The matching algorithm is marked, and spaces or colons in the hex are ignored." },
  ],
  seo: {
    title: "MD5 and SHA-256 hash generator",
    description: "Generate MD5, SHA-1, SHA-256, and SHA-512 checksums for text or a file, plus HMAC. Compare an expected digest in the browser.",
  },
  howTo: [
    { name: "Paste text or drop a file", text: "Text is hashed as UTF-8. A file is hashed as its raw bytes." },
    { name: "Add an HMAC key only if you need one", text: "Leave the key empty for a plain checksum. A key switches every algorithm to HMAC." },
    { name: "Copy the digest or compare it", text: "Each algorithm is shown in hex and base64. Paste an expected checksum to see which one matches." },
  ],
  inputs: "UTF-8 text or a file, an optional HMAC key, and an optional expected digest.",
  outputs: "MD5, SHA-1, SHA-256, and SHA-512 in hex and base64, plus the algorithms that match an expected digest.",
  runsLocally: true,
  badges: ["MD5 · SHA-1 · SHA-256 · SHA-512"],
} satisfies ToolMeta;
