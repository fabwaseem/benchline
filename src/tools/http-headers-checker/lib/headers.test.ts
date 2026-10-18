import { describe, expect, it } from "vitest";
import { gradeHeaders } from "@/tools/http-headers-checker/lib/headers";

describe("gradeHeaders", () => {
  it("scores a tight HTTPS response as A and a bare response as F", () => {
    const tight = gradeHeaders(
      [
        { name: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
        { name: "Content-Security-Policy", value: "default-src 'self'; object-src 'none'; frame-ancestors 'none'" },
        { name: "X-Content-Type-Options", value: "nosniff" },
        { name: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { name: "Permissions-Policy", value: "camera=()" },
      ],
      "https://example.com/",
    );
    expect(tight.grade).toBe("A");
    const bare = gradeHeaders([{ name: "content-type", value: "text/html" }], "https://example.com/");
    expect(bare.grade).toBe("F");
    expect(bare.checks.filter((check) => check.level === "fail").length).toBeGreaterThanOrEqual(3);
  });

  it("warns when a server banner is present", () => {
    const graded = gradeHeaders(
      [
        { name: "Strict-Transport-Security", value: "max-age=31536000" },
        { name: "Content-Security-Policy", value: "default-src 'self'; frame-ancestors 'none'" },
        { name: "X-Content-Type-Options", value: "nosniff" },
        { name: "Referrer-Policy", value: "no-referrer" },
        { name: "X-Powered-By", value: "Express" },
      ],
      "https://example.com/",
    );
    expect(graded.grade).toBe("B");
  });
});
