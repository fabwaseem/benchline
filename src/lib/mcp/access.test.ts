import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/v1/tools/[slug]/route";
import { handleMcpRequest } from "@/lib/mcp/handler";
import { resetRateLimit } from "@/lib/net/rate-limit";

const token = "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJhZGEiLCJleHAiOjIwMDAwMDAwMDB9.e30";

describe("benchline access", () => {
  it("decodes a JWT through the MCP client", async () => {
    resetRateLimit();
    const client = new Client({ name: "benchline-test", version: "1.0.0" });
    const transport = new StreamableHTTPClientTransport(new URL("https://tools.fabwaseem.com/mcp"), {
      fetch: (url, init) => handleMcpRequest(new Request(url, init)),
    });
    await client.connect(transport);
    const result = await client.callTool({ name: "decode_jwt", arguments: { token } });
    await client.close();
    const structured = result.structuredContent as { ok: boolean; payload: { sub: string }; claims: { name: string; iso: string }[] };
    expect(result.isError).toBeFalsy();
    expect(structured.ok).toBe(true);
    expect(structured.payload.sub).toBe("ada");
    expect(structured.claims.find((claim) => claim.name === "exp")?.iso).toBe("2033-05-18T03:33:20.000Z");
  });

  it("decodes a JWT through the REST API", async () => {
    resetRateLimit();
    const response = await POST(
      new Request("https://tools.fabwaseem.com/api/v1/tools/jwt-decoder", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token }),
      }),
      { params: Promise.resolve({ slug: "jwt-decoder" }) },
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as { ok: boolean; payload: { sub: string } };
    expect(body.ok).toBe(true);
    expect(body.payload.sub).toBe("ada");
  });
});
