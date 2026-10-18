import { describe, expect, it } from "vitest";
import { formatLabel, presentCodes } from "@/tools/qr-code-reader/lib/codes";

describe("barcode labels", () => {
  it("names common formats and drops blanks", () => {
    expect(formatLabel("QRCode")).toBe("QR Code");
    expect(formatLabel("EAN13")).toBe("EAN-13");
    expect(formatLabel("Custom")).toBe("Custom");
    expect(presentCodes([
      { format: "QRCode", text: "  hello \u0000" },
      { format: "QRCode", text: "hello" },
      { format: "Code128", text: "   " },
    ])).toEqual([{ text: "hello", format: "QRCode", label: "QR Code" }]);
  });
});
