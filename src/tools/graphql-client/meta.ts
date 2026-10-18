import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "graphql-client",
  name: "GraphQL Client",
  tagline: "Query any GraphQL endpoint with variables, headers, and history.",
  description:
    "Free GraphQL playground. Send queries to any GraphQL endpoint with JSON variables and custom headers, inspect pretty-printed responses and errors, and replay recent requests from history. Timing is reported per request.",
  category: "http",
  tags: ["graphql", "api", "http"],
  keywords: ["graphql client online", "graphql playground", "test graphql api", "graphql query tester"],
  status: "new",
  createdAt: "2026-10-18",
  updatedAt: "2026-10-18",
  icon: "Waypoints",
  related: ["curl-converter", "http-headers-checker", "url-codec", "json-formatter"],
  faqs: [
    { q: "Why does my endpoint fail from the browser?", a: "Browsers enforce CORS: the endpoint must allow cross-origin requests from this page. If it does not, the request is blocked before it leaves. The same query works from a server or curl." },
    { q: "Are my queries or tokens sent anywhere else?", a: "No. Requests go straight from your browser to the endpoint you typed. History is kept in this browser's local storage only." },
    { q: "How do variables work?", a: "Write them as a JSON object and reference them in the query, e.g. query ($code: ID!) with { \"code\": \"DE\" }." },
    { q: "What is the timeout?", a: "Requests abort after 15 seconds in the UI. The API version accepts a timeout up to 60 seconds." },
  ],
  seo: {
    title: "GraphQL Client",
    description: "Free online GraphQL client: run queries with variables and headers against any endpoint, with history and timing.",
  },
  howTo: [
    { name: "Enter the endpoint", text: "Paste the GraphQL HTTP endpoint URL, e.g. https://countries.trevorblades.com/." },
    { name: "Write the query", text: "Add the query plus optional JSON variables and custom headers." },
    { name: "Send and inspect", text: "Read the pretty-printed response, the status, and the round-trip time. Recent requests stay in history." },
  ],
  inputs: "Endpoint URL, GraphQL query, JSON variables, and custom headers.",
  outputs: "Response data or errors, HTTP status, and duration.",
  runsLocally: false,
  badges: ["History · CORS-aware"],
} satisfies ToolMeta;
