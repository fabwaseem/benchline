import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "code-minifier",
  name: "Code Minifier",
  tagline: "Minify JavaScript, CSS, and HTML with byte-level savings.",
  description:
    "Free code minifier. Shrink JavaScript with Terser and CSS with csso, plus a structural HTML pass that strips comments, collapses whitespace, and cleans redundant attributes. Toggle mangling, compression, and aggressive HTML options, then compare before/after byte counts and the savings percentage.",
  category: "code",
  tags: ["minify", "javascript", "css"],
  keywords: ["javascript minifier", "css minifier", "html minifier", "minify js online", "code compressor"],
  status: "new",
  createdAt: "2026-10-18",
  updatedAt: "2026-10-18",
  icon: "Shrink",
  related: ["json-formatter", "svg-optimizer", "html-to-markdown-url", "markdown-html"],
  faqs: [
    { q: "Which minifiers are used?", a: "Terser for JavaScript and csso for CSS — the same engines behind most build pipelines. HTML gets a built-in structural pass: comments, whitespace, and redundant attributes are removed without touching inline scripts or styles." },
    { q: "Is my code sent anywhere?", a: "No. Minification runs entirely in the browser on this page." },
    { q: "What does aggressive HTML mode change?", a: "It also removes optional closing tags like </p> and </li>. The output stays valid HTML, but diff it before shipping." },
    { q: "Why did my JavaScript fail to minify?", a: "Terser parses the code first, so a syntax error stops the run and the message is shown. Fix the reported spot and try again." },
  ],
  seo: {
    title: "Code Minifier",
    description: "Minify JavaScript, CSS, and HTML online with Terser, clean-css, and html-minifier-terser. See byte savings instantly.",
  },
  howTo: [
    { name: "Pick a language", text: "Switch between the JavaScript, CSS, and HTML tabs." },
    { name: "Tune the options", text: "Turn mangling and compression on or off, pick the CSS optimization level, or enable aggressive HTML mode." },
    { name: "Copy the output", text: "Read the before/after byte counts and the savings percentage, then copy or download the minified code." },
  ],
  inputs: "Source code plus per-language minifier options.",
  outputs: "Minified code with before/after byte counts and savings %.",
  runsLocally: true,
  badges: ["Terser · csso"],
} satisfies ToolMeta;
