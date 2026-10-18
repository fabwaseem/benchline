import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "curl-converter",
  name: "cURL Converter",
  tagline: "Turn any curl command into fetch, Python, Go, PHP, or Rust.",
  description:
    "Free curl converter. Paste a curl command and get equivalent code for JavaScript fetch, Python requests, Go net/http, PHP cURL, and Rust reqwest. Headers, bodies, basic auth, and common flags are translated automatically.",
  category: "http",
  tags: ["curl", "http", "api"],
  keywords: ["curl to python", "curl to javascript", "curl converter", "curl to fetch", "curl to go"],
  status: "new",
  createdAt: "2026-10-18",
  updatedAt: "2026-10-18",
  icon: "ArrowLeftRight",
  related: ["http-headers-checker", "url-codec", "json-formatter", "graphql-client"],
  faqs: [
    { q: "Which curl flags are supported?", a: "-X/--request, -H/--header, -d/--data variants, -u/--user, -A/--user-agent, -b/--cookie, -k/--insecure, -L/--location, and --compressed. Anything else is listed as ignored." },
    { q: "How is the HTTP method chosen?", a: "An explicit -X flag wins. Otherwise a command with a body becomes POST and one without becomes GET." },
    { q: "What happens to -u basic auth?", a: "It becomes auth=(user, pass) in Python, SetBasicAuth in Go, CURLOPT_USERPWD in PHP, .basic_auth in Rust, and an Authorization header in fetch." },
    { q: "Is my command sent anywhere?", a: "No. Parsing and code generation run entirely in the browser on this page." },
  ],
  seo: {
    title: "cURL Converter",
    description: "Convert curl commands to JavaScript fetch, Python requests, Go, PHP, and Rust code — free, in the browser.",
  },
  howTo: [
    { name: "Paste the curl command", text: "Drop in a curl command, including multi-line ones with backslash continuations." },
    { name: "Pick the target", text: "Switch between fetch, Python, Go, PHP, and Rust tabs." },
    { name: "Copy the snippet", text: "Each tab has copy and download buttons. Check the warnings for ignored flags." },
  ],
  inputs: "A curl command and the target language.",
  outputs: "An equivalent code snippet plus the parsed request and warnings.",
  runsLocally: true,
  badges: ["5 targets · Offline"],
} satisfies ToolMeta;
