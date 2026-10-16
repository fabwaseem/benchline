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
Connect instructions: ${absoluteUrl("/ai")}

${sections}

## Agent tools

${agents}

## Optional

- [About](${absoluteUrl("/about")}): who built the bench and what stays in the browser.
- [AI access](${absoluteUrl("/ai")}): Cursor, Claude, and ChatGPT setup.
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
