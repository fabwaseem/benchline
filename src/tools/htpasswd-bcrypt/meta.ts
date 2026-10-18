import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "htpasswd-bcrypt",
  name: "Bcrypt hash",
  tagline: "Hash and verify passwords with bcrypt or argon2id. Nothing is stored.",
  description:
    "Free bcrypt and argon2id generator. Hash a password in the browser, copy an htpasswd line, or verify an existing hash. The password is not sent, logged, or stored.",
  category: "crypto",
  tags: ["bcrypt", "argon2", "password"],
  keywords: ["bcrypt generator", "bcrypt hash", "htpasswd bcrypt", "argon2 hash"],
  status: "new",
  createdAt: "2026-10-18",
  updatedAt: "2026-10-18",
  icon: "Lock",
  related: ["password-generator", "hash-generator", "rsa-keypair", "jwt-decoder"],
  faqs: [
    { q: "Does the password leave this browser?", a: "No. Hashing runs in the page. The password is not sent to the server, logged, or stored." },
    { q: "Which bcrypt prefix is this?", a: "New hashes use the $2a$ prefix. Verification also accepts $2b$ and $2y$, which Apache httpd understands." },
    { q: "Why is the cost capped?", a: "Cost runs from 4 to 12 so a hash finishes in the page. 10 is a reasonable default. Higher costs belong on the server that stores the hash." },
  ],
  seo: {
    title: "Bcrypt and argon2 hash generator",
    description: "Create and verify bcrypt and argon2id hashes, including htpasswd lines, in the browser.",
  },
  howTo: [
    { name: "Enter a password", text: "Pick bcrypt or argon2id. Add a username if you want an htpasswd line." },
    { name: "Hash or verify", text: "Hash creates a new string. Verify checks a hash you paste against the password." },
    { name: "Copy the line", text: "The hash stays on this device. Clear the password when you are done." },
  ],
  inputs: "A password, bcrypt or argon2id settings, an optional username, and an optional hash to verify.",
  outputs: "A bcrypt or argon2id hash, an htpasswd line, and a match result.",
  runsLocally: true,
  badges: ["In the browser"],
} satisfies ToolMeta;
