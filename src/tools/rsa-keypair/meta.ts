import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "rsa-keypair",
  name: "Key pair",
  tagline: "Generate RSA, EC, and Ed25519 keys, and convert PEM and JWK.",
  description:
    "Free key pair generator. Create an RSA, ECDSA, or Ed25519 key in the browser and copy PEM, JWK, and a JWKS. Convert between PEM and JWK. The private key is not sent, logged, or stored.",
  category: "crypto",
  tags: ["rsa", "jwk", "pem", "keys"],
  keywords: ["rsa key generator", "pem to jwk", "ed25519 key generator"],
  status: "new",
  createdAt: "2026-10-18",
  updatedAt: "2026-10-18",
  icon: "Key",
  related: ["jwt-decoder", "htpasswd-bcrypt", "hash-generator", "password-generator"],
  faqs: [
    { q: "Does the private key leave this browser?", a: "No. Generation and conversion run in the page. The private key is not sent, logged, or stored." },
    { q: "Which algorithms are available?", a: "RS256, RS384, RS512, PS256, ES256, ES384, ES512, and Ed25519. RSA sizes are 2048 and 4096." },
    { q: "What is the JWKS for?", a: "It is a key set containing only the public key, which is what a verifier should receive. The private JWK is separate." },
  ],
  seo: {
    title: "RSA, EC, and Ed25519 key generator",
    description: "Generate PEM and JWK key pairs in the browser, and convert between PEM and JWK.",
  },
  howTo: [
    { name: "Choose an algorithm", text: "Ed25519 and ES256 are the short options. RSA needs a modulus of 2048 or 4096." },
    { name: "Generate or paste", text: "Generate a new pair, or paste PEM or JWK to convert." },
    { name: "Copy the public key", text: "Share the public PEM or JWKS. Keep the private PEM off the clipboard until you need it." },
  ],
  inputs: "An algorithm, an RSA size, or a PEM or JWK to convert.",
  outputs: "Public and private PEM, public and private JWK, and a JWKS document.",
  runsLocally: true,
  badges: ["In the browser"],
} satisfies ToolMeta;
