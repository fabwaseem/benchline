import { inexactJsonNumberTokens } from "@/lib/json-lossless";

export type Target = "typescript" | "zod" | "pydantic" | "dataclass" | "go";

export const TARGETS: Target[] = ["typescript", "zod", "pydantic", "dataclass", "go"];

export const TARGET_LABELS: Record<Target, string> = {
  typescript: "TypeScript",
  zod: "Zod",
  pydantic: "Pydantic",
  dataclass: "Dataclass",
  go: "Go",
};

export type Inferred =
  | { kind: "string" }
  | { kind: "number"; float: boolean }
  | { kind: "boolean" }
  | { kind: "null" }
  | { kind: "unknown" }
  | { kind: "array"; items: Inferred }
  | { kind: "union"; options: Inferred[] }
  | { kind: "object"; name: string; props: Prop[] };

export interface Prop {
  name: string;
  type: Inferred;
  optional: boolean;
}

export interface ConvertResult {
  outputs: Partial<Record<Target, string>>;
  warnings: string[];
}

export function parseJsonDocument(text: string): { value: unknown } | { error: string } {
  try {
    return { value: JSON.parse(text) as unknown };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid JSON";
    return { error: message.replace(/^JSON\.parse:\s*/, "") };
  }
}

function toPascalCase(name: string): string {
  const words = name.replace(/[^a-zA-Z0-9]+/g, " ").trim().split(/\s+/).filter(Boolean);
  const pascal = words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("");
  const clean = pascal.replace(/[^a-zA-Z0-9]/g, "") || "Root";
  return /^[0-9]/.test(clean) ? `N${clean}` : clean;
}

function canonical(type: Inferred): string {
  switch (type.kind) {
    case "object": {
      const props = [...type.props]
        .sort((a, b) => (a.name < b.name ? -1 : 1))
        .map((p) => `${p.name}${p.optional ? "?" : ""}:${canonical(p.type)}`);
      return `object{${props.join(",")}}`;
    }
    case "array":
      return `array<${canonical(type.items)}>`;
    case "union":
      return `union<${type.options.map(canonical).join("|")}>`;
    case "number":
      return type.float ? "float" : "int";
    default:
      return type.kind;
  }
}

class Namer {
  private used = new Set<string>();
  unique(base: string): string {
    let name = toPascalCase(base);
    let i = 2;
    while (this.used.has(name)) {
      name = `${toPascalCase(base)}${i}`;
      i += 1;
    }
    this.used.add(name);
    return name;
  }
}

function mergeInferred(types: Inferred[]): Inferred {
  const seen = new Map<string, Inferred>();
  for (const t of types) {
    const key = canonical(t);
    if (!seen.has(key)) seen.set(key, t);
  }
  const uniq = [...seen.values()];
  if (uniq.length === 0) return { kind: "unknown" };
  if (uniq.length === 1) return uniq[0] as Inferred;
  const objects = uniq.filter((t) => t.kind === "object");
  if (objects.length === uniq.length) {
    const merged = new Map<string, { type: Inferred; optional: boolean; count: number }>();
    for (const obj of objects) {
      if (obj.kind !== "object") continue;
      for (const prop of obj.props) {
        const entry = merged.get(prop.name);
        if (!entry) {
          merged.set(prop.name, { type: prop.type, optional: false, count: 1 });
        } else {
          entry.type = mergeInferred([entry.type, prop.type]);
          entry.count += 1;
        }
      }
    }
    const props: Prop[] = [...merged.entries()].map(([name, entry]) => ({
      name,
      type: entry.type,
      optional: entry.count < objects.length,
    }));
    const first = objects[0];
    const name = first && first.kind === "object" ? first.name : "Item";
    return { kind: "object", name, props };
  }
  return { kind: "union", options: uniq };
}

function inferValue(value: unknown, nameHint: string, namer: Namer): Inferred {
  if (value === null) return { kind: "null" };
  if (typeof value === "string") return { kind: "string" };
  if (typeof value === "boolean") return { kind: "boolean" };
  if (typeof value === "number") return { kind: "number", float: !Number.isInteger(value) };
  if (Array.isArray(value)) {
    if (value.length === 0) return { kind: "array", items: { kind: "unknown" } };
    const items = mergeInferred(value.map((v) => inferValue(v, `${nameHint}Item`, namer)));
    return { kind: "array", items };
  }
  if (typeof value === "object") {
    const name = namer.unique(nameHint);
    const props: Prop[] = Object.entries(value as Record<string, unknown>).map(([key, v]) => ({
      name: key,
      type: inferValue(v, `${name}${toPascalCase(key)}`, namer),
      optional: false,
    }));
    return { kind: "object", name, props };
  }
  return { kind: "unknown" };
}

