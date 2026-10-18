import { JSONPath } from "jsonpath-plus";

// Pure JSONPath evaluation with friendly syntax checking. jsonpath-plus v11
// is lenient about malformed queries, so a structural pre-check reports the
// common mistakes before evaluation.

export const JSONPATH_MAX_MATCHES = 500;

export type JsonPathMatch = {
  path: string;
  value: unknown;
};

export type JsonPathEvaluation =
  | { matches: JsonPathMatch[]; count: number; truncated: boolean }
  | { error: string };

type Bracket = { char: "[" | "(" | "{"; index: number };

const CLOSERS: Record<string, "[" | "(" | "{"> = { "]": "[", ")": "(", "}": "{" };

function checkSyntax(query: string): string {
  const trimmed = query.trim();
  if (!trimmed) return "The query is empty.";
  if (!trimmed.startsWith("$")) return "The query must start with $ for the document root.";
  const stack: Bracket[] = [];
  let quote: string | null = null;
  let escaped = false;
  for (let index = 0; index < trimmed.length; index += 1) {
    const char = trimmed[index] ?? "";
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }
    if (char === "'" || char === '"' || char === "`") {
      quote = char;
      continue;
    }
    if (char === "[" || char === "(" || char === "{") {
      stack.push({ char, index });
      continue;
    }
    const opener = CLOSERS[char];
    if (opener) {
      const last = stack.pop();
      if (!last || last.char !== opener) {
        return `Unmatched ${char} at position ${index + 1}.`;
      }
    }
  }
  if (quote) return "The query has an unterminated string.";
  const unclosed = stack.pop();
  if (unclosed) return `Unclosed ${unclosed.char} opened at position ${unclosed.index + 1}.`;
  return "";
}

export function evaluateJsonPath(jsonText: string, query: string, maxMatches: number = JSONPATH_MAX_MATCHES): JsonPathEvaluation {
  const syntaxError = checkSyntax(query);
  if (syntaxError) return { error: syntaxError };
  let data: unknown;
  try {
    data = JSON.parse(jsonText) as unknown;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid JSON.";
    return { error: `The JSON is invalid: ${message}` };
  }
  let raw: unknown;
  try {
    raw = JSONPath({ path: query.trim(), json: data, resultType: "all" });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { error: `The query failed: ${message}` };
  }
  const rows = (Array.isArray(raw) ? raw : [raw]) as Array<{ path?: string; value?: unknown }>;
  const matches: JsonPathMatch[] = rows.map((row) => ({
    path: typeof row?.path === "string" ? row.path : "$",
    value: row && typeof row === "object" && "value" in row ? row.value : row,
  }));
  const truncated = matches.length > maxMatches;
  return { matches: matches.slice(0, maxMatches), count: matches.length, truncated };
}

export function formatValue(value: unknown): string {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}
