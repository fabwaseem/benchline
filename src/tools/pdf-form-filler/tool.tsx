"use client";

import { useCallback, useState } from "react";
import { ActionButton, ChipButton, OptionRow, Select, TextInput, Toggle } from "@/components/kit/controls";
import { Dropzone } from "@/components/kit/dropzone";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { Pane, StatusStrip, ToolCard, ToolPanes } from "@/components/kit/shell";
import { toast } from "sonner";
import {
  fillFormFields,
  inspectFormFields,
  validateFieldValues,
  type FieldValues,
  type FormFieldInfo,
} from "@/tools/pdf-form-filler/lib/form";

function fieldInput(
  field: FormFieldInfo,
  value: string | boolean | undefined,
  onChange: (next: string | boolean) => void,
) {
  const current = value ?? (field.type === "checkbox" ? false : field.value);
  if (field.type === "checkbox") {
    return <Toggle checked={current === true} onCheckedChange={(checked) => onChange(checked)} aria-label={field.name} />;
  }
  if ((field.type === "dropdown" || field.type === "radio" || field.type === "list") && field.options) {
    return (
      <Select value={typeof current === "string" ? current : ""} onChange={(event) => onChange(event.target.value)}>
        <option value="">—</option>
        {field.options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </Select>
    );
  }
  return (
    <TextInput
      value={typeof current === "string" ? current : ""}
      maxLength={field.maxLength}
      readOnly={field.readOnly}
      placeholder={field.value || "Empty"}
      onChange={(event) => onChange(event.target.value)}
      className="font-mono"
    />
  );
}

export default function PdfFormFillerTool() {
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [fileName, setFileName] = useState("");
  const [fields, setFields] = useState<FormFieldInfo[]>([]);
  const [pageCount, setPageCount] = useState(0);
  const [values, setValues] = useState<FieldValues>({});
  const [flatten, setFlatten] = useState(false);
  const [problems, setProblems] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const openPdf = useCallback(async (file: File) => {
    setError("");
    setProblems([]);
    setValues({});
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const inspected = await inspectFormFields(bytes);
      setPdfBytes(bytes);
      setFileName(file.name);
      setFields(inspected.fields);
      setPageCount(inspected.pageCount);
      if (inspected.fields.length === 0) {
        setError("This PDF has no fillable form fields.");
      }
    } catch (openError) {
      setPdfBytes(null);
      setFields([]);
      setError(openError instanceof Error ? openError.message : "Could not read the PDF.");
    }
  }, []);

  const setValue = (name: string, next: string | boolean) => {
    setValues((previous) => ({ ...previous, [name]: next }));
    setProblems([]);
  };

  const filledCount = fields.filter((field) => {
    const value = values[field.name];
    return value !== undefined && value !== "" && value !== false;
  }).length;

  const download = async () => {
    if (!pdfBytes) return;
    const found = validateFieldValues(fields, values);
    setProblems(found);
    if (found.length > 0) {
      toast.error("Fix the highlighted problems first.");
      return;
    }
    setBusy(true);
    try {
      const result = await fillFormFields(pdfBytes, values, flatten);
      const blob = new Blob([result.bytes as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName.replace(/\.pdf$/i, "") + "-filled.pdf";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      toast.success(`Filled ${result.filled} field${result.filled === 1 ? "" : "s"}`);
    } catch (fillError) {
      setError(fillError instanceof Error ? fillError.message : "Could not fill the PDF.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolCard>
      <ToolPanes>
        <Pane label="PDF">
          <Dropzone
            accept=".pdf,application/pdf"
            label="Drop a PDF form"
            hint="Or click to browse. Stays on this device."
            onFile={(file) => void openPdf(file)}
          />
          {error && <Notice tone="bad" role="alert" title="Something went wrong" body={error} />}
          {pdfBytes && (
            <div className="rounded-lg border p-4">
              <div className="truncate text-[13px] font-medium">{fileName}</div>
              <div className="mt-1 font-mono text-[12px] text-muted-foreground">
                {pageCount} page{pageCount === 1 ? "" : "s"} · {fields.length} field{fields.length === 1 ? "" : "s"}
              </div>
            </div>
          )}
          <OptionRow label="Flatten fields after filling" checked={flatten} onChange={setFlatten} />
          <div className="text-[12px] text-muted-foreground">
            Flattening bakes the values into the page so they can no longer be edited.
          </div>
        </Pane>
        <Pane label="Fields">
          {!pdfBytes || fields.length === 0 ? (
            <EmptyState title="No fields" hint="Drop a PDF with an interactive form to list its fields here." />
          ) : (
            <>
              {problems.length > 0 && (
                <Notice
                  tone="bad"
                  role="alert"
                  title="Fix these problems"
                  body={problems.join(" ")}
                />
              )}
              <div className="flex flex-col gap-3">
                {fields.map((field) => (
                  <FieldRow
                    key={field.name}
                    label={`${field.name}${field.required ? " *" : ""}`}
                    htmlFor={`ff-${field.name}`}
                    help={`Page ${field.page} · ${field.type}${field.readOnly ? " · read-only" : ""}`}
                  >
                    <div id={`ff-${field.name}`}>
                      {fieldInput(field, values[field.name], (next) => setValue(field.name, next))}
                    </div>
                  </FieldRow>
                ))}
              </div>
              <div className="flex gap-2">
                <ActionButton className="btn btn-ink" disabled={busy} onClick={() => void download()}>
                  {busy ? "Filling…" : `Fill & download (${filledCount}/${fields.length})`}
                </ActionButton>
                <ChipButton onClick={() => setValues({})}>Clear</ChipButton>
              </div>
            </>
          )}
        </Pane>
      </ToolPanes>
      <StatusStrip>Read-only fields are skipped · dropdown values must match an option · nothing is uploaded</StatusStrip>
    </ToolCard>
  );
}
