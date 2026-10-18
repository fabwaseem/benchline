import path from "node:path";
import { pathToFileURL } from "node:url";

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

export function pdfjsFolderUrl(folder: keyof typeof FOLDERS) {
  const name = folder === "cmaps" ? "cmaps" : folder === "wasm" ? "wasm" : "standard_fonts";
  return pathToFileURL(pdfPath(name) + path.sep).href;
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
