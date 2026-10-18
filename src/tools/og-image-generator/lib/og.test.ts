import { describe, expect, it } from "vitest";
import { isValidElement } from "react";
import { layoutTitle } from "@/tools/og-image-generator/lib/fit";
import { metaTagsFor, ogExample, ogTemplates, openGraphSource, renderOg, resolveState, titleFit } from "@/tools/og-image-generator/lib/og";
import { renderOgPng } from "@/tools/og-image-generator/lib/png";
import { templateSchemaRows } from "@/tools/og-image-generator/lib/templates";

describe("og templates", () => {
  it("ships 18 named templates with schemas and defaults", () => {
    expect(ogTemplates).toHaveLength(18);
    const ids = new Set(ogTemplates.map((template) => template.id));
    expect(ids.size).toBe(18);
    for (const template of ogTemplates) {
      expect(template.name.length).toBeGreaterThan(0);
      expect(["Blog", "Product", "Dev", "Social", "Event"]).toContain(template.category);
      expect(template.fields.length).toBeGreaterThan(0);
      const rows = templateSchemaRows(template);
      expect(rows.map((row) => row.key)).toEqual(template.fields);
      const state = resolveState({ template: template.id });
      const element = renderOg(state);
      expect(isValidElement(element)).toBe(true);
      const props = element.props as { style?: { display?: string; width?: number; height?: number } };
      expect(props.style?.display).toBe("flex");
      expect(props.style?.width).toBe(1200);
      expect(props.style?.height).toBe(630);
      const source = openGraphSource(state);
      expect(source).toContain("next/og");
      expect(source.toLowerCase()).toContain(state.fields[template.headline].toLowerCase().slice(0, 12));
      expect(source).not.toContain("AURORA");
      expect(template.defaults.brand).toBe("Benchline");
    }
    const brutalist = resolveState({ template: "brutalist" });
    expect(brutalist.fields.eyebrow).toBe("Issue 04");
    expect(brutalist.fields.subtitle.length).toBeGreaterThan(0);
    expect(openGraphSource(brutalist)).toContain("ISSUE 04");
    expect(openGraphSource(brutalist)).toContain("BENCHLINE");
  });

  it("escapes meta tags and sizes the card", () => {
    const state = resolveState({ template: "aurora", title: `Say "hello" & go`, size: "1600x900" });
    const tags = metaTagsFor(state);
    expect(tags).toContain("&quot;hello&quot;");
    expect(tags).toContain("1600");
    expect(tags).toContain("summary_large_image");
    expect(state.width).toBe(1600);
    expect(state.height).toBe(900);
  });

  it("shrinks a long title until it fits the line budget", () => {
    const short = layoutTitle("Ship the note", { base: 72, min: 28, width: 900, maxLines: 3 }, 1200);
    expect(short.notice).toBe("Title fits in 1 line.");
    expect(short.clipped).toBe(false);
    const fitted = layoutTitle("A title that needs two lines on the card", { base: 92, min: 28, width: 360, maxLines: 3 }, 1200);
    expect(fitted.lines).toBeLessThanOrEqual(3);
    expect(fitted.fontSize).toBeLessThan(92);
    const clipped = layoutTitle("word ".repeat(80), { base: 72, min: 36, width: 420, maxLines: 2 }, 1200);
    expect(clipped.clipped).toBe(true);
    expect(titleFit(ogExample).notice).toMatch(/^Title fits in \d+ lines?\.$/);
  });

  it("keeps each template on its own Benchline defaults", () => {
    const editorial = resolveState({ template: "editorial" });
    const aurora = resolveState({ template: "aurora" });
    expect(editorial.fields.brand).toBe("Benchline");
    expect(editorial.fields.author).toBe("Waseem Anjum");
    expect(openGraphSource(editorial)).toContain("BENCHLINE");
    expect(openGraphSource(aurora)).toContain("BENCHLINE");
    expect(openGraphSource(aurora)).toContain("benchline.dev");
    expect(resolveState({ template: "stat" }).fields.author).toBe("Benchline");
    expect(resolveState({ template: "profile" }).fields.role).toContain("Benchline");
  });

  it("rasterizes a serif card and a terminal card to PNG", async () => {
    for (const id of ["editorial", "terminal"]) {
      const state = resolveState({ template: id });
      const png = await renderOgPng(renderOg(state), state.width, state.height);
      expect(Buffer.from(png).subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
      expect(png.byteLength).toBeGreaterThan(1000);
    }
  });
});
