import {
  PDFCheckBox,
  PDFDocument,
  PDFDropdown,
  PDFField,
  PDFOptionList,
  PDFRadioGroup,
  PDFTextField,
} from "pdf-lib";

export type FormFieldType = "text" | "checkbox" | "dropdown" | "radio" | "list" | "unknown";

export type FormFieldInfo = {
  name: string;
  type: FormFieldType;
  page: number;
  required: boolean;
  readOnly: boolean;
  maxLength?: number;
  options?: string[];
  value: string;
};

export type FieldValues = Record<string, string | boolean>;

function fieldType(field: PDFField): FormFieldType {
  if (field instanceof PDFTextField) return "text";
  if (field instanceof PDFCheckBox) return "checkbox";
  if (field instanceof PDFDropdown) return "dropdown";
  if (field instanceof PDFRadioGroup) return "radio";
  if (field instanceof PDFOptionList) return "list";
  return "unknown";
}

function fieldPage(doc: PDFDocument, field: PDFField): number {
  const pages = doc.getPages();
  for (const widget of field.acroField.getWidgets()) {
    const pageRef = widget.P();
    if (!pageRef) continue;
    const index = pages.findIndex((page) => page.ref.toString() === pageRef.toString());
    if (index >= 0) return index + 1;
  }
  return 1;
}

function fieldValue(field: PDFField): string {
  if (field instanceof PDFTextField) return field.getText() ?? "";
  if (field instanceof PDFCheckBox) return field.isChecked() ? "true" : "false";
  if (field instanceof PDFDropdown) return field.getSelected()[0] ?? "";
  if (field instanceof PDFRadioGroup) return field.getSelected() ?? "";
  if (field instanceof PDFOptionList) return field.getSelected().join(", ");
  return "";
}

function fieldOptions(field: PDFField): string[] | undefined {
  if (field instanceof PDFDropdown) return field.getOptions();
  if (field instanceof PDFRadioGroup) return field.getOptions();
  if (field instanceof PDFOptionList) return field.getOptions();
  return undefined;
}

export async function inspectFormFields(pdfBytes: Uint8Array): Promise<{ fields: FormFieldInfo[]; pageCount: number }> {
  let doc: PDFDocument;
  try {
    doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  } catch {
    throw new Error("That file is not a readable PDF.");
  }
  const pageCount = doc.getPageCount();
  const fields = doc
    .getForm()
    .getFields()
    .map((field) => {
      const info: FormFieldInfo = {
        name: field.getName(),
        type: fieldType(field),
        page: fieldPage(doc, field),
        required: field.isRequired(),
        readOnly: field.isReadOnly(),
        value: fieldValue(field),
      };
      if (field instanceof PDFTextField) {
        const maxLength = field.getMaxLength();
        if (maxLength !== undefined) info.maxLength = maxLength;
      }
      const options = fieldOptions(field);
      if (options) info.options = options;
      return info;
    });
  return { fields, pageCount };
}

export type FillResult = { bytes: Uint8Array; filled: number; pageCount: number };

export async function fillFormFields(
  pdfBytes: Uint8Array,
  values: FieldValues,
  flatten: boolean,
): Promise<FillResult> {
  let doc: PDFDocument;
  try {
    doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  } catch {
    throw new Error("That file is not a readable PDF.");
  }
  const form = doc.getForm();
  let filled = 0;
  for (const field of form.getFields()) {
    if (!(field.getName() in values)) continue;
    if (field.isReadOnly()) continue;
    const value = values[field.getName()];
    try {
      if (field instanceof PDFTextField && typeof value === "string") {
        field.setText(value);
        filled += 1;
      } else if (field instanceof PDFCheckBox && typeof value === "boolean") {
        if (value) field.check();
        else field.uncheck();
        filled += 1;
      } else if (field instanceof PDFDropdown && typeof value === "string") {
        if (field.getOptions().includes(value)) {
          field.select(value);
          filled += 1;
        }
      } else if (field instanceof PDFRadioGroup && typeof value === "string") {
        if (field.getOptions().includes(value)) {
          field.select(value);
          filled += 1;
        }
      } else if (field instanceof PDFOptionList && typeof value === "string") {
        const picked = value
          .split(",")
          .map((part) => part.trim())
          .filter((part) => field.getOptions().includes(part));
        if (picked.length > 0) {
          field.select(picked.length === 1 ? (picked[0] as string) : picked);
          filled += 1;
        }
      }
    } catch {
      // Leave fields that reject the value untouched.
    }
  }
  form.updateFieldAppearances();
  if (flatten) form.flatten();
  const bytes = await doc.save();
  return { bytes, filled, pageCount: doc.getPageCount() };
}

export function validateFieldValues(fields: FormFieldInfo[], values: FieldValues): string[] {
  const problems: string[] = [];
  for (const field of fields) {
    const value = values[field.name];
    if (value === undefined || value === "") {
      if (field.required) problems.push(`"${field.name}" is required.`);
      continue;
    }
    if (field.type === "text" && typeof value === "string" && field.maxLength !== undefined) {
      if (value.length > field.maxLength) {
        problems.push(`"${field.name}" is longer than ${field.maxLength} characters.`);
      }
    }
    if ((field.type === "dropdown" || field.type === "radio") && typeof value === "string" && field.options) {
      if (!field.options.includes(value)) problems.push(`"${field.name}" must be one of: ${field.options.join(", ")}.`);
    }
  }
  return problems;
}
