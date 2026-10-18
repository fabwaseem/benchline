import Ajv, { type ErrorObject } from "ajv";
import { parse, type ParseError } from "jsonc-parser";

export type SchemaIssue = {
  path: string;
  message: string;
};

export type SchemaReport = {
  valid: boolean;
  schema: string;
  errors: SchemaIssue[];
};

type JsonSchema = {
  type?: string;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema;
  additionalProperties?: boolean;
  anyOf?: JsonSchema[];
};

const ajv = new Ajv({ allErrors: true, strict: false, validateSchema: false });

export function inspectJson(json: string, schemaText = ""): SchemaReport {
  if (json.length > 200_000) return { valid: false, schema: "", errors: [{ path: "/", message: "Use a JSON document of 200,000 characters or fewer." }] };
  const parsed = parseJson(json, "JSON");
  if ("error" in parsed) return { valid: false, schema: "", errors: [parsed.error] };
  if (schemaText.trim().length > 0) {
    if (schemaText.length > 200_000) return { valid: false, schema: schemaText, errors: [{ path: "/", message: "Use a schema of 200,000 characters or fewer." }] };
    const schema = parseJson(schemaText, "Schema");
    if ("error" in schema) return { valid: false, schema: "", errors: [schema.error] };
    return validateValue(parsed.value, schema.value, schemaText);
  }
  const inferred = inferSchema(parsed.value);
  return { valid: true, schema: JSON.stringify(inferred, null, 2), errors: [] };
}

export function exportTypes(json: string): { typescript: string; zod: string; error: string } {
  const parsed = parseJson(json, "JSON");
  if ("error" in parsed) return { typescript: "", zod: "", error: parsed.error.message };
  const emitted = emitTypes(parsed.value);
  return { typescript: emitted.typescript, zod: emitted.zod, error: "" };
}

const identifier = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

export function emitTypes(value: unknown): { typescript: string; zod: string } {
  const schema = inferSchema(value);
  return {
    typescript: `export type Root = ${tsType(schema, 0)};\n`,
    zod: `import * as z from "zod";\n\nexport const RootSchema = ${zodType(schema, 0)};\n\nexport type Root = z.infer<typeof RootSchema>;\n`,
  };
}

function tsType(schema: JsonSchema, level: number): string {
  if (schema.anyOf && schema.anyOf.length > 0) {
    return schema.anyOf.map((item) => tsType(item, level)).join(" | ");
  }
  if (schema.type === "object") {
    const properties = schema.properties ?? {};
    const keys = Object.keys(properties);
    if (keys.length === 0) return "Record<string, unknown>";
    const required = new Set(schema.required ?? []);
    const body = keys.map((key) => {
      const optional = required.has(key) ? "" : "?";
      return `${indent(level + 1)}${propertyName(key)}${optional}: ${tsType(properties[key] ?? {}, level + 1)};`;
    });
    return `{\n${body.join("\n")}\n${indent(level)}}`;
  }
  if (schema.type === "array") {
    const item = schema.items ? tsType(schema.items, level) : "unknown";
    const wrapped = schema.items?.anyOf ? `(${item})` : item;
    return `${wrapped}[]`;
  }
  if (schema.type === "integer" || schema.type === "number") return "number";
  if (schema.type === "string") return "string";
  if (schema.type === "boolean") return "boolean";
  if (schema.type === "null") return "null";
  return "unknown";
}

function zodType(schema: JsonSchema, level: number): string {
  if (schema.anyOf && schema.anyOf.length > 0) {
    const body = schema.anyOf.map((item) => `${indent(level + 1)}${zodType(item, level + 1)},`);
    return `z.union([\n${body.join("\n")}\n${indent(level)}])`;
  }
  if (schema.type === "object") {
    const properties = schema.properties ?? {};
    const keys = Object.keys(properties);
    if (keys.length === 0) return "z.record(z.string(), z.unknown())";
    const required = new Set(schema.required ?? []);
    const body = keys.map((key) => {
      const base = zodType(properties[key] ?? {}, level + 1);
      const typed = required.has(key) ? base : `${base}.optional()`;
      return `${indent(level + 1)}${propertyName(key)}: ${typed},`;
    });
    return `z.object({\n${body.join("\n")}\n${indent(level)}})`;
  }
  if (schema.type === "array") {
    const item = schema.items ? zodType(schema.items, level) : "z.unknown()";
    return `z.array(${item})`;
  }
  if (schema.type === "integer") return "z.number().int()";
  if (schema.type === "number") return "z.number()";
  if (schema.type === "string") return "z.string()";
  if (schema.type === "boolean") return "z.boolean()";
  if (schema.type === "null") return "z.null()";
  return "z.unknown()";
}

