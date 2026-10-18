import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/v1/tools/[slug]/route";
import { resetRateLimit } from "@/lib/net/rate-limit";
import { PublicUrlError } from "@/lib/net/ssrf";
import { tool as image } from "@/tools/image-convert/mcp";
import { tool as graphql } from "@/tools/graphql-client/mcp";
import { checkHeaders } from "@/tools/http-headers-checker/remote";
import { inspectPublicUrl } from "@/tools/meta-tags-inspector/remote";
import { markdownFromUrl } from "@/tools/html-to-markdown-url/remote";
import { checkSsl } from "@/tools/ssl-checker/remote";

const blocked = ["http://127.0.0.1", "http://coolify:8080"];

async function postTool(slug: string, body: unknown) {
  resetRateLimit();
  return POST(
    new Request(`https://tools.fabwaseem.com/api/v1/tools/${slug}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ slug }) },
  );
}

describe("server adapters reject private targets", () => {
  it("execute_graphql MCP handler rejects loopback and bare service names", async () => {
    for (const endpoint of blocked) {
      await expect(graphql.run({ endpoint, query: "{ a }" })).rejects.toThrow(PublicUrlError);
    }
  });

  it("execute_graphql HTTP adapter rejects loopback and bare service names", async () => {
    for (const endpoint of blocked) {
      const response = await postTool("graphql-client", { endpoint, query: "{ a }" });
      expect(response.status).toBe(400);
      const body = (await response.json()) as { error?: string };
      expect(body.error).toMatch(/not public/);
    }
  });

  it("convert_image MCP and HTTP adapters reject loopback and bare service names", async () => {
    for (const url of blocked) {
      await expect(image.run({ file: { url }, target: "jpeg" })).rejects.toThrow(PublicUrlError);
      const response = await postTool("image-convert", { file: { url }, target: "jpeg" });
      expect(response.status).toBe(400);
      const body = (await response.json()) as { error?: string };
      expect(body.error).toMatch(/not public/);
    }
  });

  it("metadata, page, and TLS fetchers reject loopback and bare service names", async () => {
    for (const url of blocked) {
      await expect(inspectPublicUrl(url)).rejects.toThrow(PublicUrlError);
      await expect(checkHeaders(url)).rejects.toThrow(PublicUrlError);
      await expect(markdownFromUrl(url)).rejects.toThrow(PublicUrlError);
      await expect(checkSsl(url)).rejects.toThrow(PublicUrlError);
    }
  });
});
