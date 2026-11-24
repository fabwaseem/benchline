import { z } from "zod";
import { FOUNDER } from "@/lib/founder";
import { exampleArguments, toolsCallParams } from "@/lib/mcp/example";
import { toolMarkdownPath } from "@/lib/seo";
import { absoluteUrl, GITHUB_URL, SITE_NAME, SITE_URL } from "@/lib/site";
import { mcpFor, mcpIndex } from "@/registry/mcp-index";
import { mcpToolBySlug } from "@/registry/mcp-registry";
import { categories, getTool, parents, tools } from "@/registry";

export function benchLlms() {
  const sections = parents
    .map((parent) => {
      const children = categories.filter((category) => category.parent === parent.slug);
      const blocks = children.flatMap((category) => {
        const items = tools.filter((tool) => tool.category === category.slug);
        if (items.length === 0) return [];
        const links = items
          .map((tool) => `- [${tool.name}](${absoluteUrl(`/t/${tool.slug}`)}): ${tool.tagline} Markdown: ${absoluteUrl(toolMarkdownPath(tool.slug))}`)
          .join("\n");
        const heading = children.length === 1 ? parent.name : `${parent.name} / ${category.name}`;
        return [`## ${heading}\n\n${links}`];
      });
      return blocks.join("\n\n");
    })
    .filter(Boolean)
    .join("\n\n");

  const agents = mcpIndex
    .map(
      (tool) =>
        `- \`${tool.name}\` — ${tool.description} HTTP: POST ${absoluteUrl(`/api/v1/tools/${tool.slug}`)}.${tool.openWorld ? " This call fetches a public URL." : ""}`,
    )
    .join("\n");

  return `# ${SITE_NAME}

> ${tools.length} free browser tools for PDF, images, JSON, security, and SEO. Files stay on the user's device. Every tool is also an MCP tool and a JSON endpoint, with no key. Canonical site: ${SITE_URL}

Founder: ${FOUNDER.name}, ${FOUNDER.jobTitle} (${FOUNDER.url})
Source: ${GITHUB_URL}
MCP endpoint: ${absoluteUrl("/mcp")} (Streamable HTTP, no auth, 60 calls per minute)
OpenAPI: ${absoluteUrl("/openapi.json")}
Setup for Claude, Cursor, VS Code, and ChatGPT: ${absoluteUrl("/mcp/guide")}
Tool reference: ${absoluteUrl("/ai")}
Each tool page has a Markdown copy: append .md to its URL, for example ${absoluteUrl(toolMarkdownPath("jwt-decoder"))}

${sections}

## Agent tools

${agents}

## Optional

- [All tools](${absoluteUrl("/tools")}): the full directory, with search and categories.
- [Categories](${absoluteUrl("/categories")}): the category index, with hue, description, and the top tools.
- [About](${absoluteUrl("/about")}): who built Benchline (${FOUNDER.name}) and what stays in the browser.
- [MCP setup](${absoluteUrl("/mcp/guide")}): Claude Desktop, Claude.ai, Cursor, VS Code, and ChatGPT setup.
- [Tool reference](${absoluteUrl("/ai")}): every MCP tool name, what it does, and whether it reads the web.
`;
}

export function benchLlmsFull() {
  const blocks = mcpIndex
    .map((tool) => {
      const page = tools.find((item) => item.slug === tool.slug);
      return `## ${tool.title}

MCP name: \`${tool.name}\`
Page: ${absoluteUrl(`/t/${tool.slug}`)}
HTTP: POST ${absoluteUrl(`/api/v1/tools/${tool.slug}`)} with a JSON body matching the tool input.
${tool.description}
${page ? page.description : ""}
${tool.openWorld ? "This tool fetches a public URL. The browser UI still fetches only the URL you submit; an agent call does the fetch on the server." : "This tool does not fetch. It runs on the arguments you send."}
`;
    })
    .join("\n");

  return `${benchLlms()}
# Full tool notes

${blocks}`;
}

function jsonSchemaOf(schema: z.ZodType) {
  const json = z.toJSONSchema(schema) as Record<string, unknown>;
  delete json.$schema;
  return json;
}

/** One tool as plain Markdown: what it does, how to use it, and how an agent calls it. Null for an unknown slug. */
export function toolMarkdown(slug: string): string | null {
  const tool = getTool(slug);
  if (!tool) return null;
  const page = absoluteUrl(`/t/${tool.slug}`);
  const mcp = mcpFor(tool.slug);
  const handler = mcpToolBySlug(tool.slug);
  const lines: string[] = [
    `# ${tool.name}`,
    "",
    `> ${tool.tagline}`,
    "",
    tool.description,
    "",
    `- Page: ${page}`,
    `- Runs: ${tool.runsLocally ? "in the browser. Input stays on the device." : "in the browser, plus one server fetch of the public URL you give it."}`,
    `- Price: free, no account`,
    `- Input: ${tool.inputs}`,
    `- Output: ${tool.outputs}`,
    `- Keywords: ${tool.keywords.join(", ")}`,
    `- Updated: ${tool.updatedAt}`,
    `- Built by: ${FOUNDER.name} (${FOUNDER.url})`,
    "",
    "## How to use it",
    "",
    ...tool.howTo.map((step, index) => `${index + 1}. **${step.name}.** ${step.text}`),
    "",
  ];
  if (mcp && handler) {
    const call = { jsonrpc: "2.0", id: 1, method: "tools/call", params: toolsCallParams(mcp.name, exampleArguments(handler.inputSchema)) };
    lines.push(
      "## Use it from an AI agent",
      "",
      `MCP tool name: \`${mcp.name}\``,
      `MCP endpoint: ${absoluteUrl("/mcp")} (Streamable HTTP, no key)`,
      `HTTP: POST ${absoluteUrl(`/api/v1/tools/${tool.slug}`)} with the input as the JSON body`,
      mcp.openWorld ? "This call fetches a public URL on the server. Private addresses are refused." : "This call does not fetch anything. It runs on the arguments you send.",
      "",
      mcp.description,
      "",
      "### Input schema",
      "",
      "```json",
      JSON.stringify(jsonSchemaOf(handler.inputSchema), null, 2),
      "```",
      "",
      "### Example tools/call",
      "",
      "```json",
      JSON.stringify(call, null, 2),
      "```",
      "",
      `Setup for Claude, Cursor, and VS Code: ${absoluteUrl("/mcp/guide")}`,
      "",
    );
  }
  lines.push("## Questions", "", ...tool.faqs.flatMap((faq) => [`### ${faq.q}`, "", faq.a, ""]));
  const related = tool.related.map((item) => getTool(item)).filter((item) => item !== undefined);
  if (related.length > 0) {
    lines.push("## Related tools", "", ...related.map((item) => `- [${item.name}](${absoluteUrl(`/t/${item.slug}`)}): ${item.tagline}`), "");
  }
  return lines.join("\n");
}
