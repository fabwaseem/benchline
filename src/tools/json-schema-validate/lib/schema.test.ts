import { describe, expect, it } from "vitest";
import { exportTypes, inferSchema, inspectJson } from "@/tools/json-schema-validate/lib/schema";

describe("JSON schema", () => {
  it("infers objects, arrays, and mixed numbers", () => {
    const schema = inferSchema({ id: 1, score: 1.5, tags: ["a", "b"], nested: [{ on: true }, { on: false, extra: "x" }] });
    expect(schema.type).toBe("object");
    expect(schema.properties?.id).toEqual({ type: "integer" });
    expect(schema.properties?.score).toEqual({ type: "number" });
    expect(schema.properties?.tags).toEqual({ type: "array", items: { type: "string" } });
    const nested = schema.properties?.nested?.items;
    expect(nested?.required).toEqual(["on"]);
    expect(nested?.properties?.extra).toEqual({ type: "string" });
  });

  it("validates a document and reports the missing path", () => {
    const report = inspectJson('{"name":1}', '{"type":"object","required":["name","year"],"properties":{"name":{"type":"string"},"year":{"type":"integer"}}}');
    expect(report.valid).toBe(false);
    expect(report.errors.map((error) => error.path).sort()).toEqual(["/name", "/year"]);
  });

  it("names the line of broken JSON and accepts a matching document", () => {
    const broken = inspectJson('{\n"a": ');
    expect(broken.valid).toBe(false);
    expect(broken.errors[0]?.path).toMatch(/line 2/);
    const ok = inspectJson('{"name":"Ada","year":1843}', '{"type":"object","required":["name"],"properties":{"name":{"type":"string"},"year":{"type":"integer"}}}');
    expect(ok.valid).toBe(true);
    expect(ok.errors).toEqual([]);
  });

  it("exports TypeScript and Zod from a sample", () => {
    const exported = exportTypes('{"name":"Ada","year":1843}');
    expect(exported).toEqual({
      error: "",
      typescript: "export type Root = {\n  name: string;\n  year: number;\n};\n",
      zod: "import * as z from \"zod\";\n\nexport const RootSchema = z.object({\n  name: z.string(),\n  year: z.number().int(),\n});\n\nexport type Root = z.infer<typeof RootSchema>;\n",
    });
  });

  it("marks keys missing from some array items as optional and unions mixed items", () => {
    const mixed = exportTypes('[{"on":true},{"on":false,"extra":"x"}]');
    expect(mixed.typescript).toBe("export type Root = {\n  on: boolean;\n  extra?: string;\n}[];\n");
    expect(mixed.zod).toContain("extra: z.string().optional()");
    const union = exportTypes('[1, "a"]');
    expect(union.typescript).toBe("export type Root = (number | string)[];\n");
    expect(union.zod).toContain("z.number().int()");
    expect(union.zod).toContain("z.string()");
  });
});
