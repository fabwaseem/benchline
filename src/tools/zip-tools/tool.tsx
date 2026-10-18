"use client";

import { useCallback, useState } from "react";
import { ActionButton } from "@/components/kit/controls";
import { Dropzone } from "@/components/kit/dropzone";
import { EmptyState } from "@/components/kit/empty-state";
import { FileList, type FileListItem } from "@/components/kit/file-list";
import { Notice } from "@/components/kit/notice";
import { Pane, StatusStrip, ToolCard, ToolPanes, ToolToolbar } from "@/components/kit/shell";
import { Download } from "lucide-react";
import { toast } from "sonner";
import {
  formatBytes,
  isZipName,
  unzipEntries,
  zipEntries,
  zipFileName,
  type ZipEntry,
} from "@/tools/zip-tools/lib/zip";

function downloadBytes(filename: string, bytes: Uint8Array, mime: string) {
  const blob = new Blob([bytes as BlobPart], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

async function readFileBytes(file: File): Promise<Uint8Array> {
  return new Uint8Array(await file.arrayBuffer());
}

export default function ZipToolsTool() {
  const [tab, setTab] = useState<"zip" | "unzip">("zip");
  const [files, setFiles] = useState<File[]>([]);
  const [entries, setEntries] = useState<ZipEntry[]>([]);
  const [archiveName, setArchiveName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const addFiles = useCallback((incoming: File[]) => {
    setError("");
    setFiles((previous) => {
      const names = new Set(previous.map((file) => file.name));
      const fresh = incoming.filter((file) => {
        if (names.has(file.name)) {
          toast.error(`Already added: ${file.name}`);
          return false;
        }
        names.add(file.name);
        return true;
      });
      return [...previous, ...fresh];
    });
  }, []);

  const createZip = async () => {
    setError("");
    setBusy(true);
    try {
      const zipped = zipEntries(
        await Promise.all(
          files.map(async (file) => ({ name: file.name, data: await readFileBytes(file) })),
        ),
      );
      downloadBytes(zipFileName(), zipped, "application/zip");
      toast.success("ZIP downloaded");
    } catch (zipError) {
      setError(zipError instanceof Error ? zipError.message : "Could not create the ZIP.");
    } finally {
      setBusy(false);
    }
  };

  const openArchive = useCallback(async (file: File) => {
    setError("");
    setBusy(true);
    try {
      if (!isZipName(file.name)) throw new Error("That file does not look like a ZIP archive.");
      const data = await readFileBytes(file);
      setEntries(unzipEntries(data));
      setArchiveName(file.name);
    } catch (archiveError) {
      setError(archiveError instanceof Error ? archiveError.message : "Could not read the archive.");
      setEntries([]);
    } finally {
      setBusy(false);
    }
  }, []);

  const totalInput = files.reduce((sum, file) => sum + file.size, 0);
  const totalEntries = entries.reduce((sum, entry) => sum + entry.data.byteLength, 0);

  const fileItems: FileListItem[] = files.map((file, index) => ({
    id: `${index}-${file.name}`,
    name: file.name,
    meta: formatBytes(file.size),
    onRemove: () => setFiles((previous) => previous.filter((_, other) => other !== index)),
  }));

  return (
    <ToolCard>
      <ToolToolbar
        label="Mode"
        options={[
          { value: "zip", label: "Create ZIP" },
          { value: "unzip", label: "Extract" },
        ]}
        value={tab}
        onChange={setTab}
      />
      <ToolPanes>
        {tab === "zip" ? (
          <>
            <Pane label="Files">
              <Dropzone
                accept="*/*"
                multiple
                maxFiles={200}
                label="Drop files to zip"
                hint="Or click to browse. Everything stays on this device."
                onFiles={addFiles}
              />
              {error && <Notice tone="bad" role="alert" title="Something went wrong" body={error} />}
              <FileList label="Files to zip" items={fileItems} />
            </Pane>
            <Pane label="Archive">
              {files.length === 0 ? (
                <EmptyState title="No files yet" hint="Drop files on the left, then create the archive." />
              ) : (
                <>
                  <div className="rounded-lg border p-4">
                    <div className="text-[12px] text-muted-foreground">Ready to zip</div>
                    <div className="mt-1 font-mono text-2xl font-semibold">
                      {files.length} file{files.length === 1 ? "" : "s"}
                    </div>
                    <div className="mt-1 font-mono text-[13px] text-muted-foreground">{formatBytes(totalInput)} total</div>
                  </div>
                  <ActionButton className="btn btn-ink" disabled={busy} onClick={() => void createZip()}>
                    {busy ? "Zipping…" : "Create & download ZIP"}
                  </ActionButton>
                </>
              )}
            </Pane>
          </>
        ) : (
          <>
            <Pane label="Archive">
              <Dropzone
                accept=".zip,application/zip"
                label="Drop a ZIP file"
                hint="Or click to browse. Extracted in this browser."
                onFile={(file) => void openArchive(file)}
              />
              {error && <Notice tone="bad" role="alert" title="Something went wrong" body={error} />}
            </Pane>
            <Pane label="Contents">
              {entries.length === 0 ? (
                <EmptyState title="No archive open" hint={busy ? "Reading…" : "Drop a ZIP file on the left to list its contents."} />
              ) : (
                <>
                  <div className="mb-2 flex items-baseline justify-between text-[12px] text-muted-foreground">
                    <span className="truncate">{archiveName}</span>
                    <span className="font-mono">
                      {entries.length} files · {formatBytes(totalEntries)}
                    </span>
                  </div>
                  <ul className="flex flex-col gap-1.5">
                    {entries.map((entry) => (
                      <li
                        key={entry.name}
                        className="flex items-center gap-2 rounded-lg border px-2.5 py-2 text-[13px]"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium">{entry.name}</div>
                          <div className="font-mono text-[12px] text-muted-foreground">
                            {formatBytes(entry.data.byteLength)}
                          </div>
                        </div>
                        <ActionButton
                          aria-label={`Download ${entry.name}`}
                          onClick={() => downloadBytes(entry.name.split("/").pop() ?? entry.name, entry.data, "application/octet-stream")}
                        >
                          <Download className="h-4 w-4" />
                        </ActionButton>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </Pane>
          </>
        )}
      </ToolPanes>
      <StatusStrip>100 MB cap · path traversal blocked · files never leave this browser</StatusStrip>
    </ToolCard>
  );
}
