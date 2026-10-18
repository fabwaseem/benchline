import { parse, unparse, type ParseError } from "papaparse";

export const delimiters = [",", "\t", ";", "|"] as const;

export type Delimiter = (typeof delimiters)[number];
export type DelimiterChoice = Delimiter | "auto";

export type CsvOptions = {
  delimiter: DelimiterChoice;
  header: boolean;
  inferTypes: boolean;
  flatten: boolean;
};

export type CsvResult = {
  ok: boolean;
  output: string;
  error: string;
  warning: string;
  rows: number;
  columns: number;
  delimiter: Delimiter;
};

export const exampleCsv = `name,year,local
Ada,1843,true
"Lovelace, Ada",1815,false
`;

export const exampleJsonRows = `[
  {
    "name": "Ada",
    "year": 1843,
    "address": { "city": "London" }
  }
]
`;

export function detectDelimiter(input: string): Delimiter {
  const counts: Record<Delimiter, number> = { ",": 0, "\t": 0, ";": 0, "|": 0 };
  let quote = false;
  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    if (char === '"') {
      if (quote && input[index + 1] === '"') {
        index += 1;
        continue;
      }
      quote = !quote;
      continue;
    }
    if (!quote && (char === "\n" || char === "\r")) break;
    if (!quote && isDelimiter(char)) counts[char] += 1;
  }
  let best: Delimiter = ",";
  let bestCount = 0;
  for (const delimiter of delimiters) {
    if (counts[delimiter] > bestCount) {
      best = delimiter;
      bestCount = counts[delimiter];
    }
  }
  return best;
}

export function delimiterName(delimiter: Delimiter): string {
  if (delimiter === "\t") return "tab";
  if (delimiter === ";") return "semicolon";
  if (delimiter === "|") return "pipe";
  return "comma";
}

export function csvToJson(input: string, options: Pick<CsvOptions, "delimiter" | "header" | "inferTypes">): CsvResult {
  const text = input.replace(/^\uFEFF/, "");
  if (text.trim() === "") return empty("Paste CSV to convert.");
  const delimiter = options.delimiter === "auto" ? detectDelimiter(text) : options.delimiter;
  if (options.header) {
    const parsed = parse<Record<string, string>>(text, { header: true, delimiter, skipEmptyLines: "greedy" });
    const fatal = fatalError(parsed.errors);
    if (fatal) return failed(fatal, delimiter);
    const rows = parsed.data
      .filter((row) => Object.values(row).some((value) => value !== ""))
      .map((row) => mapRow(row, options.inferTypes));
    const columns = parsed.meta.fields?.length ?? columnCount(rows);
    return {
      ok: true,
      output: JSON.stringify(rows, null, 2),
      error: "",
      warning: warningOf(parsed.errors),
      rows: rows.length,
      columns,
      delimiter,
    };
  }
  const parsed = parse<string[]>(text, { header: false, delimiter, skipEmptyLines: "greedy" });
  const fatal = fatalError(parsed.errors);
  if (fatal) return failed(fatal, delimiter);
  const rows = parsed.data
    .filter((row) => row.some((value) => value !== ""))
    .map((row) => (options.inferTypes ? row.map(inferCell) : row));
  return {
    ok: true,
    output: JSON.stringify(rows, null, 2),
    error: "",
    warning: warningOf(parsed.errors),
    rows: rows.length,
    columns: rows.reduce((max, row) => Math.max(max, row.length), 0),
    delimiter,
  };
}

export function jsonToCsv(input: string, options: Pick<CsvOptions, "delimiter" | "header" | "flatten">): CsvResult {
  const text = input.replace(/^\uFEFF/, "");
  if (text.trim() === "") return empty("Paste JSON to convert.");
  const delimiter = options.delimiter === "auto" ? "," : options.delimiter;
  let value: unknown;
  try {
    value = JSON.parse(text) as unknown;
  } catch (error) {
    const message = error instanceof Error ? error.message.replace(/\s+at position \d+/, "") : "Invalid JSON";
    return { ok: false, output: "", error: message, warning: "", rows: 0, columns: 0, delimiter };
  }
  const table = toTable(value, options.flatten);
  if (!table.ok) return { ok: false, output: "", error: table.error, warning: "", rows: 0, columns: 0, delimiter };
  const output = options.header
    ? unparse({ fields: table.fields, data: table.data }, { delimiter, newline: "\n", header: true })
    : unparse(table.data, { delimiter, newline: "\n" });
  return {
    ok: true,
    output,
    error: "",
    warning: "",
    rows: table.data.length,
    columns: table.fields.length,
    delimiter,
  };
}

