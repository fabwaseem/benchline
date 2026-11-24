import { absoluteUrl, SITE_NAME } from "@/lib/site";

/**
 * The answer to a GET or DELETE on /mcp. The MCP spec wants 405 from a server that does not stream on GET,
 * so the status stays 405; the body and Link header tell an agent (or curl) where the docs are and how to call.
 * A browser asking for HTML never gets here: src/proxy.ts shows it the setup page instead.
 */
export function mcpMethodNotAllowed(): Response {
  const endpoint = absoluteUrl("/mcp");
  const guide = absoluteUrl("/mcp/guide");
  const reference = absoluteUrl("/ai");
  const llms = absoluteUrl("/llms.txt");
  const openapi = absoluteUrl("/openapi.json");
  const body = `405 Method Not Allowed

This is the ${SITE_NAME} MCP endpoint (Streamable HTTP, JSON-RPC 2.0). Send requests with POST.
No key is needed. 60 calls per minute per address.

Setup for Claude, Cursor, VS Code, and ChatGPT: ${guide}
Every tool, its MCP name, and what it reads: ${reference}
Index for LLMs: ${llms}
The same tools over plain HTTP (OpenAPI): ${openapi}

List the tools:
curl -s ${endpoint} \\
  -H 'content-type: application/json' \\
  -H 'accept: application/json, text/event-stream' \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
`;
  return new Response(body, {
    status: 405,
    headers: {
      allow: "POST",
      "content-type": "text/plain; charset=utf-8",
      // /mcp answers differently by Accept (browsers get the setup page), so a shared cache must not reuse this.
      "cache-control": "no-store",
      vary: "accept",
      link: [
        `<${guide}>; rel="help"`,
        `<${llms}>; rel="describedby"; type="text/plain"`,
        `<${openapi}>; rel="service-desc"; type="application/json"`,
      ].join(", "),
    },
  });
}