function collectObjects(root: Inferred): Array<Extract<Inferred, { kind: "object" }>> {
  const out: Array<Extract<Inferred, { kind: "object" }>> = [];
  const seen = new Set<string>();
  const walk = (t: Inferred): void => {
    if (t.kind === "object") {
      if (!seen.has(t.name)) {
        seen.add(t.name);
        out.push(t);
      }
      for (const p of t.props) walk(p.type);
    } else if (t.kind === "array") {
      walk(t.items);
    } else if (t.kind === "union") {
      for (const o of t.options) walk(o);
    }
  };
  walk(root);
  return out;
}

function tsKey(name: string): string {
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name) ? name : JSON.stringify(name);
}

function tsType(t: Inferred): string {
  switch (t.kind) {
    case "string": return "string";
    case "number": return "number";
    case "boolean": return "boolean";
    case "null": return "null";
    case "unknown": return "unknown";
    case "array": return `${tsType(t.items)}[]`;
    case "union": return t.options.map(tsType).join(" | ");
    case "object": return t.name;
  }
}

function generateTypeScript(root: Inferred): string {
  const objects = collectObjects(root);
  const blocks: string[] = [];
  if (root.kind !== "object") {
    blocks.push(`export type Root = ${tsType(root)};`);
  }
  for (const obj of objects) {
    const lines = obj.props.map((p) => {
      const nullable = p.type.kind === "null" || (p.type.kind === "union" && p.type.options.some((o) => o.kind === "null"));
      const base = tsType(p.type);
      return `  ${tsKey(p.name)}${p.optional ? "?" : ""}: ${nullable && !base.includes("null") ? `${base} | null` : base};`;
    });
    blocks.push(`export interface ${obj.name} {\n${lines.join("\n")}\n}`);
  }
  return blocks.join("\n\n") + "\n";
}

function zodType(t: Inferred): string {
  switch (t.kind) {
    case "string": return "z.string()";
    case "number": return "z.number()";
    case "boolean": return "z.boolean()";
    case "null": return "z.null()";
    case "unknown": return "z.unknown()";
    case "array": return `z.array(${zodType(t.items)})`;
    case "union": return `z.union([${t.options.map(zodType).join(", ")}])`;
    case "object": return `${t.name}Schema`;
  }
}

function generateZod(root: Inferred): string {
  const objects = collectObjects(root);
  const blocks: string[] = [`import { z } from "zod";`];
  for (const obj of objects) {
    const lines = obj.props.map((p) => {
      let expr = zodType(p.type);
      const nullable = p.type.kind === "null" || (p.type.kind === "union" && p.type.options.some((o) => o.kind === "null"));
      if (nullable && !expr.includes("z.null()")) expr = `${expr}.nullable()`;
      if (p.optional) expr = `${expr}.optional()`;
      return `  ${tsKey(p.name)}: ${expr},`;
    });
    blocks.push(`export const ${obj.name}Schema = z.object({\n${lines.join("\n")}\n});`);
  }
  const rootName = root.kind === "object" ? root.name : "Root";
  if (root.kind === "object") {
    blocks.push(`export type ${rootName} = z.infer<typeof ${rootName}Schema>;`);
  } else {
    blocks.push(`export const RootSchema = ${zodType(root)};`, `export type Root = z.infer<typeof RootSchema>;`);
  }
  return blocks.join("\n\n") + "\n";
}

function pyName(name: string): string {
  const clean = name.replace(/[^a-zA-Z0-9_]/g, "_") || "field";
  return /^[0-9]/.test(clean) ? `_${clean}` : clean;
}

function pyType(t: Inferred): string {
  switch (t.kind) {
    case "string": return "str";
    case "number": return t.float ? "float" : "int";
    case "boolean": return "bool";
    case "null": return "None";
    case "unknown": return "Any";
    case "array": return `list[${pyType(t.items)}]`;
    case "union": return `Union[${t.options.map(pyType).join(", ")}]`;
    case "object": return t.name;
  }
}

