import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "jwt-decoder",
  name: "JWT decoder",
  tagline: "Paste a JSON Web Token, read the claims, and verify the signature in the browser.",
  description:
    "Decode a JWT and verify HS, RS, PS, ES, and EdDSA signatures in the browser. The token and keys are not uploaded.",
  category: "auth",
  tags: ["jwt", "auth"],
  keywords: ["JWT decoder", "JWT verify", "JSON Web Token", "JWKS", "base64url"],
  status: "stable",
  createdAt: "2026-04-01",
  updatedAt: "2026-10-16",
  icon: "KeyRound",
  related: ["meta-tags-inspector", "cron-expression-builder", "schema-generator", "ai-seo-checker"],
  faqs: [
    { q: "Does this verify the signature?", a: "Yes. Verification runs in the browser with the jose library. HMAC algorithms use the secret you paste. RSA, RSA-PSS, ECDSA, and EdDSA use a public key in PEM, JWK, or JWKS form, matched by kid when the header has one." },
    { q: "Is the token sent to a server?", a: "No. Decoding, verification, and signing stay in the browser. The token and keys are not posted and they are not stored." },
    { q: "What does alg none mean?", a: "The header says the token has no signature algorithm. Anyone can edit the payload. An app should reject alg none instead of treating the payload as trusted." },
    { q: "Can I create a token here?", a: "Yes. The Encode tab signs a header and payload with HS256, HS384, or HS512. Asymmetric signing needs a private key, and this page does not ask for one." },
    { q: "Can I decode an encrypted token?", a: "No. An encrypted JWE has five segments and the payload stays ciphertext without the key. This page only reads a signed JWT, which has three segments." },
  ],
  seo: {
    title: "JWT decoder",
    description: "Decode a JWT and verify HS, RS, PS, ES, and EdDSA signatures in the browser. The token and keys are not uploaded.",
  },
  howTo: [
    { name: "Paste the token", text: "Copy a JWT from an Authorization header, a cookie, or a session. A Bearer prefix is stripped." },
    { name: "Add the secret or public key", text: "HS256, HS384, and HS512 use a shared secret. RS, PS, ES, and EdDSA use a public key as PEM, a JWK, or a JWKS document." },
    { name: "Read the checks", text: "A verified badge means the signature matches. exp, nbf, and iat are shown as a relative phrase and a UTC time." },
  ],
  inputs: "A signed JWT, plus an optional HMAC secret or public key.",
  outputs: "Header JSON, payload JSON, claim times, and a signature result. An encode tab signs test tokens.",
  runsLocally: true,
  badges: ["HS · RS · PS · ES · EdDSA"],
} satisfies ToolMeta;
