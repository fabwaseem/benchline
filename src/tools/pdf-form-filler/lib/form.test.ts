import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { fillFormFields, inspectFormFields, validateFieldValues } from "./form";

async function samplePdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([400, 400]);
  const form = doc.getForm();
  const name = form.createTextField("full_name");
  name.addToPage(page, { x: 50, y: 300, width: 200, height: 24 });
  const subscribe = form.createCheckBox("subscribe");
  subscribe.addToPage(page, { x: 50, y: 250, width: 16, height: 16 });
  const color = form.createDropdown("color");
  color.addOptions(["red", "green", "blue"]);
  color.addToPage(page, { x: 50, y: 200, width: 120, height: 24 });
  return doc.save();
}

describe("inspectFormFields", () => {
  it("lists fields with types and pages", async () => {
    const { fields, pageCount } = await inspectFormFields(await samplePdf());
    expect(pageCount).toBe(1);
    expect(fields.map((field) => field.name).sort()).toEqual(["color", "full_name", "subscribe"]);
    const byName = new Map(fields.map((field) => [field.name, field]));
    expect(byName.get("full_name")?.type).toBe("text");
    expect(byName.get("subscribe")?.type).toBe("checkbox");
    expect(byName.get("color")?.type).toBe("dropdown");
    expect(byName.get("color")?.options).toEqual(["red", "green", "blue"]);
    expect(byName.get("full_name")?.page).toBe(1);
  });

  it("rejects non-pdfs", async () => {
    await expect(inspectFormFields(new Uint8Array([1, 2, 3]))).rejects.toThrow("not a readable PDF");
  });

  it("reports no fields for a plain pdf", async () => {
    const doc = await PDFDocument.create();
    doc.addPage([200, 200]);
    const { fields } = await inspectFormFields(await doc.save());
    expect(fields).toEqual([]);
  });
});

describe("fillFormFields", () => {
  it("fills text, checkbox, and dropdown", async () => {
    const { bytes, filled, pageCount } = await fillFormFields(
      await samplePdf(),
      { full_name: "Ada Lovelace", subscribe: true, color: "green" },
      false,
    );
    expect(pageCount).toBe(1);
    expect(filled).toBe(3);
    const { fields } = await inspectFormFields(bytes);
    const byName = new Map(fields.map((field) => [field.name, field]));
    expect(byName.get("full_name")?.value).toBe("Ada Lovelace");
    expect(byName.get("subscribe")?.value).toBe("true");
    expect(byName.get("color")?.value).toBe("green");
  });

  it("ignores invalid option values", async () => {
    const { filled } = await fillFormFields(await samplePdf(), { color: "purple" }, false);
    expect(filled).toBe(0);
  });

  it("flattens when asked", async () => {
    const { bytes } = await fillFormFields(await samplePdf(), { full_name: "Ada" }, true);
    const { fields } = await inspectFormFields(bytes);
    expect(fields).toEqual([]);
  });
});

describe("validateFieldValues", () => {
  it("flags required and overlong values", () => {
    const problems = validateFieldValues(
      [
        { name: "a", type: "text", page: 1, required: true, readOnly: false, value: "" },
        { name: "b", type: "text", page: 1, required: false, readOnly: false, value: "", maxLength: 3 },
      ],
      { b: "way too long" },
    );
    expect(problems).toEqual(['"a" is required.', '"b" is longer than 3 characters.']);
  });

  it("passes clean input", () => {
    expect(
      validateFieldValues(
        [{ name: "c", type: "dropdown", page: 1, required: false, readOnly: false, value: "", options: ["x", "y"] }],
        { c: "x" },
      ),
    ).toEqual([]);
  });
});
