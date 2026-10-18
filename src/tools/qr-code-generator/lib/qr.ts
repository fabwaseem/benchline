import { toDataURL, toString } from "qrcode";

export const qrTypes = ["text", "url", "wifi", "vcard"] as const;
export const eccLevels = ["L", "M", "Q", "H"] as const;
export const wifiSecurities = ["WPA", "WEP", "nopass"] as const;
export type QrType = (typeof qrTypes)[number];
export type EccLevel = (typeof eccLevels)[number];
export type WifiSecurity = (typeof wifiSecurities)[number];

export const DEFAULT_DARK = "#111111";
export const DEFAULT_LIGHT = "#ffffff";

export type WifiInput = {
  ssid: string;
  password: string;
  security: WifiSecurity;
  hidden: boolean;
};

export type VcardInput = {
  name: string;
  phone: string;
  email: string;
  org: string;
  title: string;
  url: string;
};

export type QrRequest = {
  type: QrType;
  text: string;
  url: string;
  wifi: WifiInput;
  vcard: VcardInput;
};

export type QrStyle = {
  ecc: EccLevel;
  dark: string;
  light: string;
  margin: number;
  size: number;
};

export function normalizeHex(input: string) {
  const value = input.trim();
  const short = /^#([0-9a-fA-F]{3})$/.exec(value);
  if (short?.[1]) {
    const [red, green, blue] = short[1].split("");
    return `#${red}${red}${green}${green}${blue}${blue}`.toLowerCase();
  }
  const full = /^#([0-9a-fA-F]{6})$/.exec(value);
  if (full?.[1]) return `#${full[1].toLowerCase()}`;
  throw new Error("Use a hex color such as #112233.");
}

export function escapeWifi(value: string) {
  return value.replace(/([\\;,:"])/g, "\\$1");
}

export function wifiPayload(input: WifiInput) {
  if (!input.ssid.trim()) throw new Error("The network name is required.");
  if (input.security !== "nopass" && !input.password) throw new Error("This security type needs a password.");
  const password = input.security === "nopass" ? "" : escapeWifi(input.password);
  return `WIFI:T:${input.security};S:${escapeWifi(input.ssid)};P:${password};H:${input.hidden ? "true" : "false"};;`;
}

export function escapeVcard(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/[,;]/g, (char) => `\\${char}`);
}

export function vcardPayload(input: VcardInput) {
  if (!input.name.trim() && !input.phone.trim() && !input.email.trim()) {
    throw new Error("Add a name, phone, or email.");
  }
  const lines = ["BEGIN:VCARD", "VERSION:3.0"];
  if (input.name.trim()) {
    lines.push(`FN:${escapeVcard(input.name.trim())}`);
    lines.push(`N:${escapeVcard(input.name.trim())};;;;`);
  }
  if (input.org.trim()) lines.push(`ORG:${escapeVcard(input.org.trim())}`);
  if (input.title.trim()) lines.push(`TITLE:${escapeVcard(input.title.trim())}`);
  if (input.phone.trim()) lines.push(`TEL;TYPE=CELL:${escapeVcard(input.phone.trim())}`);
  if (input.email.trim()) lines.push(`EMAIL:${escapeVcard(input.email.trim())}`);
  if (input.url.trim()) lines.push(`URL:${escapeVcard(input.url.trim())}`);
  lines.push("END:VCARD");
  return lines.join("\n");
}

export function urlPayload(value: string) {
  const text = value.trim();
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    throw new Error("Enter a full URL, including https://.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("Use an http or https URL.");
  return url.toString();
}

export function textPayload(value: string) {
  if (!value.trim()) throw new Error("Enter the text to encode.");
  if (value.length > 2000) throw new Error("Keep the text under 2,000 characters.");
  return value;
}

export function qrPayload(input: QrRequest) {
  if (input.type === "text") return textPayload(input.text);
  if (input.type === "url") return urlPayload(input.url);
  if (input.type === "wifi") return wifiPayload(input.wifi);
  return vcardPayload(input.vcard);
}

export async function renderQr(text: string, style: QrStyle): Promise<{ svg: string; pngBase64: string }> {
  if (!text) throw new Error("There is nothing to encode.");
  const dark = normalizeHex(style.dark);
  const light = normalizeHex(style.light);
  if (dark === light) throw new Error("The foreground and background need different colors.");
  if (!Number.isInteger(style.margin) || style.margin < 0 || style.margin > 8) {
    throw new Error("Quiet zone must be a whole number from 0 to 8.");
  }
  if (!Number.isInteger(style.size) || style.size < 128 || style.size > 2048) {
    throw new Error("Size must be a whole number from 128 to 2048.");
  }
  const options = {
    errorCorrectionLevel: style.ecc,
    margin: style.margin,
    width: style.size,
    color: { dark, light },
  };
  try {
    const svg = await toString(text, { ...options, type: "svg" });
    const dataUrl = await toDataURL(text, { ...options, type: "image/png" });
    return { svg, pngBase64: dataUrl.replace(/^data:image\/png;base64,/, "") };
  } catch {
    throw new Error("That text is too long for this error-correction level. Shorten it, or use a lower level.");
  }
}
