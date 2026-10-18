import { describe, expect, it, vi } from "vitest";
import { encodeBase64 } from "@/lib/base64";
import { MCP_MAX_BYTES, MCP_MAX_TEXT, readMcpBytes } from "@/lib/mcp/bytes";
import { PublicUrlError } from "@/lib/net/ssrf";

describe("readMcpBytes", () => {
  it("decodes base64 and a data URI", async () => {
    const raw = readMcpBytes({ data: encodeBase64(new Uint8Array([1, 2, 3])), filename: "a.bin" }, "File");
    await expect(raw).resolves.toMatchObject({ filename: "a.bin", bytes: new Uint8Array([1, 2, 3]) });
    const uri = await readMcpBytes({ data: "data:image/png;base64,AQID" }, "Image");
    expect(uri.mimeType).toBe("image/png");
    expect([...uri.bytes]).toEqual([1, 2, 3]);
  });

  it("requires exactly one of url or data", async () => {
    await expect(readMcpBytes({}, "File")).rejects.toThrow(/url or data/);
    await expect(readMcpBytes({ url: "https://1.1.1.1/a", data: "YQ==" }, "File")).rejects.toThrow(/not both/);
  });

  it("rejects a private URL before fetching", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(readMcpBytes({ url: "http://127.0.0.1/secret" }, "File")).rejects.toBeInstanceOf(PublicUrlError);
    await expect(readMcpBytes({ url: "http://169.254.169.254/latest" }, "File")).rejects.toBeInstanceOf(PublicUrlError);
    expect(fetchMock).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("fetches a public URL and blocks a redirect to a private address", async () => {
    vi.stubGlobal("fetch", async (input: RequestInfo | URL) => {
      const url = input instanceof Request ? input.url : String(input);
      if (url.endsWith("/photo.png")) {
        return new Response(new Uint8Array([9, 9]), {
          status: 200,
          headers: { "content-type": "image/png", "content-length": "2" },
        });
      }
      return new Response(null, { status: 302, headers: { location: "http://127.0.0.1/secret" } });
    });
    const file = await readMcpBytes({ url: "https://1.1.1.1/photo.png" }, "Image");
    expect(file.filename).toBe("photo.png");
    expect(file.mimeType).toBe("image/png");
    expect([...file.bytes]).toEqual([9, 9]);
    await expect(readMcpBytes({ url: "https://1.1.1.1/jump" }, "Image")).rejects.toBeInstanceOf(PublicUrlError);
    vi.unstubAllGlobals();
  });

  it("caps decoded bytes and streamed responses", async () => {
    await expect(readMcpBytes({ data: "A".repeat(MCP_MAX_TEXT + 1) }, "File")).rejects.toThrow(/10 MB/);
    vi.stubGlobal("fetch", async () => {
      let sent = 0;
      const stream = new ReadableStream<Uint8Array>({
        pull(controller) {
          if (sent > MCP_MAX_BYTES) {
            controller.close();
            return;
          }
          sent += 1024 * 1024;
          controller.enqueue(new Uint8Array(1024 * 1024));
        },
      });
      return new Response(stream, { status: 200, headers: { "content-type": "application/pdf" } });
    });
    await expect(readMcpBytes({ url: "https://1.1.1.1/big.pdf" }, "PDF")).rejects.toThrow(/10 MB/);
    vi.unstubAllGlobals();
  });
});
