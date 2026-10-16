import { describe, expect, it } from "vitest";
import { buildSchema, exampleValues, graphOf, scriptTag, validateSchema } from "@/tools/schema-generator/lib/schema";

describe("schema", () => {
  it("strips empty fields and warns when a product has no offer", () => {
    const data = buildSchema("Article", { ...exampleValues("Article"), image: "" });
    expect(data).not.toHaveProperty("image");
    expect(scriptTag(data)).toContain("application/ld+json");
    const product = validateSchema("Product", { name: "Lamp" });
    expect(product.some((check) => check.level === "fail")).toBe(true);
    const graph = graphOf([buildSchema("Product", exampleValues("Product")), buildSchema("BreadcrumbList", exampleValues("BreadcrumbList"))]);
    expect(Array.isArray(graph["@graph"])).toBe(true);
  });
});
