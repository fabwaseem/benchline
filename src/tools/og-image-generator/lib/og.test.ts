import { describe, expect, it } from "vitest";
import { buildMetaTags, buildOpenGraphFile, ogExample } from "@/tools/og-image-generator/lib/og";

describe("og files", () => {
  it("escapes quotes and names the template", () => {
    const tags = buildMetaTags({ ...ogExample, title: `Say "hello" & go` });
    expect(tags).toContain("&quot;hello&quot;");
    expect(tags).toContain("summary_large_image");
    expect(buildOpenGraphFile(ogExample)).toContain("BLOG");
    expect(buildOpenGraphFile(ogExample)).toContain("next/og");
  });
});
