export interface ParsedSocketUrl {
  valid: boolean;
  protocol?: "ws" | "wss";
  secure?: boolean;
  host?: string;
  port?: number;
  path?: string;
  error?: string;
}

export function parseWebSocketUrl(input: string): ParsedSocketUrl {
  const trimmed = input.trim();
  if (!trimmed) return { valid: false, error: "Enter a WebSocket URL." };
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return { valid: false, error: "That is not a valid URL." };
  }
  if (url.protocol !== "ws:" && url.protocol !== "wss:") {
    return { valid: false, error: `Only ws:// and wss:// are allowed — got ${url.protocol}. Browsers cannot upgrade an http(s) URL here; use the ws(s) scheme.` };
  }
  if (!url.hostname) return { valid: false, error: "The URL needs a host." };
  const secure = url.protocol === "wss:";
  const defaultPort = secure ? 443 : 80;
  const port = url.port ? Number(url.port) : defaultPort;
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return { valid: false, error: "The port must be between 1 and 65535." };
  }
  return {
    valid: true,
    protocol: secure ? "wss" : "ws",
    secure,
    host: url.hostname,
    port,
    path: `${url.pathname}${url.search}`,
  };
}

const CLOSE_CODES: Record<number, string> = {
  1000: "Normal closure",
  1001: "Going away",
  1002: "Protocol error",
  1003: "Unsupported data",
  1004: "Reserved",
  1005: "No status received",
  1006: "Abnormal closure",
  1007: "Invalid frame payload data",
  1008: "Policy violation",
  1009: "Message too big",
  1010: "Mandatory extension missing",
  1011: "Internal error",
  1012: "Service restart",
  1013: "Try again later",
  1014: "Bad gateway",
  1015: "TLS handshake failure",
};

export function closeCodeName(code: number): string {
  return CLOSE_CODES[code] ?? (code >= 4000 && code <= 4999 ? "Application-defined" : "Unknown code");
}

export type FrameDirection = "in" | "out" | "sys";

export interface LogFrame {
  id: string;
  direction: FrameDirection;
  text: string;
  at: number;
}

let frameSeq = 0;

export function makeFrame(direction: FrameDirection, text: string): LogFrame {
  frameSeq += 1;
  return { id: `${Date.now().toString(36)}-${frameSeq}`, direction, text, at: Date.now() };
}

export function formatFrameTime(at: number): string {
  const d = new Date(at);
  const pad = (n: number, w = 2) => String(n).padStart(w, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
}

export const exampleSocketUrl = "wss://echo.websocket.events";
