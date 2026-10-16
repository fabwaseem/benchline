import { describe, expect, it } from "vitest";
import { buildMetaTags, buildOpenGraphFile, ogExample, titleFit } from "@/tools/og-image-generator/lib/og";

describe("og files", () => {
  it("escapes quotes and names the template", () => {
    const tags = buildMetaTags({ ...ogExample, title: `Say "hello" & go` });
    expect(tags).toContain("&quot;hello&quot;");
    expect(tags).toContain("summary_large_image");
    expect(buildOpenGraphFile(ogExample)).toContain("BLOG");
    expect(buildOpenGraphFile(ogExample)).toContain("next/og");
  });

  it("marks a title past 60 characters as clipped", () => {
    expect(titleFit("Ship the note").notice).toBe("Title fits in two lines.");
    const long = titleFit("A".repeat(86));
    expect(long.counter).toBe("86 / 60");
    expect(long.clipped).toBe(true);
    expect(long.notice).toContain("cuts it at line 2");
  });
});
