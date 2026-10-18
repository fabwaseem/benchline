import { parse, printParseErrorCode, type ParseError, type ParseErrorCode } from "jsonc-parser";
import { parseJsonLossless, rawJsonNumberSource, stringifyJsonLossless } from "@/lib/json-lossless";

export const indents = ["2", "4", "tab"] as const;

export type Indent = (typeof indents)[number];

export type JsonIssue = {
  message: string;
  line: number;
  column: number;
  offset: number;
  excerpt: string;
};

export type JsonTreeNode = {
  key: string;
  type: "object" | "array" | "string" | "number" | "boolean" | "null";
  preview: string;
  children: JsonTreeNode[];
};

export type FormatOptions = {
  indent: Indent;
  sortKeys: boolean;
  minify: boolean;
};

export type FormatResult = {
  valid: boolean;
  output: string;
  errors: JsonIssue[];
  tree: JsonTreeNode | null;
};

export const exampleJson = `{
  "name": "Ada Lovelace",
  "year": 1843,
  "fields": ["math", "code"]
}
`;

export function formatJson(input: string, options: FormatOptions): FormatResult {
  const text = input.replace(/^\uFEFF/, "");
  const errors = issuesIn(text);
  if (errors.length > 0) {
    return { valid: false, output: "", errors, tree: null };
  }
  try {
    const value = sortIfNeeded(parseJsonLossless(text), options.sortKeys);
    const output = stringifyJsonLossless(value, options.minify ? undefined : gap(options.indent));
    return { valid: true, output, errors: [], tree: treeOf(value, "root") };
  } catch (error) {
    const issue = issueFromSyntax(text, error);
    return { valid: false, output: "", errors: [issue], tree: null };
  }
}

function issuesIn(text: string): JsonIssue[] {
  const found: ParseError[] = [];
  parse(text, found, { disallowComments: true, allowTrailingComma: false });
  const seen = new Set<number>();
  const issues: JsonIssue[] = [];
  for (const error of found) {
    if (seen.has(error.offset)) continue;
    seen.add(error.offset);
    const { line, column } = positionAt(text, error.offset);
    issues.push({
      message: messageFor(error.error),
      line,
      column,
      offset: error.offset,
      excerpt: lineText(text, line),
    });
  }
  return issues;
}

function messageFor(code: ParseErrorCode): string {
  switch (printParseErrorCode(code)) {
    case "InvalidSymbol":
      return "Invalid symbol";
    case "InvalidNumberFormat":
      return "Invalid number";
    case "PropertyNameExpected":
      return "Expected a property name";
    case "ValueExpected":
      return "Expected a value";
    case "ColonExpected":
      return "Expected a colon";
    case "CommaExpected":
      return "Expected a comma";
    case "CloseBraceExpected":
      return "Expected a closing brace";
    case "CloseBracketExpected":
      return "Expected a closing bracket";
    case "EndOfFileExpected":
      return "Unexpected extra input";
    case "InvalidCommentToken":
    case "UnexpectedEndOfComment":
      return "Comments are not valid JSON";
    case "UnexpectedEndOfString":
      return "Unclosed string";
    case "UnexpectedEndOfNumber":
      return "Unexpected end of number";
    case "InvalidUnicode":
      return "Invalid unicode escape";
    case "InvalidEscapeCharacter":
      return "Invalid escape";
    case "InvalidCharacter":
      return "Invalid character";
    default:
      return "Invalid JSON";
  }
}

function issueFromSyntax(text: string, error: unknown): JsonIssue {
  const message = error instanceof Error ? error.message : "Invalid JSON";
  const at = /position (\d+)/.exec(message);
  if (at?.[1]) {
    const offset = Number(at[1]);
    const { line, column } = positionAt(text, offset);
    return { message: message.replace(/\s+at position \d+/, ""), line, column, offset, excerpt: lineText(text, line) };
  }
  const lineCol = /line (\d+) column (\d+)/i.exec(message);
  const line = lineCol?.[1] ? Number(lineCol[1]) : 1;
  const column = lineCol?.[2] ? Number(lineCol[2]) : 1;
  return { message, line, column, offset: 0, excerpt: lineText(text, line) };
}

function positionAt(text: string, offset: number): { line: number; column: number } {
  const end = Math.max(0, Math.min(offset, text.length));
  let line = 1;
  let column = 1;
  for (let index = 0; index < end; index += 1) {
    if (text.charCodeAt(index) === 10) {
      line += 1;
      column = 1;
    } else {
      column += 1;
    }
  }
  return { line, column };
}

function lineText(text: string, line: number): string {
  return text.split(/\r?\n/)[line - 1] ?? "";
}

function gap(indent: Indent): string | number {
  if (indent === "tab") return "\t";
  if (indent === "4") return 4;
  return 2;
}

function sortIfNeeded(value: unknown, sortKeys: boolean): unknown {
  if (!sortKeys) return value;
  return sortValue(value);
}

function sortValue(value: unknown): unknown {
  if (rawJsonNumberSource(value) !== null) return value;
  if (Array.isArray(value)) return value.map(sortValue);
  if (value && typeof value === "object") {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))) {
      sorted[key] = sortValue((value as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  return value;
}

function treeOf(value: unknown, key: string): JsonTreeNode {
  const raw = rawJsonNumberSource(value);
  if (raw !== null) return { key, type: "number", preview: raw, children: [] };
  if (value === null) return { key, type: "null", preview: "null", children: [] };
  if (Array.isArray(value)) {
    return {
      key,
      type: "array",
      preview: value.length === 1 ? "1 item" : `${value.length} items`,
      children: value.map((item, index) => treeOf(item, String(index))),
    };
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    return {
      key,
      type: "object",
      preview: entries.length === 1 ? "1 key" : `${entries.length} keys`,
      children: entries.map(([entryKey, entry]) => treeOf(entry, entryKey)),
    };
  }
  if (typeof value === "string") return { key, type: "string", preview: clip(JSON.stringify(value)), children: [] };
  if (typeof value === "number") return { key, type: "number", preview: String(value), children: [] };
  if (typeof value === "boolean") return { key, type: "boolean", preview: String(value), children: [] };
  return { key, type: "null", preview: "null", children: [] };
}

function clip(value: string): string {
  return value.length > 80 ? `${value.slice(0, 77)}...` : value;
}
