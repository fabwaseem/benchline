import { describe, expect, it } from "vitest";
import { classifyError } from "@/lib/analytics/clean";
import { InputError } from "@/lib/input-error";

describe("classifyError", () => {
  it("records bad input as a rejected run, not a server error", () => {
    expect(classifyError(new InputError("Decryption failed."))).toEqual({ outcome: "rejected", errorCode: "invalid_input" });
  });

  it("keeps unexpected failures as errors", () => {
    expect(classifyError(new TypeError("x is undefined")).outcome).toBe("error");
    expect(classifyError(new Error("boom"))).toEqual({ outcome: "error", errorCode: "error" });
  });
});
