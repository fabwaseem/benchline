import { describe, expect, it } from "vitest";
import { convertJsonToTypes, exampleJson, parseJsonDocument } from "./convert";

describe("parseJsonDocument", () => {
  it("parses valid JSON", () => {
    const result = parseJsonDocument('{"a":1}');
    expect("value" in result && result.value).toEqual({ a: 1 });
  });

  it("reports invalid JSON", () => {
    const result = parseJsonDocument('{"a":}');
    expect("error" in result).toBe(true);
  });
});

describe("convertJsonToTypes", () => {
  it("converts the example to TypeScript", () => {
    const result = convertJsonToTypes(exampleJson, { rootName: "Person", targets: ["typescript"] });
    expect("error" in result).toBe(false);
    if ("error" in result) return;
    const ts = result.outputs.typescript ?? "";
    expect(ts).toContain("export interface Person");
    expect(ts).toContain("id: number;");
    expect(ts).toContain("email: null;");
    expect(ts).toContain("tags: string[];");
    expect(ts).toContain("export interface PersonAddress");
  });

  it("merges optional props across array items", () => {
    const result = convertJsonToTypes('[{"a":1},{"a":2,"b":"x"}]', { rootName: "Row", targets: ["typescript"] });
    expect("error" in result).toBe(false);
    if ("error" in result) return;
    const ts = result.outputs.typescript ?? "";
    expect(ts).toContain("a: number;");
    expect(ts).toContain("b?: string;");
  });

  it("emits zod schemas with a type export", () => {
    const result = convertJsonToTypes('{"name":"Ada","age":36}', { rootName: "User", targets: ["zod"] });
    expect("error" in result).toBe(false);
    if ("error" in result) return;
    const zod = result.outputs.zod ?? "";
    expect(zod).toContain('import { z } from "zod"');
    expect(zod).toContain("export const UserSchema = z.object({");
    expect(zod).toContain("name: z.string(),");
    expect(zod).toContain("export type User = z.infer<typeof UserSchema>;");
  });

  it("emits pydantic models", () => {
    const result = convertJsonToTypes('{"name":"Ada","nick":null}', { rootName: "User", targets: ["pydantic"] });
    expect("error" in result).toBe(false);
    if ("error" in result) return;
    const py = result.outputs.pydantic ?? "";
    expect(py).toContain("from pydantic import BaseModel");
    expect(py).toContain("class User(BaseModel):");
    expect(py).toContain("nick: Optional[Any] = None");
  });

  it("emits dataclasses", () => {
    const result = convertJsonToTypes('{"name":"Ada","age":36}', { rootName: "User", targets: ["dataclass"] });
    expect("error" in result).toBe(false);
    if ("error" in result) return;
    const py = result.outputs.dataclass ?? "";
    expect(py).toContain("@dataclass");
    expect(py).toContain("name: str = \"\"");
    expect(py).toContain("age: int = 0");
  });

  it("emits Go structs with json tags", () => {
    const result = convertJsonToTypes('{"name":"Ada","nick":null}', { rootName: "User", targets: ["go"] });
    expect("error" in result).toBe(false);
    if ("error" in result) return;
    const go = result.outputs.go ?? "";
    expect(go).toContain("type User struct {");
    expect(go).toContain('`json:"name"`');
    expect(go).toContain("Nick any");
  });

  it("warns on empty arrays", () => {
    const result = convertJsonToTypes('{"tags":[]}', { targets: ["typescript"] });
    expect("error" in result).toBe(false);
    if ("error" in result) return;
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.outputs.typescript).toContain("unknown[]");
  });

  it("rejects invalid JSON with an error", () => {
    const result = convertJsonToTypes("nope", { targets: ["typescript"] });
    expect("error" in result).toBe(true);
  });

  it("sanitizes the root name", () => {
    const result = convertJsonToTypes('{"a":1}', { rootName: "123 bad name!", targets: ["typescript"] });
    expect("error" in result).toBe(false);
    if ("error" in result) return;
    expect(result.outputs.typescript).toContain("export interface N123BadName");
  });
});
