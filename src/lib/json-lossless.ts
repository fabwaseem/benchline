// JSON.parse stores every number as a float, so integers past 2^53 and long
// decimals change value. Tokens that still mean the same value are left for
// JSON.stringify to canonicalize. Tokens that would change are kept verbatim.

const rawBrand: unique symbol = Symbol("rawJsonNumber");

export type RawJsonNumber = { readonly [rawBrand]: string };

const JSON_NUMBER = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/;
const JSON_INTEGER = /^-?(?:0|[1-9]\d*)$/;

export function rawJsonNumber(source: string): RawJsonNumber {
  return { [rawBrand]: source };
}

export function rawJsonNumberSource(value: unknown): string | null {
  if (!value || typeof value !== "object" || !(rawBrand in value)) return null;
  const source = (value as RawJsonNumber)[rawBrand];
  return typeof source === "string" ? source : null;
}

export function isJsonNumberToken(source: string): boolean {
  return JSON_NUMBER.test(source);
}

export function isJsonIntegerToken(source: string): boolean {
  return JSON_INTEGER.test(source);
}

export function jsonNumberTokenIsExact(source: string): boolean {
  if (!isJsonNumberToken(source)) return false;
  let parsed: unknown;
  try {
    parsed = JSON.parse(source);
  } catch {
    return false;
  }
  if (typeof parsed !== "number" || !Number.isFinite(parsed)) return false;
  const canonical = JSON.stringify(parsed);
  if (canonical === source) return true;
  const left = normalizeJsonNumber(source);
  const right = normalizeJsonNumber(canonical);
  return left !== null && left === right;
}

export function jsonNumberTokens(text: string): string[] {
  const tokens: string[] = [];
  let index = 0;
  while (index < text.length) {
    const char = text[index] ?? "";
    if (char === '"') {
      index = skipJsonString(text, index);
      continue;
    }
    const token = readJsonNumberAt(text, index);
    if (token) {
      tokens.push(token);
      index += token.length;
      continue;
    }
    index += 1;
  }
  return tokens;
}

export function inexactJsonNumberTokens(text: string): string[] {
  return jsonNumberTokens(text).filter((token) => !jsonNumberTokenIsExact(token));
}

export function readJsonNumberAt(text: string, index: number): string | null {
  let cursor = index;
  if (text[cursor] === "-") cursor += 1;
  const first = text[cursor];
  if (first === "0") cursor += 1;
  else if (first !== undefined && first >= "1" && first <= "9") {
    while ((text[cursor] ?? "") >= "0" && (text[cursor] ?? "") <= "9") cursor += 1;
  } else {
    return null;
  }
  if (text[cursor] === ".") {
    cursor += 1;
    const fraction = cursor;
    while ((text[cursor] ?? "") >= "0" && (text[cursor] ?? "") <= "9") cursor += 1;
    if (cursor === fraction) return null;
  }
  if (text[cursor] === "e" || text[cursor] === "E") {
    cursor += 1;
    if (text[cursor] === "+" || text[cursor] === "-") cursor += 1;
    const exponent = cursor;
    while ((text[cursor] ?? "") >= "0" && (text[cursor] ?? "") <= "9") cursor += 1;
    if (cursor === exponent) return null;
  }
  if (cursor === index || (text[index] === "-" && cursor === index + 1)) return null;
  return text.slice(index, cursor);
}

type ParseContext = { source?: string };

export function parseJsonLossless(text: string): unknown {
  const tokens = jsonNumberTokens(text);
  let index = 0;
  return JSON.parse(text, (_key, value: unknown, context?: ParseContext) => {
    if (typeof value !== "number") return value;
    const scanned = tokens[index];
    index += 1;
    const source = context?.source ?? scanned;
    if (typeof source === "string" && !jsonNumberTokenIsExact(source)) return rawJsonNumber(source);
    return value;
  });
}

export function stringifyJsonLossless(value: unknown, space?: string | number): string {
  return printValue(value, indentUnit(space), 0);
}

function indentUnit(space: string | number | undefined): string {
  if (typeof space === "number") {
    if (!Number.isFinite(space) || space <= 0) return "";
    return " ".repeat(Math.min(10, Math.floor(space)));
  }
  if (typeof space !== "string" || space.length === 0) return "";
  return space.slice(0, 10);
}

function printValue(value: unknown, gap: string, depth: number): string {
  const raw = rawJsonNumberSource(value);
  if (raw !== null) return raw;
  if (typeof value === "bigint") return value.toString();
  if (value === null || typeof value !== "object") {
    const printed = JSON.stringify(value);
    return printed === undefined ? "null" : printed;
  }
  if (Array.isArray(value)) return printArray(value, gap, depth);
  return printObject(value as Record<string, unknown>, gap, depth);
}

function printArray(value: unknown[], gap: string, depth: number): string {
  if (value.length === 0) return "[]";
  const items = value.map((item) => printValue(item, gap, depth + 1));
  if (!gap) return `[${items.join(",")}]`;
  const pad = gap.repeat(depth + 1);
  return `[\n${items.map((item) => `${pad}${item}`).join(",\n")}\n${gap.repeat(depth)}]`;
}

function printObject(value: Record<string, unknown>, gap: string, depth: number): string {
  const keys = Object.keys(value);
  if (keys.length === 0) return "{}";
  const items = keys.map((key) => {
    const body = printValue(value[key], gap, depth + 1);
    return `${JSON.stringify(key)}:${gap ? " " : ""}${body}`;
  });
  if (!gap) return `{${items.join(",")}}`;
  const pad = gap.repeat(depth + 1);
  return `{\n${items.map((item) => `${pad}${item}`).join(",\n")}\n${gap.repeat(depth)}}`;
}

function skipJsonString(text: string, index: number): number {
  let cursor = index + 1;
  while (cursor < text.length) {
    if (text[cursor] === "\\") {
      cursor += 2;
      continue;
    }
    if (text[cursor] === '"') return cursor + 1;
    cursor += 1;
  }
  return text.length;
}

function normalizeJsonNumber(token: string): string | null {
  const match = /^(-?)(\d+)(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/.exec(token);
  if (!match) return null;
  const sign = match[1] === "-" ? "-" : "";
  const whole = match[2] ?? "0";
  const fraction = match[3] ?? "";
  const exponentText = match[4];
  if (exponentText && !Number.isSafeInteger(Number(exponentText))) return `${sign}${whole}${fraction}e${exponentText}`;
  let exponent = exponentText ? Number(exponentText) : 0;
  let digits = `${whole}${fraction}`.replace(/^0+/, "");
  exponent -= fraction.length;
  if (digits.length === 0) return "0";
  while (digits.endsWith("0") && digits.length > 1) {
    digits = digits.slice(0, -1);
    exponent += 1;
  }
  if (digits === "0") return "0";
  return `${sign}${digits}e${exponent}`;
}
