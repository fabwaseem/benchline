import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "har-analyzer",
  name: "HAR analyzer",
  tagline: "Drop a HAR capture, see where the time went.",
  description:
    "Free HAR file analyzer. Drop a .har capture or paste its JSON to get a request table with method, URL, status, size, and time, plus summary stats: totals, status-code distribution, the slowest requests, the largest payloads, top hosts, and a per-request timing breakdown of blocked, DNS, connect, send, wait, and receive.",
  category: "http",
  tags: ["har", "network", "performance", "waterfall"],
  keywords: ["har analyzer", "har viewer", "analyze har file", "waterfall chart", "http archive"],
  status: "new",
  createdAt: "2026-10-18",
  updatedAt: "2026-10-18",
  icon: "Network",
  related: ["http-headers-checker", "dns-lookup", "ssl-checker", "json-formatter"],
  faqs: [
    { q: "How do I get a HAR file?", a: "In Chrome or Edge DevTools, open the Network tab, reproduce the slow page load, then right-click a request and choose Save all as HAR. Firefox has Export HAR in its Network monitor." },
    { q: "Is my capture uploaded anywhere?", a: "No. The file is read in the browser and analyzed locally. HAR files can contain cookies and tokens, so keeping them local matters." },
    { q: "What do the timing phases mean?", a: "Blocked is queueing, DNS is name resolution, connect is the TCP/TLS handshake, send is uploading the request, wait is time to first byte, and receive is downloading the response." },
    { q: "How large a file can I analyze?", a: "The first 2,000 entries are analyzed; larger captures are flagged as truncated so you know the totals are partial." },
  ],
  seo: {
    title: "HAR analyzer",
    description: "Analyze HAR captures in the browser: request table, status distribution, slowest and largest requests, and timing breakdowns. Nothing uploaded.",
  },
  howTo: [
    { name: "Load the capture", text: "Drop a .har file or paste the HAR JSON into the input pane." },
    { name: "Read the summary", text: "Totals, status-code distribution, slowest requests, largest payloads, and top hosts appear first." },
    { name: "Inspect a request", text: "Pick a row to see its timing breakdown across blocked, DNS, connect, send, wait, and receive." },
  ],
  inputs: "A .har file or HAR JSON text.",
  outputs: "Request table, summary stats, status distribution, slowest/largest lists, and per-request timing breakdowns.",
  runsLocally: true,
  badges: ["HAR 1.2"],
} satisfies ToolMeta;
