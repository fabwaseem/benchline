import { z } from "zod";
import { FOUNDER } from "@/lib/founder";
import { exampleArguments } from "@/lib/mcp/example";
import { toolMarkdownPath } from "@/lib/seo";
import { absoluteUrl, GITHUB_URL, SITE_NAME } from "@/lib/site";
import { mcpTools } from "@/registry/mcp-registry";

/** Everything an agent needs to find, understand, and call the tools, in one place. Pure: no I/O. */

const RATE = "60 calls per minute per address";

export function jsonSchemaOf(schema: z.ZodType): Record<string, unknown> {
  const json = z.toJSONSchema(schema) as Record<string, unknown>;
  delete json.$schema;
  return json;
}

export const AGENT_LINKS = {
  mcp: () => absoluteUrl("/mcp"),
  api: () => absoluteUrl("/api/v1/tools"),
  setup: () => absoluteUrl("/mcp/guide"),
  reference: () => absoluteUrl("/ai"),
  llms: () => absoluteUrl("/llms.txt"),
  llmsFull: () => absoluteUrl("/llms-full.txt"),
  openapi: () => absoluteUrl("/openapi.json"),
};

/**
 * The tool an API path names. Agents often use the MCP name they saw in tools/list (decode_jwt)
 * where the URL wants the slug (jwt-decoder); both resolve to the same tool.
 */
export function resolveApiSlug(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const value = raw.trim().toLowerCase();
  const tool = mcpTools.find((item) => item.slug === value) ?? mcpTools.find((item) => item.name === value);
  return tool?.slug ?? null;
}

/** The API URL and docs URL of one tool: POST runs it, GET describes it. */
export function toolApiUrl(slug: string) {
  return absoluteUrl(`/api/v1/tools/${slug}`);
}

/** GET /api/v1/tools/<slug>: what the tool does, its schemas, and a body that works as-is. */
export function toolApiDoc(slug: string) {
  const tool = mcpTools.find((item) => item.slug === slug);
  if (!tool) return null;
  const url = toolApiUrl(slug);
  const example = exampleArguments(tool.inputSchema);
  const body = JSON.stringify(example);
  return {
    name: tool.name,
    slug: tool.slug,
    title: tool.title,
    description: tool.description,
    readsTheWeb: tool.openWorld,
    run: { method: "POST", url, contentType: "application/json", body: "the input object, as JSON" },
    mcp: { endpoint: AGENT_LINKS.mcp(), tool: tool.name },
    inputSchema: jsonSchemaOf(tool.inputSchema),
    outputSchema: jsonSchemaOf(tool.outputSchema),
    example: {
      body: example,
      curl: `curl -s ${url} -H 'content-type: application/json' -d '${body.replaceAll("'", "'\\''")}'`,
    },
    docs: {
      page: absoluteUrl(`/t/${tool.slug}`),
      markdown: absoluteUrl(toolMarkdownPath(tool.slug)),
      setup: AGENT_LINKS.setup(),
    },
    limits: { rate: RATE, files: "base64 or a public URL, 10 MB decoded; private addresses are refused", auth: "none" },
  };
}

/** GET /api/v1/tools: the whole catalogue, so an agent can pick a tool without reading HTML. */
export function toolApiIndex() {
  return {
    name: SITE_NAME,
    description: `Free tools for PDF, images, JSON, security, and SEO. Each one runs over MCP (${AGENT_LINKS.mcp()}) or as POST ${absoluteUrl("/api/v1/tools/<slug>")}. GET a tool's URL for its schemas and an example.`,
    auth: "none",
    rate: RATE,
    links: {
      mcp: AGENT_LINKS.mcp(),
      setup: AGENT_LINKS.setup(),
      openapi: AGENT_LINKS.openapi(),
      llms: AGENT_LINKS.llms(),
      llmsFull: AGENT_LINKS.llmsFull(),
    },
    count: mcpTools.length,
    tools: mcpTools.map((tool) => ({
      name: tool.name,
      slug: tool.slug,
      title: tool.title,
      description: tool.description,
      readsTheWeb: tool.openWorld,
      url: toolApiUrl(tool.slug),
      page: absoluteUrl(`/t/${tool.slug}`),
    })),
  };
}

/** The `instructions` an MCP client shows the model when it connects. */
export function serverInstructions() {
  return [
    `${SITE_NAME} exposes ${mcpTools.length} deterministic tools for PDF, images, JSON and data formats, encoding, hashing, security, networking, SEO, and AI search.`,
    "Pick the tool whose name matches the job (for example merge_pdf, format_json, decode_jwt, check_robots_txt). Every tool is read-only and idempotent: the same input gives the same output, and nothing is stored.",
    "Files go in as base64 or as a public https URL. Decoded files are capped at 10 MB and private or local addresses are refused. Binary results come back as base64.",
    "Tools marked openWorld fetch the public URL you pass; the rest only transform their arguments.",
    `No key is needed. Limit: ${RATE}. A failed call returns the exact field that was wrong.`,
    `Docs: ${AGENT_LINKS.reference()} (every tool), ${AGENT_LINKS.llms()} (index), and /t/<slug>.md for one tool in Markdown.`,
  ].join("\n");
}

/** A short hint appended to a failed MCP call, so the model can correct its arguments. */
export function errorHint(slug: string) {
  return `Input schema and an example: ${toolApiUrl(slug)} (GET). Docs: ${absoluteUrl(toolMarkdownPath(slug))}`;
}

/** /.well-known/mcp.json: a server card for clients and crawlers that look for one. */
export function wellKnownMcp() {
  return {
    name: SITE_NAME.toLowerCase(),
    title: SITE_NAME,
    description: `${mcpTools.length} free tools for PDF, images, JSON, security, and SEO, as an MCP server.`,
    version: "1.0.0",
    websiteUrl: absoluteUrl("/"),
    endpoint: AGENT_LINKS.mcp(),
    transport: "streamable-http",
    authentication: { required: false },
    rateLimit: RATE,
    toolCount: mcpTools.length,
    tools: mcpTools.map((tool) => ({ name: tool.name, title: tool.title, description: tool.description })),
    documentation: AGENT_LINKS.setup(),
    links: {
      setup: AGENT_LINKS.setup(),
      reference: AGENT_LINKS.reference(),
      api: AGENT_LINKS.api(),
      openapi: AGENT_LINKS.openapi(),
      llms: AGENT_LINKS.llms(),
      source: GITHUB_URL,
    },
    author: { name: FOUNDER.name, url: FOUNDER.url },
  };
}
