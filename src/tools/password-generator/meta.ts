import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "password-generator",
  name: "Password generator",
  tagline: "Cryptographic passwords and passphrases, with an entropy strength meter.",
  description:
    "Free strong password generator. Build a password with crypto.getRandomValues, choose the length and character sets, skip ambiguous characters, or make a passphrase. The strength meter shows the entropy in bits.",
  category: "crypto",
  tags: ["password", "random"],
  keywords: ["password generator", "strong password generator", "passphrase generator"],
  status: "new",
  createdAt: "2026-10-18",
  updatedAt: "2026-10-18",
  icon: "KeyRound",
  related: ["hash-generator", "uuid-generator", "jwt-decoder", "url-codec"],
  faqs: [
    { q: "Where does the randomness come from?", a: "crypto.getRandomValues. Indexes are rejection-sampled so each character is equally likely. Math.random is not used." },
    { q: "What does the strength meter measure?", a: "Entropy from the length and the size of the alphabet, in bits. It is not a guess about a password you already use. 80 bits fills the meter. 64 bits or more is labeled Strong." },
    { q: "What is the passphrase word list?", a: "The EFF short wordlist, 1,296 words, which the Electronic Frontier Foundation dedicated to the public domain. Six words is about 62 bits before any extra digit." },
    { q: "Is the password sent anywhere?", a: "No. It is generated in the browser and stays on this page until you copy it or leave." },
  ],
  seo: {
    title: "Password generator",
    description: "Generate a strong password or passphrase with crypto.getRandomValues, character options, and an entropy strength meter.",
  },
  howTo: [
    { name: "Set the length and the character sets", text: "Turn lowercase, uppercase, digits, and symbols on or off. Ambiguous characters such as 0, O, 1, and l can be left out." },
    { name: "Read the entropy", text: "The meter is the length times the log of the alphabet size. Add length or another set when you want more bits." },
    { name: "Or switch to a passphrase", text: "Pick how many words, a separator, and whether to add a digit. Copy one or a short list." },
  ],
  inputs: "Length, character sets, an ambiguous-character switch, or passphrase word count and separator.",
  outputs: "Passwords or passphrases, plus entropy bits and a strength label.",
  runsLocally: true,
  badges: ["CSPRNG · Entropy"],
} satisfies ToolMeta;
