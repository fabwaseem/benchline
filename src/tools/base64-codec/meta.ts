import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "base64-codec",
  name: "Base64 codec",
  tagline: "Encode and decode Base64 for text or a file, including the URL-safe alphabet.",
  description:
    "Free Base64 encode and Base64 decode tool for text and files. Turn on URL-safe output, wrap a file as a data URI, or decode a data URI back to text or a download. The file never leaves the browser.",
  category: "encoding",
  tags: ["base64", "encode"],
  keywords: ["base64 decode", "base64 encode", "base64 to file", "url safe base64"],
  status: "new",
  createdAt: "2026-10-18",
  updatedAt: "2026-10-18",
  icon: "Binary",
  related: ["json-formatter", "jwt-decoder", "json-yaml-convert", "csv-json-convert"],
  faqs: [
    { q: "What is URL-safe Base64?", a: "The URL-safe alphabet uses - and _ instead of + and /, and this tool omits the padding. Decoding accepts both alphabets, with or without padding, and ignores whitespace." },
    { q: "Does a data URI stay URL-safe?", a: "No. A data URI uses the standard alphabet, because that is what browsers read. The URL-safe toggle applies to raw Base64 only." },
    { q: "Can I decode a file?", a: "Yes. Paste the Base64 or a data URI and download the bytes. The type is taken from the data URI when it has one, otherwise from the file header: PNG, JPEG, GIF, WebP, PDF, ZIP, SVG, JSON, or plain text." },
    { q: "Why is decoded text empty for some files?", a: "The bytes are not valid UTF-8. The download still has the original bytes. Text mode only shows a string when the decoded bytes are UTF-8." },
  ],
  seo: {
    title: "Base64 encode and decode",
    description: "Encode and decode Base64 for text and files in the browser, with a URL-safe alphabet and data URI output.",
  },
  howTo: [
    { name: "Choose text or a file", text: "Text encodes a string as UTF-8. A file is read in the browser and encoded as raw bytes." },
    { name: "Encode or decode", text: "URL-safe output drops the padding. A data URI uses the standard alphabet and the file type you set, or text/plain for a string." },
    { name: "Copy or download", text: "Copy the Base64, or decode it and download the file under the sniffed type." },
  ],
  inputs: "Text or a file, encode or decode, and toggles for URL-safe Base64 and a data URI.",
  outputs: "Base64 text, a data URI, decoded UTF-8 when the bytes are text, and a file download.",
  runsLocally: true,
  badges: ["Text · File · URL-safe"],
} satisfies ToolMeta;
