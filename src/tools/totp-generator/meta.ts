import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "totp-generator",
  name: "TOTP authenticator",
  tagline: "Live 2FA codes for your accounts, with otpauth:// import and QR export.",
  description:
    "Free TOTP and HOTP authenticator. Add accounts with a base32 secret, watch live codes tick down with a countdown, copy with one click, and import or export otpauth:// provisioning URIs. Everything runs in the browser; secrets never leave the page.",
  category: "auth",
  tags: ["totp", "2fa", "authenticator", "otp"],
  keywords: ["totp generator", "2fa authenticator", "hotp code", "otpauth uri", "authenticator app"],
  status: "new",
  createdAt: "2026-10-18",
  updatedAt: "2026-10-18",
  icon: "Clock",
  related: ["password-generator", "hash-generator", "jwt-decoder", "qr-code-generator"],
  faqs: [
    { q: "Where are my secrets stored?", a: "In your browser's localStorage, on this device only. Nothing is sent to a server. Clearing site data removes them, so keep a backup of your otpauth:// URIs." },
    { q: "Which algorithms and settings are supported?", a: "TOTP and HOTP with 6 or 8 digits, periods of 15, 30, or 60 seconds, and SHA1, SHA256, or SHA512. Defaults match Google Authenticator: 6 digits, 30 seconds, SHA1." },
    { q: "How do I move an account from another authenticator?", a: "Export shows each account as an otpauth:// URI. Many apps let you view the QR code or URI for an account; paste it into the import box here." },
    { q: "Why is my code rejected?", a: "TOTP codes depend on the clock. Make sure your device time is correct and automatic. Also check the digits, period, and algorithm match the service." },
  ],
  seo: {
    title: "TOTP authenticator",
    description: "Generate live TOTP and HOTP 2FA codes in the browser. Import otpauth:// URIs, show provisioning QR codes, export backups.",
  },
  howTo: [
    { name: "Add an account", text: "Enter the label, the base32 secret, and the digits, period, and algorithm. Or paste an otpauth:// URI into the import box." },
    { name: "Read the live code", text: "Codes refresh every period. The bar shows how long the current code stays valid." },
    { name: "Back up", text: "Use Export to download your accounts as otpauth:// URIs before clearing site data." },
  ],
  inputs: "Account label, base32 secret, digits (6/8), period, algorithm, TOTP/HOTP mode, or otpauth:// URIs to import.",
  outputs: "Live one-time codes with countdown, provisioning QR codes, and exportable otpauth:// URIs.",
  runsLocally: true,
  badges: ["RFC 6238 · WebCrypto"],
} satisfies ToolMeta;
