import { describe, expect, it } from "vitest";
import { normalizeHex, qrPayload, renderQr, vcardPayload, wifiPayload, type QrRequest } from "@/tools/qr-code-generator/lib/qr";

const request: QrRequest = {
  type: "text",
  text: "Hello",
  url: "https://benchline.fabwaseem.com",
  wifi: { ssid: "cafe", password: "secret", security: "WPA", hidden: false },
  vcard: { name: "Ada Lovelace", phone: "", email: "ada@example.com", org: "", title: "", url: "" },
};

const style = { ecc: "M" as const, dark: "#111111", light: "#ffffff", margin: 2, size: 256 };

describe("qr payloads", () => {
  it("builds wifi, vcard, url, and text payloads", () => {
    expect(wifiPayload({ ssid: "a;b", password: "p:q", security: "WPA", hidden: false })).toBe("WIFI:T:WPA;S:a\\;b;P:p\\:q;H:false;;");
    expect(wifiPayload({ ssid: "cafe", password: "", security: "nopass", hidden: true })).toBe("WIFI:T:nopass;S:cafe;P:;H:true;;");
    expect(vcardPayload({ name: "Ada, Lovelace", phone: "", email: "", org: "", title: "", url: "" })).toContain("FN:Ada\\, Lovelace");
    expect(qrPayload({ ...request, type: "url" })).toBe("https://benchline.fabwaseem.com/");
    expect(qrPayload(request)).toBe("Hello");
  });

  it("rejects incomplete payloads and bad colors", () => {
    expect(() => qrPayload({ ...request, type: "url", url: "example.com" })).toThrow(/https/);
    expect(() => qrPayload({ ...request, type: "url", url: "javascript:alert(1)" })).toThrow(/http/);
    expect(() => wifiPayload({ ssid: "", password: "", security: "WPA", hidden: false })).toThrow(/network name/);
    expect(() => normalizeHex("red")).toThrow(/hex/);
    expect(normalizeHex("#abc")).toBe("#aabbcc");
  });
});

describe("renderQr", () => {
  it("returns an SVG and a PNG, and changes with the correction level", async () => {
    const rendered = await renderQr("https://benchline.fabwaseem.com/t/qr-code-generator", style);
    expect(rendered.svg).toContain("<svg");
    expect(rendered.pngBase64.startsWith("iVBORw0KGgo")).toBe(true);
    const stronger = await renderQr("https://benchline.fabwaseem.com/t/qr-code-generator", { ...style, ecc: "H" });
    expect(stronger.svg).not.toBe(rendered.svg);
    const colored = await renderQr("https://benchline.fabwaseem.com/t/qr-code-generator", { ...style, dark: "#003366" });
    expect(colored.svg).not.toBe(rendered.svg);
  });

  it("rejects identical colors", async () => {
    await expect(renderQr("Hello", { ...style, light: "#111111" })).rejects.toThrow(/different colors/);
  });
});
