import path from "node:path";

const FOLDERS = {
  standard_fonts: "standard_fonts",
  cmaps: "cmaps",
  wasm: "wasm",
} as const;

export function pdfjsRoot() {
  return path.join(process.cwd(), "node_modules", "pdfjs-dist");
}

function pdfPath(...parts: string[]) {
  return path.join(pdfjsRoot(), ...parts);
}

/**
 * A folder for pdf.js running in Node. Its Node data factories call fs.readFile on the string,
 * which treats a "file://" string as a literal path and fails, so this is a plain path.
 * pdf.js requires a trailing "/", which fs also accepts on Windows.
 */
export function pdfjsFolderPath(folder: keyof typeof FOLDERS) {
  return `${pdfPath(FOLDERS[folder])}/`;
}

function safeName(name: string) {
  return /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(name) && !name.includes("..");
}

function contentType(name: string) {
  if (name.endsWith(".mjs") || name.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (name.endsWith(".wasm")) return "application/wasm";
  if (name.endsWith(".ttf")) return "font/ttf";
  return "application/octet-stream";
}

function folderName(folder: string) {
  if (folder === "cmaps") return "cmaps";
  if (folder === "wasm") return "wasm";
  return "standard_fonts";
}

export function resolvePdfAsset(parts: string[]) {
  if (parts.length === 1 && (parts[0] === "pdf.worker.min.mjs" || parts[0] === "pdf.mjs")) {
    return { file: pdfPath("build", parts[0]), contentType: contentType(parts[0]) };
  }
  if (parts.length !== 2) return null;
  const [folder, name] = parts;
  if (!folder || !name || !safeName(name) || !(folder in FOLDERS)) return null;
  const dir = pdfPath(folderName(folder));
  const file = pdfPath(folderName(folder), name);
  if (!file.startsWith(dir + path.sep)) return null;
  return { file, contentType: contentType(name) };
}
