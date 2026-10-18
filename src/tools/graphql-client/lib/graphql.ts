import { parseOutboundUrl, PublicUrlError, WEB_PORTS } from "@/lib/net/ssrf";

export interface GraphqlHeader {
  name: string;
  value: string;
}

export interface GraphqlArgs {
  endpoint: string;
  query: string;
  variablesText?: string;
  headers?: GraphqlHeader[];
  timeoutMs?: number;
}

export interface GraphqlResult {
  ok: boolean;
  status: number;
  durationMs: number;
  data?: unknown;
  errors?: unknown;
  error?: string;
}

export interface HistoryEntry {
  id: string;
  endpoint: string;
  query: string;
  at: number;
}

export function parseVariables(text: string): { variables: unknown } | { error: string } {
  const trimmed = text.trim();
  if (!trimmed) return { variables: undefined };
  try {
    return { variables: JSON.parse(trimmed) as unknown };
  } catch {
    return { error: "Variables must be valid JSON." };
  }
}

export function validateEndpoint(endpoint: string): { url: string } | { error: string } {
  try {
    const url = parseOutboundUrl(endpoint, { schemes: ["http", "https"], allowedPorts: WEB_PORTS });
    return { url: url.toString() };
  } catch (error) {
    if (error instanceof PublicUrlError) {
      if (error.message === "Enter a URL." || error.message === "Enter a valid URL.") {
        return { error: "The endpoint must be a valid http(s) URL." };
      }
      if (/^Only (?:http|ws)\b/.test(error.message)) return { error: "The endpoint must use http or https." };
      return { error: error.message };
    }
    return { error: "The endpoint must be a valid http(s) URL." };
  }
}

export async function executeGraphql(
  args: GraphqlArgs,
  fetchImpl: typeof fetch = fetch,
): Promise<GraphqlResult> {
  const checked = validateEndpoint(args.endpoint);
  if ("error" in checked) throw new PublicUrlError(checked.error);
  const query = args.query.trim();
  if (!query) throw new Error("The query must not be empty.");
  const parsedVars = parseVariables(args.variablesText ?? "");
  if ("error" in parsedVars) throw new Error(parsedVars.error);

  const headers: Record<string, string> = { "Content-Type": "application/json", Accept: "application/json" };
  for (const h of args.headers ?? []) {
    if (h.name.trim()) headers[h.name.trim()] = h.value;
  }
  const timeoutMs = Math.min(Math.max(args.timeoutMs ?? 15000, 1000), 60000);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const started = Date.now();
  try {
    const res = await fetchImpl(checked.url, {
      method: "POST",
      headers,
      body: JSON.stringify({ query, variables: parsedVars.variables ?? {} }),
      signal: controller.signal,
    });
    const durationMs = Date.now() - started;
    const text = await res.text();
    let payload: unknown;
    try {
      payload = JSON.parse(text) as unknown;
    } catch {
      return { ok: false, status: res.status, durationMs, error: `The endpoint returned status ${res.status} with a non-JSON body.` };
    }
    if (!res.ok) {
      return { ok: false, status: res.status, durationMs, error: `HTTP ${res.status}`, data: payload };
    }
    if (payload && typeof payload === "object" && "errors" in payload) {
      return { ok: false, status: res.status, durationMs, errors: (payload as { errors: unknown }).errors, data: payload };
    }
    const data = payload && typeof payload === "object" && "data" in payload ? (payload as { data: unknown }).data : payload;
    return { ok: true, status: res.status, durationMs, data };
  } catch (error) {
    if (error instanceof PublicUrlError) throw error;
    const durationMs = Date.now() - started;
    if (error instanceof DOMException && error.name === "AbortError") {
      return { ok: false, status: 0, durationMs, error: `The request timed out after ${timeoutMs} ms.` };
    }
    return {
      ok: false,
      status: 0,
      durationMs,
      error: error instanceof Error ? error.message : "The request failed.",
    };
  } finally {
    clearTimeout(timer);
  }
}

export function pushHistory(entries: HistoryEntry[], endpoint: string, query: string): HistoryEntry[] {
  const entry: HistoryEntry = {
    id: `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`,
    endpoint,
    query,
    at: Date.now(),
  };
  const rest = entries.filter((e) => !(e.endpoint === endpoint && e.query === query));
  return [entry, ...rest].slice(0, 20);
}

export const exampleQuery = `query GetCountry($code: ID!) {
  country(code: $code) {
    name
    capital
    currency
  }
}`;

export const exampleVariables = `{ "code": "DE" }`;

export const exampleEndpoint = "https://countries.trevorblades.com/";
