import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "pdf-protect-unlock",
  name: "Protect PDF",
  tagline: "Add an AES password, or unlock a PDF when you already know the password.",
  description:
    "Free protect and unlock PDF tool. Set a user password and optional owner password, and choose print, copy, and edit permissions. Unlock writes a copy that opens without the password. The password has to be one you know. The file stays in this browser.",
  category: "pdf",
  tags: ["pdf", "password"],
  keywords: ["protect pdf", "unlock pdf", "pdf password"],
  status: "new",
  createdAt: "2026-10-18",
  updatedAt: "2026-10-18",
  icon: "Lock",
  related: ["pdf-merge", "pdf-compress", "pdf-split", "pdf-rotate-organize"],
  faqs: [
    { q: "Can this remove a password I do not know?", a: "No. Unlock only works with the password that already opens the file." },
    { q: "What encryption is used?", a: "AES-256. The user password opens the file. The owner password is the same unless you set a different one." },
    { q: "Is the PDF uploaded?", a: "No. Encryption and decryption run in this browser." },
    { q: "Can I protect a file that already has a password?", a: "Unlock it first, then protect the unlocked copy." },
  ],
  seo: {
    title: "Protect or Unlock a PDF",
    description: "Add an AES-256 password to a PDF, or unlock one when you know the password. The file stays in the browser.",
  },
  howTo: [
    { name: "Add a PDF", text: "Drop one PDF. It stays in this browser." },
    { name: "Choose protect or unlock", text: "Enter the user password. For protect, set permissions and an optional owner password." },
    { name: "Download", text: "Protect downloads an encrypted PDF. Unlock downloads a copy that opens without a password." },
  ],
  inputs: "One PDF, protect or unlock, a password you know, and optional permissions.",
  outputs: "A PDF. Protect marks it encrypted. Unlock removes the password.",
  runsLocally: true,
  badges: ["AES-256"],
} satisfies ToolMeta;
