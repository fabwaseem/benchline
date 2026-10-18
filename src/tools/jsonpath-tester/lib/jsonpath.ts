import { JSONPath } from "jsonpath-plus";
import { inexactJsonNumberTokens, parseJsonLossless, rawJsonNumberSource, stringifyJsonLossless } from "@/lib/json-lossless";

// Pure JSONPath evaluation with friendly syntax checking. jsonpath-plus v11
// is lenient about malformed queries, so a structural pre-check reports the
// common mistakes before evaluation.

export const JSONPATH_MAX_MATCHES = 500;

export type JsonPathMatch = {
  path: string;
  value: unknown;
};

export type JsonPathEvaluation =
  | { matches: JsonPathMatch[]; count: number; truncated: boolean; warning: string }
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
  let lossless: unknown = data;
  try {
    lossless = parseJsonLossless(jsonText);
  } catch {
    lossless = data;
  }
  let raw: unknown;
  try {
    raw = JSONPath({ path: query.trim(), json: data, resultType: "all" });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { error: `The query failed: ${message}` };
  }
  const rows = (Array.isArray(raw) ? raw : [raw]) as Array<{ path?: string; value?: unknown; pointer?: string }>;
  const matches: JsonPathMatch[] = rows.map((row) => {
    const value = row && typeof row === "object" && "value" in row ? row.value : row;
    const pointer = row && typeof row.pointer === "string" ? row.pointer : "";
    return {
      path: typeof row?.path === "string" ? row.path : "$",
      value: restoreDigits(value, atPointer(lossless, pointer)),
    };
  });
  const truncated = matches.length > maxMatches;
  return { matches: matches.slice(0, maxMatches), count: matches.length, truncated, warning: precisionWarning(jsonText) };
}

export function formatValue(value: unknown): string {
  if (typeof value === "string") return value;
  const raw = rawJsonNumberSource(value);
  if (raw !== null) return raw;
  try {
    return stringifyJsonLossless(value);
  } catch {
    return String(value);
  }
}

function precisionWarning(text: string): string {
  const lost = inexactJsonNumberTokens(text);
  if (lost.length === 0) return "";
  const sample = lost.slice(0, 3).join(", ");
  const more = lost.length > 3 ? `, and ${lost.length - 3} more` : "";
  return `${sample}${more} ${lost.length === 1 ? "does" : "do"} not fit in a JavaScript number. The original digits are kept as text.`;
}

function atPointer(root: unknown, pointer: string): unknown {
  if (!pointer) return root;
  let current = root;
  for (const part of pointer.split("/").slice(1).map(unescapePointer)) {
    if (Array.isArray(current)) {
      const index = Number(part);
      current = Number.isInteger(index) ? current[index] : undefined;
    } else if (current && typeof current === "object") {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return current;
}

function unescapePointer(part: string): string {
  return part.replace(/~1/g, "/").replace(/~0/g, "~");
}

function restoreDigits(value: unknown, lossless: unknown): unknown {
  const raw = rawJsonNumberSource(lossless);
  if (raw !== null) return raw;
  if (Array.isArray(value) && Array.isArray(lossless)) return value.map((item, index) => restoreDigits(item, lossless[index]));
  if (value && lossless && typeof value === "object" && typeof lossless === "object" && !Array.isArray(value)) {
    const source = lossless as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>)) out[key] = restoreDigits((value as Record<string, unknown>)[key], source[key]);
    return out;
  }
  return value;
}
