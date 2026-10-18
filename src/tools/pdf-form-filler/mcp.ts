import { z } from "zod";
import { encodeBase64 } from "@/lib/base64";
import { mcpFileSchema, readMcpBytes } from "@/lib/mcp/bytes";
import type { BenchTool } from "@/lib/mcp/types";
import { fillFormFields, inspectFormFields } from "@/tools/pdf-form-filler/lib/form";

export const inputSchema = z.object({
  file: mcpFileSchema.describe("PDF as base64, a data URI, or a public URL. Private addresses are refused. 10 MB cap."),
  values: z
    .record(z.string(), z.union([z.string(), z.boolean()]))
    .default({})
    .describe("Field name to value. Checkboxes take booleans; dropdowns and radios take one of their options."),
  flatten: z.boolean().default(false).describe("Flatten the form so fields become plain page content."),
  inspectOnly: z.boolean().default(false).describe("List the form fields without changing anything."),
});

const fieldSchema = z.object({
  name: z.string(),
  type: z.enum(["text", "checkbox", "dropdown", "radio", "list", "unknown"]),
  page: z.number().int(),
  required: z.boolean(),
  readOnly: z.boolean(),
  maxLength: z.number().int().optional(),
  options: z.array(z.string()).optional(),
  value: z.string(),
});

export const outputSchema = z.object({
  pdf: z.string().optional().describe("Filled PDF bytes, base64 encoded."),
  fields: z.array(fieldSchema).optional().describe("Detected form fields (inspectOnly)."),
  filled: z.number().int(),
  pageCount: z.number().int(),
  mimeType: z.literal("application/pdf"),
});

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  const file = await readMcpBytes(parsed.file, "PDF");
  if (parsed.inspectOnly) {
    const inspected = await inspectFormFields(file.bytes);
    return outputSchema.parse({
      fields: inspected.fields,
      filled: 0,
      pageCount: inspected.pageCount,
      mimeType: "application/pdf",
    });
  }
  const result = await fillFormFields(file.bytes, parsed.values, parsed.flatten);
  return outputSchema.parse({
    pdf: encodeBase64(result.bytes),
    filled: result.filled,
    pageCount: result.pageCount,
    mimeType: "application/pdf",
  });
}

export const tool: BenchTool = {
  slug: "pdf-form-filler",
  name: "fill_pdf_form",
  title: "Fill a PDF form",
  description:
    "Fill an interactive PDF form's text fields, checkboxes, dropdowns, and radios by field name, with an option to flatten the result. Pass inspectOnly to list the fields first.",
  openWorld: true,
  inputSchema,
  outputSchema,
  run,
};