function generatePydantic(root: Inferred): string {
  const objects = collectObjects(root);
  const needsOptional = objects.some((o) => o.props.some((p) => p.optional || p.type.kind === "null"));
  const needsUnion = objects.some((o) => o.props.some((p) => p.type.kind === "union"));
  const lines: string[] = ["from pydantic import BaseModel"];
  const typing: string[] = [];
  if (needsOptional) typing.push("Optional");
  if (needsUnion) typing.push("Union");
  typing.push("Any");
  lines.push(`from typing import ${[...new Set(typing)].sort().join(", ")}`, "");
  const ordered = [...objects].reverse();
  for (const obj of ordered) {
    lines.push(`class ${obj.name}(BaseModel):`);
    if (obj.props.length === 0) lines.push("    pass");
    for (const p of obj.props) {
      const nullable = p.type.kind === "null";
      let ann = pyType(p.type);
      if (p.optional || nullable) ann = `Optional[${ann === "None" ? "Any" : ann}]`;
      const def = p.optional || nullable ? " = None" : "";
      lines.push(`    ${pyName(p.name)}: ${ann}${def}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

function generateDataclass(root: Inferred): string {
  const objects = collectObjects(root);
  const lines: string[] = ["from dataclasses import dataclass", "from typing import Any, Optional, Union", ""];
  const ordered = [...objects].reverse();
  for (const obj of ordered) {
    lines.push("@dataclass", `class ${obj.name}:`);
    if (obj.props.length === 0) lines.push("    pass");
    for (const p of obj.props) {
      let ann = pyType(p.type);
      let def: string;
      if (p.type.kind === "object" || p.type.kind === "array") {
        ann = `Optional[${ann}]`;
        def = " = None";
      } else if (p.optional || p.type.kind === "null") {
        ann = `Optional[${ann === "None" ? "Any" : ann}]`;
        def = " = None";
      } else if (p.type.kind === "string") {
        def = ' = ""';
      } else if (p.type.kind === "number") {
        def = " = 0";
      } else if (p.type.kind === "boolean") {
        def = " = False";
      } else {
        ann = `Optional[${ann}]`;
        def = " = None";
      }
      lines.push(`    ${pyName(p.name)}: ${ann}${def}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

function goExport(name: string): string {
  const clean = name.replace(/[^a-zA-Z0-9_]/g, "_") || "Field";
  const titled = clean.charAt(0).toUpperCase() + clean.slice(1);
  return /^[0-9]/.test(titled) ? `F${titled}` : titled;
}

function goType(t: Inferred): string {
  switch (t.kind) {
    case "string": return "string";
    case "number": return t.float ? "float64" : "int";
    case "boolean": return "bool";
    case "null": return "any";
    case "unknown": return "any";
    case "array": return `[]${goType(t.items)}`;
    case "union": return "any";
    case "object": return t.name;
  }
}

function generateGo(root: Inferred): string {
  const objects = collectObjects(root);
  const lines: string[] = ["package main", ""];
  const ordered = [...objects].reverse();
  for (const obj of ordered) {
    lines.push(`type ${obj.name} struct {`);
    if (obj.props.length === 0) lines.push("    // empty object");
    for (const p of obj.props) {
      let typ = goType(p.type);
      const tag = `\`json:"${p.name}${p.optional ? ",omitempty" : ""}"\``;
      if (p.optional && p.type.kind !== "array" && typ !== "any") typ = `*${typ}`;
      if (p.type.kind === "null") typ = "any";
      lines.push(`    ${goExport(p.name)} ${typ} ${tag}`);
    }
    lines.push("}", "");
  }
  return lines.join("\n");
}

function collectWarnings(root: Inferred): string[] {
  const warnings: string[] = [];
  const walk = (t: Inferred): void => {
    if (t.kind === "array" && t.items.kind === "unknown") warnings.push("Empty array inferred as unknown[] — fill it in for a precise type.");
    if (t.kind === "union") warnings.push("Mixed value types inferred as a union — check the variants.");
    if (t.kind === "unknown") warnings.push("An untyped value was inferred as unknown/any.");
    if (t.kind === "object") for (const p of t.props) walk(p.type);
    else if (t.kind === "array") walk(t.items);
    else if (t.kind === "union") for (const o of t.options) walk(o);
  };
  walk(root);
  return [...new Set(warnings)];
}

export function convertJsonToTypes(
  text: string,
  opts: { rootName?: string; targets?: Target[] } = {},
): { outputs: Partial<Record<Target, string>>; warnings: string[] } | { error: string } {
  const parsed = parseJsonDocument(text);
  if ("error" in parsed) return { error: parsed.error };
  const targets = opts.targets && opts.targets.length > 0 ? opts.targets : (["typescript"] as Target[]);
  const rootName = toPascalCase(opts.rootName?.trim() || "Root");
  const namer = new Namer();
  const root = inferValue(parsed.value, rootName, namer);
  const generators: Record<Target, (r: Inferred) => string> = {
    typescript: generateTypeScript,
    zod: generateZod,
    pydantic: generatePydantic,
    dataclass: generateDataclass,
    go: generateGo,
  };
  const outputs: Partial<Record<Target, string>> = {};
  for (const target of targets) outputs[target] = generators[target](root);
  const warnings = collectWarnings(root);
  const lost = inexactJsonNumberTokens(text);
  if (lost.length > 0) {
    const sample = lost.slice(0, 3).join(", ");
    warnings.push(`${sample} ${lost.length === 1 ? "does" : "do"} not fit in a JavaScript number, so these types cannot keep those digits.`);
  }
  return { outputs, warnings };
}

export const exampleJson = `{
  "id": 42,
  "name": "Ada Lovelace",
  "email": null,
  "verified": true,
  "score": 9.5,
  "tags": ["analytical-engine", "mathematics"],
  "address": {
    "city": "London",
    "zip": "W1A"
  },
  "notes": []
}`;
