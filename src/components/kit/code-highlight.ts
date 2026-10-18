import type { ThemeRegistration, ThemedTokenWithVariants } from "shiki/core";

export const PLAIN_BYTE_LIMIT = 200 * 1024;

const light = "#16130F";
const lightMuted = "#6B645B";
const lightAccent = "#9A3412";
const lightString = "#0E6B45";
const lightFunction = "#1E4E8C";
const lightType = "#6D28D9";

const dark = "#F6F4EF";
const darkMuted = "#A39C91";
const darkAccent = "#FF9A55";
const darkString = "#8FDBB2";
const darkFunction = "#9CC7FF";
const darkType = "#D2B4FF";

export const benchLight: ThemeRegistration = {
  name: "bench-light",
  type: "light",
  colors: {
    "editor.background": "#F3F0E9",
    "editor.foreground": light,
  },
  tokenColors: [
    { scope: ["comment", "punctuation.definition.comment"], settings: { foreground: lightMuted, fontStyle: "italic" } },
    { scope: ["keyword", "storage", "storage.type"], settings: { foreground: lightAccent } },
    { scope: ["string", "string.quoted"], settings: { foreground: lightString } },
    { scope: ["constant.numeric", "constant.language"], settings: { foreground: lightAccent } },
    { scope: ["entity.name.function", "support.function"], settings: { foreground: lightFunction } },
    { scope: ["entity.name.type", "entity.name.class", "support.type", "support.class"], settings: { foreground: lightType } },
    { scope: ["entity.name.tag", "punctuation.definition.tag"], settings: { foreground: lightAccent } },
    { scope: ["variable", "variable.other"], settings: { foreground: light } },
    { scope: ["punctuation", "meta.brace"], settings: { foreground: "#3A342C" } },
  ],
};

export const benchDark: ThemeRegistration = {
  name: "bench-dark",
  type: "dark",
  colors: {
    "editor.background": "#181512",
    "editor.foreground": dark,
  },
  tokenColors: [
    { scope: ["comment", "punctuation.definition.comment"], settings: { foreground: darkMuted, fontStyle: "italic" } },
    { scope: ["keyword", "storage", "storage.type"], settings: { foreground: darkAccent } },
    { scope: ["string", "string.quoted"], settings: { foreground: darkString } },
    { scope: ["constant.numeric", "constant.language"], settings: { foreground: darkAccent } },
    { scope: ["entity.name.function", "support.function"], settings: { foreground: darkFunction } },
    { scope: ["entity.name.type", "entity.name.class", "support.type", "support.class"], settings: { foreground: darkType } },
    { scope: ["entity.name.tag", "punctuation.definition.tag"], settings: { foreground: darkAccent } },
    { scope: ["variable", "variable.other"], settings: { foreground: dark } },
    { scope: ["punctuation", "meta.brace"], settings: { foreground: "#C8C1B6" } },
  ],
};

const LANGS = new Set([
  "json",
  "yaml",
  "toml",
  "xml",
  "html",
  "css",
  "javascript",
  "typescript",
  "tsx",
  "jsx",
  "sql",
  "bash",
  "dockerfile",
  "markdown",
  "http",
  "csv",
  "ini",
  "regexp",
  "plaintext",
]);

export function shouldHighlight(code: string) {
  return new TextEncoder().encode(code).byteLength <= PLAIN_BYTE_LIMIT;
}

export function languageFor(filename?: string, label?: string, explicit?: string) {
  if (explicit && LANGS.has(explicit)) return explicit;
  const fromFile = detect(filename);
  if (fromFile !== "plaintext") return fromFile;
  return detect(label);
}

function detect(hint?: string) {
  const value = (hint ?? "").trim().toLowerCase();
  if (!value) return "plaintext";
  if (value.includes("tsx") || value.endsWith(".tsx")) return "tsx";
  if (value.includes("jsx") || value.endsWith(".jsx")) return "jsx";
  if (value.includes("typescript") || value.endsWith(".ts") || value.includes("metadata")) return "typescript";
  if (value.includes("javascript") || value.includes("node-cron") || value.endsWith(".js")) return "javascript";
  if (value.includes("json")) return "json";
  if (value.includes("yaml") || value.includes("yml") || value.includes("github actions") || value.includes("kubernetes")) return "yaml";
  if (value.includes("toml")) return "toml";
  if (value.includes("html") || value.endsWith(".html")) return "html";
  if (value.includes("xml") || value.endsWith(".xml")) return "xml";
  if (value.includes("css")) return "css";
  if (value.includes("sql")) return "sql";
  if (value.includes("docker")) return "dockerfile";
  if (value.includes("bash") || value.includes("shell") || value.includes("crontab") || value.includes("chmod") || value === "commands") return "bash";
  if (value.includes("markdown") || value.includes(".md") || value.includes("llms")) return "markdown";
  if (value.includes("http")) return "http";
  if (value.includes("csv")) return "csv";
  if (value.includes("ini") || value.includes("robots")) return "ini";
  if (value.includes("regex") || value.includes("regexp")) return "regexp";
  return "plaintext";
}

export type HighlightLine = ThemedTokenWithVariants[];

let highlighterPromise: Promise<import("shiki/core").HighlighterCore> | null = null;
const cache = new Map<string, HighlightLine[]>();

async function highlighter() {
  highlighterPromise ??= loadHighlighter();
  return highlighterPromise;
}

async function loadHighlighter() {
  const [{ createHighlighterCore }, { createJavaScriptRegexEngine }, json, yaml, toml, xml, html, css, javascript, typescript, tsx, jsx, sql, bash, dockerfile, markdown, http, csv, ini, regexp] = await Promise.all([
    import("shiki/core"),
    import("shiki/engine/javascript"),
    import("shiki/langs/json.mjs"),
    import("shiki/langs/yaml.mjs"),
    import("shiki/langs/toml.mjs"),
    import("shiki/langs/xml.mjs"),
    import("shiki/langs/html.mjs"),
    import("shiki/langs/css.mjs"),
    import("shiki/langs/javascript.mjs"),
    import("shiki/langs/typescript.mjs"),
    import("shiki/langs/tsx.mjs"),
    import("shiki/langs/jsx.mjs"),
    import("shiki/langs/sql.mjs"),
    import("shiki/langs/bash.mjs"),
    import("shiki/langs/dockerfile.mjs"),
    import("shiki/langs/markdown.mjs"),
    import("shiki/langs/http.mjs"),
    import("shiki/langs/csv.mjs"),
    import("shiki/langs/ini.mjs"),
    import("shiki/langs/regexp.mjs"),
  ]);
  const langs = [json, yaml, toml, xml, html, css, javascript, typescript, tsx, jsx, sql, bash, dockerfile, markdown, http, csv, ini, regexp].flatMap((mod) => {
    const value = "default" in mod ? mod.default : mod;
    return Array.isArray(value) ? value : [value];
  });
  return createHighlighterCore({
    themes: [benchLight, benchDark],
    langs,
    engine: createJavaScriptRegexEngine(),
  });
}

export async function highlightCode(code: string, language: string): Promise<HighlightLine[] | null> {
  if (!shouldHighlight(code)) return null;
  const lang = LANGS.has(language) ? language : "plaintext";
  const key = `${lang}\0${code}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const engine = await highlighter();
  const tokens = await engine.codeToTokensWithThemes(code, {
    lang,
    themes: { light: "bench-light", dark: "bench-dark" },
  });
  cache.set(key, tokens);
  if (cache.size > 40) {
    const first = cache.keys().next().value;
    if (first) cache.delete(first);
  }
  return tokens;
}