function propertyName(key: string) {
  return identifier.test(key) ? key : JSON.stringify(key);
}

function indent(level: number) {
  return "  ".repeat(level);
}

function validateValue(value: unknown, schema: unknown, raw: string): SchemaReport {
  try {
    const validate = ajv.compile(schema as object);
    const valid = validate(value);
    const errors = (validate.errors ?? []).map(issueFrom);
    return { valid: Boolean(valid), schema: pretty(schema, raw), errors };
  } catch (error) {
    return { valid: false, schema: raw, errors: [{ path: "/", message: error instanceof Error ? error.message : "That schema could not be compiled." }] };
  }
}

function issueFrom(error: ErrorObject): SchemaIssue {
  const missing = error.keyword === "required" && error.params && typeof error.params === "object" && "missingProperty" in error.params
    ? String(error.params.missingProperty)
    : "";
  const path = error.instancePath || "/";
  return {
    path: missing ? `${path === "/" ? "" : path}/${missing}` : path,
    message: error.message ?? "does not match the schema",
  };
}

export function inferSchema(value: unknown): JsonSchema {
  if (value === null) return { type: "null" };
  if (Array.isArray(value)) {
    if (value.length === 0) return { type: "array" };
    return { type: "array", items: merge(value.map((item) => inferSchema(item))) };
  }
  if (typeof value === "object") {
    const properties: Record<string, JsonSchema> = {};
    const required: string[] = [];
    for (const [key, child] of Object.entries(value)) {
      properties[key] = inferSchema(child);
      required.push(key);
    }
    return { type: "object", properties, required, additionalProperties: false };
  }
  if (typeof value === "string") return { type: "string" };
  if (typeof value === "boolean") return { type: "boolean" };
  if (typeof value === "number") return { type: Number.isInteger(value) ? "integer" : "number" };
  return {};
}

function merge(list: JsonSchema[]): JsonSchema {
  const unique: JsonSchema[] = [];
  for (const item of list) {
    if (!unique.some((existing) => JSON.stringify(existing) === JSON.stringify(item))) unique.push(item);
  }
  const only = unique[0];
  if (unique.length === 1 && only) return only;
  if (unique.every((item) => item.type === "integer" || item.type === "number")) return { type: "number" };
  if (unique.every((item) => item.type === "object" && item.properties)) return mergeObjects(unique);
  if (unique.every((item) => item.type === "array")) return { type: "array", items: merge(unique.map((item) => item.items ?? {})) };
  return { anyOf: unique };
}

function mergeObjects(list: JsonSchema[]): JsonSchema {
  const keys = new Set<string>();
  for (const item of list) {
    for (const key of Object.keys(item.properties ?? {})) keys.add(key);
  }
  const properties: Record<string, JsonSchema> = {};
  const required: string[] = [];
  for (const key of keys) {
    const present = list.filter((item) => item.properties && key in item.properties);
    properties[key] = merge(present.map((item) => item.properties?.[key] ?? {}));
    if (present.length === list.length) required.push(key);
  }
  return { type: "object", properties, required, additionalProperties: false };
}

function parseJson(text: string, label: string): { value: unknown } | { error: SchemaIssue } {
  const errors: ParseError[] = [];
  parse(text, errors, { disallowComments: true, allowTrailingComma: false });
  if (errors.length > 0) {
    const offset = errors[0]?.offset ?? 0;
    return { error: { path: position(text, offset), message: `${label} is not valid JSON.` } };
  }
  try {
    return { value: JSON.parse(text) as unknown };
  } catch (error) {
    const message = error instanceof SyntaxError ? error.message : `${label} is not valid JSON.`;
    return { error: { path: "/", message } };
  }
}

function position(text: string, offset: number) {
  const slice = text.slice(0, offset);
  const line = slice.split("\n").length;
  const column = offset - slice.lastIndexOf("\n");
  return `line ${line}, column ${column}`;
}

function pretty(schema: unknown, raw: string) {
  try {
    return JSON.stringify(schema, null, 2);
  } catch {
    return raw;
  }
}

export const exampleJson = `{
  "name": "Ada Lovelace",
  "year": 1843,
  "tags": ["math", "code"]
}`;

export const exampleSchema = `{
  "type": "object",
  "additionalProperties": false,
  "required": ["name", "year"],
  "properties": {
    "name": { "type": "string" },
    "year": { "type": "integer" },
    "tags": { "type": "array", "items": { "type": "string" } }
  }
}`;
