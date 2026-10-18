import { zipSync } from "fflate";

export function uniqueNames(names: readonly string[]): string[] {
  const seen = new Map<string, number>();
  return names.map((name) => {
    const count = seen.get(name) ?? 0;
    seen.set(name, count + 1);
    if (count === 0) return name;
    const dot = name.lastIndexOf(".");
    if (dot <= 0) return `${name}-${count + 1}`;
    return `${name.slice(0, dot)}-${count + 1}${name.slice(dot)}`;
  });
}

export function zipNamed(files: readonly { name: string; data: Uint8Array }[]): Uint8Array {
  const names = uniqueNames(files.map((file) => file.name));
  const entries: Record<string, Uint8Array> = {};
  files.forEach((file, index) => {
    const name = names[index];
    if (name) entries[name] = file.data;
  });
  return zipSync(entries, { level: 0 });
}

export function zipBlob(files: readonly { name: string; data: Uint8Array }[], type = "application/zip"): Blob {
  const zipped = zipNamed(files);
  const buffer = new ArrayBuffer(zipped.byteLength);
  new Uint8Array(buffer).set(zipped);
  return new Blob([buffer], { type });
}
