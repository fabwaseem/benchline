export type PasteKind = "jwt" | "cron" | "url" | "json";

const KEY = "benchline:paste";

export function classifyPaste(value: string): PasteKind | null {
  const text = value.trim();
  if (!text) return null;
  const jwt = text.replace(/^bearer\s+/i, "");
  if (/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(jwt)) return "jwt";
  if (/^https?:\/\//i.test(text)) return "url";
  if (text.startsWith("{") || text.startsWith("[")) return "json";
  const fields = text.split(/\s+/);
  if ((fields.length === 5 || fields.length === 6 || fields.length === 7) && fields.every((field) => /^[@*0-9a-zA-Z/_,?#-]+$/.test(field))) {
    return "cron";
  }
  return null;
}

export function stagePaste(kind: PasteKind, value: string) {
  sessionStorage.setItem(KEY, JSON.stringify({ kind, value }));
}

export function takePaste(kind: PasteKind) {
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as { kind?: string; value?: string };
    if (data.kind !== kind || typeof data.value !== "string") return null;
    sessionStorage.removeItem(KEY);
    return data.value;
  } catch {
    return null;
  }
}
