import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "aes-crypto",
  name: "AES encryption",
  tagline: "AES-GCM encrypt and decrypt in the browser, nothing uploaded.",
  description:
    "Free AES encryption playground. Encrypt text with AES-256-GCM: the key is derived from your passphrase with PBKDF2-SHA256, and a fresh random salt and IV are generated every time. Decrypt a bundle back to plaintext. Everything runs locally with WebCrypto.",
  category: "crypto",
  tags: ["aes", "encryption", "crypto"],
  keywords: ["aes encryption", "aes gcm online", "encrypt text", "aes decrypt", "pbkdf2"],
  status: "new",
  createdAt: "2026-10-18",
  updatedAt: "2026-10-18",
  icon: "Lock",
  related: ["password-generator", "hash-generator", "rsa-keypair", "base64-codec"],
  faqs: [
    { q: "How is the key made from my passphrase?", a: "PBKDF2 with SHA-256 stretches your passphrase into a 256-bit key. More iterations means slower brute force; 100,000 is the default and the minimum is 10,000." },
    { q: "What is inside the bundle?", a: "Base64 of a small JSON object: a version, the iteration count, the random salt, the random IV, and the ciphertext. The passphrase itself is never stored." },
    { q: "Is my text sent anywhere?", a: "No. Encryption and decryption run in this page with WebCrypto. The bundle only leaves if you copy it." },
    { q: "Why did decryption fail?", a: "Either the passphrase is wrong or the bundle was changed. AES-GCM authenticates the data, so tampering is detected instead of producing garbage." },
  ],
  seo: {
    title: "AES encryption",
    description: "Encrypt and decrypt text with AES-256-GCM in the browser. PBKDF2-SHA256 key derivation, random salt and IV per encryption.",
  },
  howTo: [
    { name: "Encrypt", text: "Type the plaintext and a passphrase, pick the PBKDF2 iterations, and press Encrypt. Copy the base64 bundle." },
    { name: "Decrypt", text: "Switch to Decrypt, paste the bundle and the same passphrase, and press Decrypt." },
    { name: "Keep the passphrase", text: "There is no recovery. Without the exact passphrase the bundle cannot be opened." },
  ],
  inputs: "Plaintext or a base64 bundle, a passphrase, and a PBKDF2 iteration count.",
  outputs: "A base64 bundle (version, iterations, salt, IV, ciphertext) or the decrypted plaintext.",
  runsLocally: true,
  badges: ["AES-256-GCM · WebCrypto"],
} satisfies ToolMeta;
