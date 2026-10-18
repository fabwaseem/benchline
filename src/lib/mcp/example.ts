import { z } from "zod";

type Check = {
  check?: string;
  format?: string;
  minimum?: number;
  value?: number;
  inclusive?: boolean;
};

type ZodDef = {
  type?: string;
  shape?: Record<string, z.ZodType>;
  innerType?: z.ZodType;
  element?: z.ZodType;
  options?: z.ZodType[];
  entries?: Record<string, string | number>;
  values?: unknown[];
  defaultValue?: unknown;
  valueType?: z.ZodType;
  checks?: { _zod?: { def?: Check } }[];
};

function defOf(schema: z.ZodType): ZodDef {
  const internal = schema as unknown as { _zod?: { def?: ZodDef } };
  return internal._zod?.def ?? { type: "unknown" };
}

function checksOf(def: ZodDef): Check[] {
  return (def.checks ?? []).map((check) => check._zod?.def ?? {});
}

function readDefault(value: unknown) {
  return typeof value === "function" ? (value as () => unknown)() : value;
}

function sampleString(key: string | undefined, checks: Check[]) {
  const format = checks.find((check) => check.check === "string_format")?.format;
  if (format === "url" || key === "url") return "https://example.com/file";
  if (format === "email" || key === "email") return "ada@example.com";
  if (format === "uuid") return "00000000-0000-4000-8000-000000000000";
  if (key === "json" || key === "yaml" || key === "csv") return key === "csv" ? "name,role\nAda,admin" : "{}";
  if (key === "token" || key === "jwt") return "eyJhbGciOiJub25lIn0.eyJzdWIiOiJhZGEifQ.";
  if (key === "expression" || key === "cron") return "0 * * * *";
  if (key === "html" || key === "source") return "<p>Hello</p>";
  if (key === "svg") return `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10"></svg>`;
  const min = checks.find((check) => check.check === "min_length")?.minimum ?? 1;
  const text = "example";
  if (text.length >= min) return text;
  return text.repeat(Math.ceil(min / text.length)).slice(0, Math.max(min, text.length));
}

function sampleNumber(checks: Check[]) {
  let value = 1;
  for (const check of checks) {
    if (check.check === "greater_than" && typeof check.value === "number") {
      const floor = check.inclusive === false ? check.value + 1 : check.value;
      value = Math.max(value, floor);
    }
  }
  for (const check of checks) {
    if (check.check === "less_than" && typeof check.value === "number") {
      const cap = check.inclusive === false ? check.value - 1 : check.value;
      if (value > cap) value = cap;
    }
  }
  return value;
}

function sketch(schema: z.ZodType, key?: string): unknown {
  const def = defOf(schema);
  if (def.type === "default") return readDefault(def.defaultValue);
  if (def.type === "optional") return undefined;
  if (def.type === "nullable") return def.innerType ? sketch(def.innerType, key) : null;
  if (def.type === "prefault" && def.innerType) return sketch(def.innerType, key);
  if (def.type === "catch" && def.innerType) return sketch(def.innerType, key);
  if (def.type === "readonly" && def.innerType) return sketch(def.innerType, key);
  if (def.type === "pipe" && def.innerType) return sketch(def.innerType, key);
  if (def.type === "string") return sampleString(key, checksOf(def));
  if (def.type === "number") return sampleNumber(checksOf(def));
  if (def.type === "boolean") return false;
  if (def.type === "literal") return def.values?.[0];
  if (def.type === "enum") {
    const values = def.entries ? Object.values(def.entries) : [];
    return values[0];
  }
  if (def.type === "array" && def.element) {
    const min = checksOf(def).find((check) => check.check === "min_length")?.minimum ?? 1;
    const max = checksOf(def).find((check) => check.check === "max_length")?.minimum;
    const length = max === undefined ? Math.max(min, 1) : Math.min(Math.max(min, 1), max);
    return Array.from({ length }, () => sketch(def.element as z.ZodType));
  }
  if (def.type === "union" && def.options?.length) return sketch(def.options[0]);
  if (def.type === "record") return {};
  if (def.type === "object" && def.shape) {
    const result: Record<string, unknown> = {};
    for (const [name, field] of Object.entries(def.shape)) {
      const value = sketch(field, name);
      if (value !== undefined) result[name] = value;
    }
    if ("url" in def.shape && "data" in def.shape && result.url === undefined && result.data === undefined) {
      result.url = "https://example.com/file";
    }
    return result;
  }
  return undefined;
}

function unwrap(schema: z.ZodType): z.ZodType {
  let current = schema;
  for (let i = 0; i < 6; i += 1) {
    const def = defOf(current);
    if ((def.type === "optional" || def.type === "default" || def.type === "nullable" || def.type === "prefault") && def.innerType) {
      current = def.innerType;
      continue;
    }
    return current;
  }
  return current;
}

function withOneOptionalString(schema: z.ZodType, drafted: unknown) {
  if (!drafted || typeof drafted !== "object" || Array.isArray(drafted)) return undefined;
  const shape = defOf(schema).shape;
  if (!shape) return undefined;
  const record = drafted as Record<string, unknown>;
  for (const [name, field] of Object.entries(shape)) {
    if (record[name] !== undefined) continue;
    const inner = unwrap(field);
    const def = defOf(inner);
    if (def.type !== "string") continue;
    return { ...record, [name]: sampleString(name, checksOf(def)) };
  }
  return undefined;
}

export function exampleArguments(schema: z.ZodType): unknown {
  const drafted = sketch(schema);
  const parsed = schema.safeParse(drafted);
  if (parsed.success) return parsed.data;
  const recovered = withOneOptionalString(schema, drafted);
  if (recovered) {
    const retry = schema.safeParse(recovered);
    if (retry.success) return retry.data;
  }
  const message = parsed.error.issues.map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`).join("; ");
  throw new Error(`Example does not match the input schema (${message})`);
}

export function mcpServerConfig(endpoint: string) {
  return {
    mcpServers: {
      benchline: {
        url: endpoint,
      },
    },
  };
}

export function toolsCallParams(name: string, args: unknown) {
  return {
    name,
    arguments: args,
  };
}
