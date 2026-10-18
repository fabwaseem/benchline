import { minify as cssoMinify } from "csso";
import { minify as terserMinify } from "terser";

export type Language = "js" | "css" | "html";

export const LANGUAGES: Language[] = ["js", "css", "html"];

export const LANGUAGE_LABELS: Record<Language, string> = {
  js: "JavaScript",
  css: "CSS",
  html: "HTML",
};

export interface MinifyOptions {
  jsMangle?: boolean;
  jsCompress?: boolean;
  cssLevel?: 1 | 2;
  htmlAggressive?: boolean;
}

export interface MinifyResult {
  code: string;
  beforeBytes: number;
  afterBytes: number;
  savedBytes: number;
  savedPct: number;
  error?: string;
}

function bytes(text: string): number {
  return new TextEncoder().encode(text).length;
}

function stats(before: string, after: string, error?: string): MinifyResult {
  const beforeBytes = bytes(before);
  const afterBytes = bytes(after);
  const savedBytes = Math.max(0, beforeBytes - afterBytes);
  return {
    code: after,
    beforeBytes,
    afterBytes,
    savedBytes,
    savedPct: beforeBytes === 0 ? 0 : Math.round((savedBytes / beforeBytes) * 1000) / 10,
    ...(error ? { error } : {}),
  };
}

async function minifyJs(code: string, opts: MinifyOptions): Promise<MinifyResult> {
  try {
    const out = await terserMinify(code, {
      compress: opts.jsCompress === false ? false : {},
      mangle: opts.jsMangle === false ? false : true,
    });
    if (typeof out.code !== "string") return stats(code, code, "Terser returned no output.");
    return stats(code, out.code);
  } catch (error) {
    return stats(code, code, error instanceof Error ? error.message : "JavaScript minification failed.");
  }
}

async function minifyCss(code: string, opts: MinifyOptions): Promise<MinifyResult> {
  try {
    const level = opts.cssLevel ?? 2;
    const out = cssoMinify(code, level === 1 ? { restructure: false } : { restructure: true });
    return stats(code, out.css);
  } catch (error) {
    return stats(code, code, error instanceof Error ? error.message : "CSS minification failed.");
  }
}

const PROTECTED_BLOCK = /<(pre|textarea|script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi;

const REDUNDANT_ATTRS: Array<[RegExp, string]> = [
  [/<input([^>]*?)\s+type=(["'])text\2/gi, "<input$1"],
  [/<script([^>]*?)\s+language=(["'])javascript\2/gi, "<script$1"],
  [/<(style|link)([^>]*?)\s+type=(["'])text\/css\3/gi, "<$1$2"],
  [/<form([^>]*?)\s+method=(["'])get\2/gi, "<form$1"],
];

const EMPTY_ATTRS = /\s+(class|id|alt|title|lang)=""/gi;

const BOOLEAN_ATTRS = /\s+(disabled|checked|readonly|required|selected|multiple|autofocus|hidden|open|reversed|async|defer|muted|controls|loop|default)=["']\1["']/gi;

const OPTIONAL_CLOSES = /<\/(html|head|body|p|li|dt|dd|rt|rp|optgroup|option|thead|tbody|tfoot|tr|td|th|colgroup)>/gi;

function minifyHtmlStructural(code: string, aggressive: boolean): string {
  const protectedBlocks: string[] = [];
  const placeholder = (i: number) => `\u0000${i}\u0000`;
  // 1. lift out blocks whose whitespace is significant
  let out = code.replace(PROTECTED_BLOCK, (match) => {
    protectedBlocks.push(match);
    return placeholder(protectedBlocks.length - 1);
  });
  // 2. drop comments, keeping conditional comments and SSI directives
  out = out.replace(/<!--(?!\[if|#)[\s\S]*?-->/g, "");
  // 3. short doctype
  out = out.replace(/<!doctype\s+html\s*>/gi, "<!doctype html>");
  // 4. redundant + empty + boolean attributes
  for (const [pattern, replacement] of REDUNDANT_ATTRS) out = out.replace(pattern, replacement);
  out = out.replace(EMPTY_ATTRS, "");
  out = out.replace(BOOLEAN_ATTRS, " $1");
  // 5. collapse whitespace between tags, then everywhere else
  out = out.replace(/>\s+</g, "><").replace(/\s+/g, " ").trim();
  // 6. optional closing tags in aggressive mode
  if (aggressive) out = out.replace(OPTIONAL_CLOSES, "");
  // 7. restore protected blocks
  out = out.replace(/\u0000(\d+)\u0000/g, (_, i: string) => protectedBlocks[Number(i)] ?? "");
  return out;
}

async function minifyHtml(code: string, opts: MinifyOptions): Promise<MinifyResult> {
  try {
    const out = minifyHtmlStructural(code, opts.htmlAggressive === true);
    return stats(code, out);
  } catch (error) {
    return stats(code, code, error instanceof Error ? error.message : "HTML minification failed.");
  }
}

export async function minifyCode(language: Language, code: string, opts: MinifyOptions = {}): Promise<MinifyResult> {
  if (!code.trim()) return stats(code, code, "Nothing to minify.");
  switch (language) {
    case "js":
      return minifyJs(code, opts);
    case "css":
      return minifyCss(code, opts);
    case "html":
      return minifyHtml(code, opts);
  }
}

export const exampleJs = `function greet(name) {
  const greeting = "Hello, " + name + "!";
  console.log(greeting);
  return greeting;
}

greet("world");
`;

export const exampleCss = `.card {
  display: flex;
  flex-direction: column;
  padding: 16px 24px;
  margin: 0 auto;
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
}
`;

export const exampleHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <!-- page head -->
    <meta charset="utf-8" />
    <title>Example</title>
  </head>
  <body>
    <main class="content">
      <h1>Hello</h1>
    </main>
  </body>
</html>
`;
