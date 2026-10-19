import type { NextConfig } from "next";

// tesseract.js package.json dependencies, plus the node-fetch closure (whatwg-url → tr46, webidl-conversions).
const tesseractRuntimeDeps = [
  "bmp-js",
  "idb-keyval",
  "is-url",
  "node-fetch",
  "opencollective-postinstall",
  "regenerator-runtime",
  "tesseract.js-core",
  "wasm-feature-detect",
  "zlibjs",
  "whatwg-url",
  "tr46",
  "webidl-conversions",
];

const tesseractAssetGlobs = tesseractRuntimeDeps.flatMap((dep) => [
  `./node_modules/.pnpm/node_modules/${dep}/**/*`,
  `./node_modules/.pnpm/${dep}@*/**/*`,
  `./node_modules/.pnpm/tesseract.js@*/node_modules/${dep}/**/*`,
]);

const mcpNativeAssets = [
  "./node_modules/pdfjs-dist/**/*",
  "./node_modules/zxing-wasm/**/*",
  "./node_modules/tesseract.js/**/*",
  "./node_modules/tesseract.js-core/**/*",
  "./node_modules/.pnpm/tesseract.js@*/node_modules/**/*",
  ...tesseractAssetGlobs,
  "./node_modules/@napi-rs/canvas/**/*",
  "./node_modules/@resvg/resvg-js/**/*",
  "./node_modules/.pnpm/@resvg+resvg-js@*/**/*",
  "./node_modules/.pnpm/@resvg+resvg-js-linux-*/**/*",
  "./node_modules/.pnpm/node_modules/@resvg/**/*",
  "./node_modules/satori/**/*",
  "./public/fonts/og/**/*",
];

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: [
    "@napi-rs/canvas",
    "@resvg/resvg-js",
    "satori",
    "pdfjs-dist",
    "tesseract.js",
    "tesseract.js-core",
    ...tesseractRuntimeDeps.filter((dep) => dep !== "tesseract.js-core"),
    "zxing-wasm",
    "sharp",
    "postgres",
    "mmdb-lib",
    // exifr's full build probes fs and zlib with a dynamic require. Turbopack's
    // server bundle turns that into a failing require and logs "Couldn't load fs"
    // / "Couldn't load zlib" on every tool page and API request. Loading the
    // package with Node's own loader lets those built-ins resolve.
    "exifr",
  ],
  outputFileTracingIncludes: {
    "/pdfjs/[...path]": [
      "./node_modules/pdfjs-dist/standard_fonts/**/*",
      "./node_modules/pdfjs-dist/cmaps/**/*",
      "./node_modules/pdfjs-dist/wasm/**/*",
      "./node_modules/pdfjs-dist/build/pdf.mjs",
      "./node_modules/pdfjs-dist/build/pdf.worker.min.mjs",
    ],
    "/mcp": mcpNativeAssets,
    "/api/v1/tools/[slug]": mcpNativeAssets,
    "/api/tools/html-markdown": ["./node_modules/linkedom/**/*"],
  },
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  turbopack: {
    resolveAlias: {
      "onnxruntime-node": { browser: "./src/lib/onnx-stub.ts" },
    },
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
