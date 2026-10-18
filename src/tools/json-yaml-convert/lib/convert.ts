import { XMLBuilder, XMLParser, XMLValidator } from "fast-xml-parser";
import { JSON_SCHEMA, NOT_RESOLVED, YAMLException, defineScalarTag, dump, floatJsonTag, intJsonTag, load } from "js-yaml";
import { parse, printParseErrorCode, type ParseError, type ParseErrorCode } from "jsonc-parser";
import { TomlError, parse as parseToml, stringify as stringifyToml } from "smol-toml";
import {
  isJsonIntegerToken,
  isJsonNumberToken,
  jsonNumberTokenIsExact,
  parseJsonLossless,
  rawJsonNumber,
  rawJsonNumberSource,
  readJsonNumberAt,
  stringifyJsonLossless,
} from "@/lib/json-lossless";

const TOML_MARK = "\uE000";

const numberSchema = JSON_SCHEMA.withTags(
  defineScalarTag(intJsonTag.tagName, {
    implicit: true,
    implicitFirstChars: intJsonTag.implicitFirstChars,
    resolve(source, isExplicit, tagName) {
      const resolved = intJsonTag.resolve(source, isExplicit, tagName);
      if (resolved === NOT_RESOLVED) return NOT_RESOLVED;
      if (isJsonIntegerToken(source) && !jsonNumberTokenIsExact(source)) return rawJsonNumber(source);
      return resolved;
    },
    identify(data: unknown) {
      if (typeof data === "bigint") return true;
      const raw = rawJsonNumberSource(data);
      if (raw !== null) return isJsonIntegerToken(raw);
      return intJsonTag.identify(data);
    },
    represent(data: unknown) {
      if (typeof data === "bigint") return data.toString();
      const raw = rawJsonNumberSource(data);
      if (raw !== null) return raw;
      return intJsonTag.represent(data);
    },
  }),
  defineScalarTag(floatJsonTag.tagName, {
    implicit: true,
    implicitFirstChars: floatJsonTag.implicitFirstChars,
    resolve(source, isExplicit, tagName) {
      const resolved = floatJsonTag.resolve(source, isExplicit, tagName);
      if (resolved === NOT_RESOLVED) return NOT_RESOLVED;
      if (isJsonNumberToken(source) && !jsonNumberTokenIsExact(source)) return rawJsonNumber(source);
      return resolved;
    },
    identify(data: unknown) {
      const raw = rawJsonNumberSource(data);
      if (raw !== null) return !isJsonIntegerToken(raw);
      return floatJsonTag.identify(data);
    },
    represent(data: unknown) {
      const raw = rawJsonNumberSource(data);
      if (raw !== null) return raw;
      return floatJsonTag.represent(data);
    },
  }),
);

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
  tagValueProcessor: (_name, value) => {
    if (typeof value === "string" && isJsonNumberToken(value) && !jsonNumberTokenIsExact(value)) return rawJsonNumber(value);
    return value;
  },
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
  if (format === "json") return { ok: true, output: stringifyJsonLossless(value, 2) };
  if (format === "yaml") {
    try {
      return { ok: true, output: dump(value, { noRefs: true, lineWidth: 80, schema: numberSchema }) };
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
    return { ok: true, value: parseJsonLossless(text) };
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Invalid JSON";
    const at = /position (\d+)/.exec(message);
    const position = at?.[1] ? positionAt(text, Number(at[1])) : { line: 1, column: 1 };
    return { ok: false, error: message.replace(/\s+at position \d+/, ""), line: position.line, column: position.column };
  }
}

function readYaml(text: string): { ok: true; value: unknown } | { ok: false; error: string; line: number | null; column: number | null } {
  try {
    return { ok: true, value: normalize(load(text, { schema: numberSchema })) };
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
    return { ok: true, value: normalize(parseToml(quoteInexactTomlFloats(text), { integersAsBigInt: "asNeeded" })) };
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
    return { ok: true, output: unquoteTomlMarks(stringifyToml(prepareToml(value))) };
  } catch (error) {
    return { ok: false, error: firstLine(error, "Could not write TOML."), line: null, column: null };
  }
}

