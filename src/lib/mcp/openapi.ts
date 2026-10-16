import { z } from "zod";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { mcpTools } from "@/registry/mcp-registry";

function schemaOf(schema: z.ZodType) {
  const json = z.toJSONSchema(schema) as Record<string, unknown>;
  delete json.$schema;
  return json;
}

export function openApiDocument() {
  const paths: Record<string, unknown> = {};
  for (const tool of mcpTools) {
    paths[`/api/v1/tools/${tool.slug}`] = {
      post: {
        operationId: tool.name,
        summary: tool.title,
        description: tool.description,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: schemaOf(tool.inputSchema),
            },
          },
        },
        responses: {
          "200": {
            description: tool.title,
            content: {
              "application/json": {
                schema: schemaOf(tool.outputSchema),
              },
            },
          },
          "400": { description: "The arguments were rejected, or the tool could not finish." },
          "404": { description: "No tool uses that slug." },
          "429": { description: "More than 60 calls from this address in a minute." },
        },
      },
    };
  }
  return {
    openapi: "3.1.0",
    info: {
      title: SITE_NAME,
      version: "1.0.0",
      description: "HTTP access to the same functions the Benchline MCP server exposes. Each call is anonymous and limited to 60 requests a minute per address.",
    },
    servers: [{ url: SITE_URL }],
    paths,
  };
}
