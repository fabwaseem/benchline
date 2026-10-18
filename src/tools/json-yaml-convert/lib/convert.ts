import { XMLBuilder, XMLParser, XMLValidator } from "fast-xml-parser";
import { JSON_SCHEMA, YAMLException, dump, load } from "js-yaml";
import { parse, printParseErrorCode, type ParseError, type ParseErrorCode } from "jsonc-parser";
import { TomlError, parse as parseToml, stringify as stringifyToml } from "smol-toml";

export const dataFormats = ["json", "yaml", "toml", "xml"] as const;

export type DataFormat = (typeof dataFormats)[number];

export type ConvertResult = {
  ok: boolean;
  output: string;
  detected: DataFormat | null;
  error: string;
  line: number | null;
  column: number | null;
};

export const exampleYaml = `name: Ada Lovelace
year: 1843
tools:
  - json
  - yaml
`;

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@",
  ignoreDeclaration: true,
  trimValues: false,
  textNodeName: "#text",
  parseTagValue: true,
});

const xmlBuilder = new XMLBuilder({
  ignoreAttributes: false,
  attributeNamePrefix: "@",
  format: true,
  indentBy: "  ",
  textNodeName: "#text",
  suppressEmptyNode: false,
});

export function detectFormat(input: string): DataFormat | null {
  const text = input.replace(/^\uFEFF/, "").trim();
  if (!text) return null;
  if (text.startsWith("<")) return "xml";
  if (text.startsWith("{") || text.startsWith("[")) return "json";
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));
  const first = lines[0] ?? "";
  if (/^\[\[?[A-Za-z0-9_.\-"' ]+\]\]?$/.test(first) || /^[A-Za-z0-9_.\-"']+\s*=/.test(first)) return "toml";
  return "yaml";
}

export function convertData(input: string, from: DataFormat | "auto", to: DataFormat): ConvertResult {
  const text = input.replace(/^\uFEFF/, "");
  if (text.trim() === "") {
    return { ok: false, output: "", detected: null, error: "Paste a document to convert.", line: null, column: null };
  }
  const detected = from === "auto" ? detectFormat(text) : from;
  if (!detected) {
    return { ok: false, output: "", detected: null, error: "Could not detect the source format.", line: null, column: null };
  }
  const parsed = parseSource(text, detected);
  if (!parsed.ok) {
    return { ok: false, output: "", detected, error: parsed.error, line: parsed.line, column: parsed.column };
  }
  const emitted = emit(parsed.value, to);
  if (!emitted.ok) {
    return { ok: false, output: "", detected, error: emitted.error, line: emitted.line, column: emitted.column };
  }
  return { ok: true, output: emitted.output, detected, error: "", line: null, column: null };
}

function parseSource(text: string, format: DataFormat): { ok: true; value: unknown } | { ok: false; error: string; line: number | null; column: number | null } {
  if (format === "json") return readJson(text);
  if (format === "yaml") return readYaml(text);
  if (format === "toml") return readToml(text);
  return readXml(text);
}

function emit(value: unknown, format: DataFormat): { ok: true; output: string } | { ok: false; error: string; line: number | null; column: number | null } {
  if (format === "json") return { ok: true, output: JSON.stringify(value, null, 2) };
  if (format === "yaml") {
    try {
      return { ok: true, output: dump(value, { noRefs: true, lineWidth: 80, schema: JSON_SCHEMA }) };
    } catch (error) {
      return { ok: false, error: firstLine(error, "Could not write YAML."), line: null, column: null };
    }
  }
  if (format === "toml") return writeToml(value);
  return writeXml(value);
}

function readJson(text: string): { ok: true; value: unknown } | { ok: false; error: string; line: number | null; column: number | null } {
  const found: ParseError[] = [];
  parse(text, found, { disallowComments: true, allowTrailingComma: false });
  const error = found[0];
  if (error) {
    const position = positionAt(text, error.offset);
    return { ok: false, error: messageFor(error.error), line: position.line, column: position.column };
  }
  try {
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Invalid JSON";
    const at = /position (\d+)/.exec(message);
    const position = at?.[1] ? positionAt(text, Number(at[1])) : { line: 1, column: 1 };
    return { ok: false, error: message.replace(/\s+at position \d+/, ""), line: position.line, column: position.column };
  }
}

function readYaml(text: string): { ok: true; value: unknown } | { ok: false; error: string; line: number | null; column: number | null } {
  try {
    return { ok: true, value: normalize(load(text, { schema: JSON_SCHEMA })) };
  } catch (error) {
    if (error instanceof YAMLException) {
      return {
        ok: false,
        error: error.reason,
        line: error.mark ? error.mark.line + 1 : null,
        column: error.mark ? error.mark.column + 1 : null,
      };
    }
    return { ok: false, error: firstLine(error, "Could not read YAML."), line: null, column: null };
  }
}

function readToml(text: string): { ok: true; value: unknown } | { ok: false; error: string; line: number | null; column: number | null } {
  try {
    return { ok: true, value: normalize(parseToml(text)) };
  } catch (error) {
    if (error instanceof TomlError) {
      return { ok: false, error: firstLine(error, "Invalid TOML."), line: error.line, column: error.column };
    }
    return { ok: false, error: firstLine(error, "Could not read TOML."), line: null, column: null };
  }
}

function readXml(text: string): { ok: true; value: unknown } | { ok: false; error: string; line: number | null; column: number | null } {
  const validated = XMLValidator.validate(text);
  if (validated !== true) {
    return { ok: false, error: validated.err.msg, line: validated.err.line, column: validated.err.col };
  }
  try {
    return { ok: true, value: xmlParser.parse(text) as unknown };
  } catch (error) {
    return { ok: false, error: firstLine(error, "Could not read XML."), line: null, column: null };
  }
}

function writeToml(value: unknown): { ok: true; output: string } | { ok: false; error: string; line: number | null; column: number | null } {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ok: false, error: "TOML needs a top-level table. Arrays and scalars cannot be the document root.", line: null, column: null };
  }
  const problem = tomlProblem(value, "");
  if (problem) return { ok: false, error: problem, line: null, column: null };
  try {
    return { ok: true, output: stringifyToml(value) };
  } catch (error) {
    return { ok: false, error: firstLine(error, "Could not write TOML."), line: null, column: null };
  }
}

function writeXml(value: unknown): { ok: true; output: string } | { ok: false; error: string; line: number | null; column: number | null } {
  const rooted = xmlRoot(value);
  try {
    const body = xmlBuilder.build(rooted);
    return { ok: true, output: `<?xml version="1.0" encoding="UTF-8"?>\n${body}` };
  } catch (error) {
    return { ok: false, error: firstLine(error, "Could not write XML."), line: null, column: null };
  }
}

function tomlProblem(value: unknown, path: string): string | null {
  if (value === null || value === undefined) {
    return `${path || "The document"} is null. TOML has no null, so the value was not dropped.`;
  }
  if (typeof value === "number" && !Number.isFinite(value)) return `${path || "A number"} is not finite.`;
  if (typeof value === "string" || typeof value === "boolean" || typeof value === "number" || value instanceof Date) return null;
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const problem = tomlProblem(value[index], `${path}[${index}]`);
      if (problem) return problem;
    }
    return null;
  }
  if (typeof value === "object") {
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      const problem = tomlProblem(item, path ? `${path}.${key}` : key);
      if (problem) return problem;
    }
    return null;
  }
  return `${path || "A value"} cannot be represented in TOML.`;
}

function normalize(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) out[key] = normalize(item);
    return out;
  }
  return value;
}

function xmlRoot(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { root: value };
  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length !== 1) return { root: value };
  const child = entries[0]?.[1];
  if (Array.isArray(child)) return { root: value };
  return value;
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

function messageFor(code: ParseErrorCode): string {
  switch (printParseErrorCode(code)) {
    case "PropertyNameExpected":
      return "Expected a property name";
    case "ValueExpected":
      return "Expected a value";
    case "InvalidCommentToken":
      return "Comments are not valid JSON";
    default:
      return "Invalid JSON";
  }
}

function firstLine(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message.split("\n")[0] ?? fallback;
  return fallback;
}