function writeXml(value: unknown): { ok: true; output: string } | { ok: false; error: string; line: number | null; column: number | null } {
  const rooted = xmlRoot(value);
  try {
    const body = xmlBuilder.build(xmlReady(rooted));
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
  if (typeof value === "bigint" || rawJsonNumberSource(value) !== null) return null;
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
  if (typeof value === "bigint" || rawJsonNumberSource(value) !== null) return value;
  if (typeof value === "string" && value.startsWith(TOML_MARK)) return rawJsonNumber(value.slice(TOML_MARK.length));
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

function prepareToml(value: unknown): unknown {
  const raw = rawJsonNumberSource(value);
  if (raw !== null) return isJsonIntegerToken(raw) ? BigInt(raw) : `${TOML_MARK}${raw}`;
  if (typeof value === "bigint" || value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(prepareToml);
  const out: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) out[key] = prepareToml(item);
  return out;
}

function xmlReady(value: unknown): unknown {
  const raw = rawJsonNumberSource(value);
  if (raw !== null) return raw;
  if (typeof value === "bigint") return value.toString();
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(xmlReady);
  const out: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) out[key] = xmlReady(item);
  return out;
}

function quoteInexactTomlFloats(text: string): string {
  if (text.includes(TOML_MARK)) return text;
  let out = "";
  let index = 0;
  while (index < text.length) {
    const char = text[index] ?? "";
    if (char === "#") {
      const end = text.indexOf("\n", index);
      const next = end === -1 ? text.length : end;
      out += text.slice(index, next);
      index = next;
      continue;
    }
    if (char === "'" || char === '"') {
      const end = skipTomlString(text, index);
      out += text.slice(index, end);
      index = end;
      continue;
    }
    if ((char === "-" || (char >= "0" && char <= "9")) && tomlBoundary(text[index - 1])) {
      const token = readJsonNumberAt(text, index);
      if (token && tomlValueEnd(text, index + token.length) && !isJsonIntegerToken(token) && !jsonNumberTokenIsExact(token)) {
        out += `"${TOML_MARK}${token}"`;
        index += token.length;
        continue;
      }
    }
    out += char;
    index += 1;
  }
  return out;
}

function unquoteTomlMarks(text: string): string {
  return text.replace(new RegExp(`"${TOML_MARK}([^"]+)"`, "g"), (match, token: string) => (isJsonNumberToken(token) ? token : match));
}

function tomlBoundary(char: string | undefined): boolean {
  if (char === undefined) return true;
  return char === " " || char === "\t" || char === "\n" || char === "\r" || char === "=" || char === "[" || char === "," || char === "{";
}

function tomlValueEnd(text: string, index: number): boolean {
  let cursor = index;
  while (text[cursor] === " " || text[cursor] === "\t") cursor += 1;
  const next = text[cursor];
  if (next === "=") return false;
  if (next === undefined) return true;
  return next === "," || next === "]" || next === "}" || next === "#" || next === "\n" || next === "\r" || next === " " || next === "\t";
}

function skipTomlString(text: string, start: number): number {
  const quote = text[start] ?? '"';
  const triple = quote + quote + quote;
  if (text.startsWith(triple, start)) {
    const end = text.indexOf(triple, start + 3);
    return end === -1 ? text.length : end + 3;
  }
  let cursor = start + 1;
  if (quote === "'") {
    while (cursor < text.length && text[cursor] !== "'") cursor += 1;
    return Math.min(text.length, cursor + 1);
  }
  while (cursor < text.length) {
    if (text[cursor] === "\\") {
      cursor += 2;
      continue;
    }
    if (text[cursor] === '"') return cursor + 1;
    if (text[cursor] === "\n") return cursor;
    cursor += 1;
  }
  return text.length;
}

function firstLine(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message.split("\n")[0] ?? fallback;
  return fallback;
}
