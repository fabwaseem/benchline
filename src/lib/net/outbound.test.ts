import https from "node:https";
import { EventEmitter } from "node:events";
import { describe, expect, it, vi } from "vitest";
import { outboundFetch, outboundTransport, pinLookup, pinnedRequestOptions, vetOutboundUrl } from "@/lib/net/outbound";
import { PublicUrlError } from "@/lib/net/ssrf";
import type { AddressRecord } from "@/lib/net/outbound";

const publicLookup = async (host: string): Promise<AddressRecord[]> => {
  if (host === "example.com" || host === "good.example") return [{ address: "1.1.1.1", family: 4 }];
  if (host === "dual.example") {
    return [
      { address: "1.1.1.1", family: 4 },
      { address: "10.0.0.1", family: 4 },
    ];
  }
  if (host === "rebind.example") return [{ address: "127.0.0.1", family: 4 }];
  if (host === "v6.example") return [{ address: "2606:4700:4700::1111", family: 6 }];
  throw new Error(`no such host ${host}`);
};

const dispatchInit = {
  method: "GET",
  headers: new Headers(),
  body: null,
  signal: new AbortController().signal,
  timeoutMs: 1000,
  maxBytes: 1000,
  tooLargeMessage: "too large",
  discardBody: false,
};

describe("vetOutboundUrl", () => {
  it("allows a public host when every resolved address is public", async () => {
    const vetted = await vetOutboundUrl("https://example.com/a", { lookup: publicLookup, ports: "any" });
    expect(vetted.addresses).toEqual([{ address: "1.1.1.1", family: 4 }]);
    const v6 = await vetOutboundUrl("https://v6.example/", { lookup: publicLookup, ports: "any" });
    expect(v6.addresses[0]?.address).toBe("2606:4700:4700::1111");
  });

  it("blocks a host when any resolved address is private", async () => {
    await expect(vetOutboundUrl("https://dual.example/", { lookup: publicLookup, ports: "any" })).rejects.toThrow(/private address/);
    await expect(vetOutboundUrl("https://rebind.example/", { lookup: publicLookup, ports: "any" })).rejects.toThrow(PublicUrlError);
    await expect(vetOutboundUrl("https://missing.example/", { lookup: publicLookup, ports: "any" })).rejects.toThrow(/resolve/);
  });
});

describe("pinLookup", () => {
  it("returns only the vetted addresses", () => {
    const lookup = pinLookup([{ address: "1.1.1.1", family: 4 }]);
    lookup("rebind.example", { all: true }, (error, addresses) => {
      expect(error).toBeNull();
      expect(addresses).toEqual([{ address: "1.1.1.1", family: 4 }]);
    });
    const options = pinnedRequestOptions(new URL("https://example.com/a"), [{ address: "8.8.8.8", family: 4 }], dispatchInit);
    expect(options.hostname).toBe("example.com");
    expect(options.servername).toBe("example.com");
    options.lookup?.("rebind.example", { all: true }, (error, addresses) => {
      expect(error).toBeNull();
      expect(addresses).toEqual([{ address: "8.8.8.8", family: 4 }]);
    });
  });
});

describe("outboundFetch", () => {
  it("pins the connection to the first lookup and does not resolve again", async () => {
    const lookup = vi.fn(publicLookup);
    let seenHost = "";
    let pinned = "";
    vi.spyOn(https, "request").mockImplementation(((options: https.RequestOptions, callback: (res: EventEmitter) => void) => {
      seenHost = options.hostname ?? "";
      options.lookup?.("rebind.example", { all: true }, (error, addresses) => {
        if (!error && Array.isArray(addresses)) pinned = addresses[0]?.address ?? "";
      });
      const req = new EventEmitter();
      const end = () => {
        const res = Object.assign(new EventEmitter(), { statusCode: 200, headers: { "content-type": "text/plain" } });
        callback(res);
        res.emit("data", Buffer.from("ok"));
        res.emit("end");
        return req;
      };
      return Object.assign(req, { end, write: () => req, destroy: () => req, setTimeout: () => req });
    }) as unknown as typeof https.request);
    const result = await outboundFetch("https://example.com/hello", { lookup, ports: "any" });
    expect(new TextDecoder().decode(result.body)).toBe("ok");
    expect(seenHost).toBe("example.com");
    expect(pinned).toBe("1.1.1.1");
    expect(lookup).toHaveBeenCalledOnce();
    vi.restoreAllMocks();
  });

  it("re-checks each redirect and stops at a private hop", async () => {
    const dispatch = vi.spyOn(outboundTransport, "dispatch").mockImplementation(async (url) => {
      if (url.hostname === "example.com") {
        return { status: 302, headers: new Headers({ location: "https://good.example/next" }), body: new Uint8Array() };
      }
      if (url.hostname === "good.example") {
        return { status: 200, headers: new Headers({ "content-type": "text/plain" }), body: new TextEncoder().encode("landed") };
      }
      return { status: 302, headers: new Headers({ location: "http://127.0.0.1/secret" }), body: new Uint8Array() };
    });
    const ok = await outboundFetch("https://example.com/start", { lookup: publicLookup, ports: "any" });
    expect(new TextDecoder().decode(ok.body)).toBe("landed");
    expect(ok.redirects).toHaveLength(1);
    dispatch.mockImplementation(async () => ({
      status: 302,
      headers: new Headers({ location: "http://coolify:8080/admin" }),
      body: new Uint8Array(),
    }));
    await expect(outboundFetch("https://example.com/jump", { lookup: publicLookup, ports: "any" })).rejects.toThrow(PublicUrlError);
    dispatch.mockImplementation(async () => ({
      status: 302,
      headers: new Headers({ location: "http://10.0.0.1/" }),
      body: new Uint8Array(),
    }));
    await expect(outboundFetch("https://example.com/jump", { lookup: publicLookup, ports: "any" })).rejects.toThrow(/not public/);
    vi.restoreAllMocks();
  });

  it("refuses redirects when following is disabled", async () => {
    vi.spyOn(outboundTransport, "dispatch").mockResolvedValue({
      status: 302,
      headers: new Headers({ location: "https://example.com/next" }),
      body: new Uint8Array(),
    });
    await expect(
      outboundFetch("https://1.1.1.1/graphql", { followRedirects: false, ports: "any", redirectMessage: "Redirects are not followed." }),
    ).rejects.toThrow(/not followed/);
    vi.restoreAllMocks();
  });

  it("caps the response body", async () => {
    vi.spyOn(outboundTransport, "dispatch").mockResolvedValue({
      status: 200,
      headers: new Headers(),
      body: new Uint8Array(50),
    });
    await expect(outboundFetch("https://1.1.1.1/", { maxBytes: 10, tooLargeMessage: "Response is larger than 10 bytes.", ports: "any" })).rejects.toThrow(/10 bytes/);
    vi.restoreAllMocks();
  });
});