function toTable(value: unknown, flatten: boolean): { ok: true; fields: string[]; data: unknown[][] } | { ok: false; error: string } {
  if (Array.isArray(value)) {
    if (value.length === 0) return { ok: true, fields: [], data: [] };
    if (value.every(Array.isArray)) {
      const rows = value as unknown[][];
      const width = rows.reduce((max, row) => Math.max(max, row.length), 0);
      const fields = Array.from({ length: width }, (_, index) => String(index));
      return { ok: true, fields, data: rows.map((row) => fields.map((_, index) => cell(row[index]))) };
    }
    if (value.every(isRecord)) {
      const records = value.map((row) => (flatten ? flattenRecord(row) : row));
      return tableFromRecords(records);
    }
    return { ok: false, error: "JSON must be an array of objects, an array of arrays, or one object." };
  }
  if (isRecord(value)) return tableFromRecords([flatten ? flattenRecord(value) : value]);
  return { ok: false, error: "JSON must be an array of objects, an array of arrays, or one object." };
}

function tableFromRecords(records: Record<string, unknown>[]): { ok: true; fields: string[]; data: unknown[][] } {
  const fields: string[] = [];
  const seen = new Set<string>();
  for (const record of records) {
    for (const key of Object.keys(record)) {
      if (!seen.has(key)) {
        seen.add(key);
        fields.push(key);
      }
    }
  }
  return {
    ok: true,
    fields,
    data: records.map((record) => fields.map((field) => cell(record[field]))),
  };
}

function flattenRecord(value: unknown, prefix = "", out: Record<string, unknown> = {}): Record<string, unknown> {
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      const path = prefix ? `${prefix}.${index}` : String(index);
      if (item && typeof item === "object") flattenRecord(item, path, out);
      else out[path] = item ?? "";
    });
    return out;
  }
  if (isRecord(value)) {
    const entries = Object.entries(value);
    if (entries.length === 0 && prefix) out[prefix] = "";
    for (const [key, item] of entries) {
      const path = prefix ? `${prefix}.${key}` : key;
      if (item && typeof item === "object") flattenRecord(item, path, out);
      else out[path] = item ?? "";
    }
    return out;
  }
  if (prefix) out[prefix] = value ?? "";
  return out;
}

function mapRow(row: Record<string, string>, inferTypes: boolean): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) out[key] = inferTypes ? inferCell(value) : value;
  return out;
}

export function inferCell(value: string): string | number | boolean | null {
  const trimmed = value.trim();
  if (trimmed === "true" || trimmed === "TRUE") return true;
  if (trimmed === "false" || trimmed === "FALSE") return false;
  if (trimmed === "null" || trimmed === "NULL") return null;
  if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(trimmed)) {
    const number = Number(trimmed);
    if (Number.isFinite(number)) return number;
  }
  return value;
}

function cell(value: unknown): string | number | boolean {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  return JSON.stringify(value);
}

function columnCount(rows: Record<string, unknown>[]): number {
  return rows.reduce((max, row) => Math.max(max, Object.keys(row).length), 0);
}

function fatalError(errors: ParseError[]): string {
  const fatal = errors.find((error) => error.type === "Quotes" || error.type === "Delimiter");
  if (!fatal) return "";
  const row = fatal.row === undefined ? "" : ` (row ${fatal.row + 1})`;
  return `${fatal.message}${row}`;
}

function warningOf(errors: ParseError[]): string {
  const mismatch = errors.find((error) => error.type === "FieldMismatch");
  if (!mismatch) return "";
  const row = mismatch.row === undefined ? "" : ` on row ${mismatch.row + 1}`;
  return `${mismatch.message}${row}`;
}

function empty(error: string): CsvResult {
  return { ok: false, output: "", error, warning: "", rows: 0, columns: 0, delimiter: "," };
}

function failed(error: string, delimiter: Delimiter): CsvResult {
  return { ok: false, output: "", error, warning: "", rows: 0, columns: 0, delimiter };
}

function isDelimiter(value: string): value is Delimiter {
  return value === "," || value === "\t" || value === ";" || value === "|";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
