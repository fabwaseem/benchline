import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "url-codec",
  name: "URL encoder and parser",
  tagline: "Encode or decode a URL, then break the query string into parameters.",
  description:
    "Free URL encoder and decoder. Percent-encode a component or a whole URL, decode it again, and parse a URL into its host, path, and query parameters. Edit the query and copy the rebuilt URL. Runs in the browser.",
  category: "urls",
  tags: ["url", "encode"],
  keywords: ["url decode", "url encode", "query string parser", "url encoder"],
  status: "new",
  createdAt: "2026-10-18",
  updatedAt: "2026-10-18",
  icon: "Link",
  related: ["hash-generator", "jwt-decoder", "uuid-generator", "unix-timestamp"],
  faqs: [
    { q: "What is the difference between component and full encoding?", a: "Component encoding is encodeURIComponent: it escapes /, ?, &, and =. Full encoding is encodeURI: it leaves those URL separators in place and escapes spaces and other unsafe characters." },
    { q: "Why does a plus sign become a space?", a: "In a query string, + means space. Turn on Treat + as space when decoding a query. A literal plus in a path is %2B." },
    { q: "Can I edit the parameters?", a: "Yes. The parser lists each parameter. Change a value, add a row, or fill the UTM fields, and the URL is rebuilt with encodeURIComponent." },
    { q: "Is the URL sent anywhere?", a: "No. Encoding, decoding, and parsing use the browser's URL APIs." },
  ],
  seo: {
    title: "URL encoder, decoder, and parser",
    description: "URL-encode or decode text, and parse a URL into its host, path, and query parameters.",
  },
  howTo: [
    { name: "Encode or decode", text: "Pick component encoding to escape one value, or full encoding to escape a whole URL. Decode turns percent-escapes back into text." },
    { name: "Paste a URL to parse it", text: "The host, port, path, and hash are listed beside the query parameters. A bare query string works too." },
    { name: "Edit the query and copy the URL", text: "Change a parameter or add UTM fields. The rebuilt URL uses %20 for spaces." },
  ],
  inputs: "Text to encode or decode, or a URL or query string to parse.",
  outputs: "Encoded or decoded text, URL parts, and a query string rebuilt from the parameter table.",
  runsLocally: true,
  badges: ["Encode · Decode · Query"],
} satisfies ToolMeta;
