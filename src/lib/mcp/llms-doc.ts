import { absoluteUrl, SITE_NAME, SITE_URL } from "@/lib/site";
import { mcpIndex } from "@/registry/mcp-index";
import { categories, tools } from "@/registry";

export function benchLlms() {
  const sections = categories
    .map((category) => {
      const items = tools.filter((tool) => tool.category === category.slug);
      if (items.length === 0) return "";
      const links = items
        .map((tool) => `- [${tool.name}](${absoluteUrl(`/t/${tool.slug}`)}): ${tool.tagline}`)
        .join("\n");
      return `## ${category.name}\n\n${links}`;
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

> A quiet bench for exact work. Local developer tools, in the browser. Canonical site: ${SITE_URL}

MCP endpoint: ${absoluteUrl("/mcp")}
OpenAPI: ${absoluteUrl("/openapi.json")}
Connect instructions: ${absoluteUrl("/mcp")}

${sections}

## Agent tools

${agents}

## Optional

- [Explore](${absoluteUrl("/explore")}): every tool, with search, category, and tag filters.
- [Categories](${absoluteUrl("/categories")}): the category index, with hue, description, and the top tools.
- [About](${absoluteUrl("/about")}): who built the bench and what stays in the browser.
- [MCP](${absoluteUrl("/mcp")}): Claude Desktop, Cursor, and VS Code setup. Browser GET returns the docs; clients POST JSON-RPC.
- [AI access](${absoluteUrl("/ai")}): the tool list, Cursor, Claude, and the HTTP API.
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
