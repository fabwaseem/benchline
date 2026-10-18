import { describe, expect, it, vi } from "vitest";
import { encodeBase64 } from "@/lib/base64";
import { MCP_MAX_BYTES, MCP_MAX_TEXT, readMcpBytes } from "@/lib/mcp/bytes";
import { outboundTransport } from "@/lib/net/outbound";
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
    const dispatch = vi.spyOn(outboundTransport, "dispatch");
    await expect(readMcpBytes({ url: "http://127.0.0.1/secret" }, "File")).rejects.toBeInstanceOf(PublicUrlError);
    await expect(readMcpBytes({ url: "http://169.254.169.254/latest" }, "File")).rejects.toBeInstanceOf(PublicUrlError);
    await expect(readMcpBytes({ url: "http://coolify:8080/secret" }, "File")).rejects.toBeInstanceOf(PublicUrlError);
    await expect(readMcpBytes({ url: "http://2130706433/secret" }, "File")).rejects.toBeInstanceOf(PublicUrlError);
    expect(dispatch).not.toHaveBeenCalled();
    dispatch.mockRestore();
  });

  it("fetches a public URL and blocks a redirect to a private address", async () => {
    vi.spyOn(outboundTransport, "dispatch").mockImplementation(async (url) => {
      const href = url.toString();
      if (href.endsWith("/photo.png")) {
        return { status: 200, headers: new Headers({ "content-type": "image/png" }), body: new Uint8Array([9, 9]) };
      }
      return { status: 302, headers: new Headers({ location: "http://127.0.0.1/secret" }), body: new Uint8Array() };
    });
    const file = await readMcpBytes({ url: "https://1.1.1.1/photo.png" }, "Image");
    expect(file.filename).toBe("photo.png");
    expect(file.mimeType).toBe("image/png");
    expect([...file.bytes]).toEqual([9, 9]);
    await expect(readMcpBytes({ url: "https://1.1.1.1/jump" }, "Image")).rejects.toBeInstanceOf(PublicUrlError);
    vi.restoreAllMocks();
  });

  it("caps decoded bytes and streamed responses", async () => {
    await expect(readMcpBytes({ data: "A".repeat(MCP_MAX_TEXT + 1) }, "File")).rejects.toThrow(/10 MB/);
    vi.spyOn(outboundTransport, "dispatch").mockResolvedValue({
      status: 200,
      headers: new Headers({ "content-type": "application/pdf" }),
      body: new Uint8Array(MCP_MAX_BYTES + 1),
    });
    await expect(readMcpBytes({ url: "https://1.1.1.1/big.pdf" }, "PDF")).rejects.toThrow(/10 MB/);
    vi.restoreAllMocks();
  });
});
