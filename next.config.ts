import type { NextConfig } from "next";

const mcpNativeAssets = [
  "./node_modules/pdfjs-dist/**/*",
  "./node_modules/zxing-wasm/**/*",
  "./node_modules/tesseract.js/**/*",
  "./node_modules/tesseract.js-core/**/*",
  "./node_modules/.pnpm/tesseract.js@*/node_modules/**/*",
  "./node_modules/.pnpm/node_modules/bmp-js/**/*",
  "./node_modules/.pnpm/node_modules/zlibjs/**/*",
  "./node_modules/.pnpm/node_modules/wasm-feature-detect/**/*",
  "./node_modules/.pnpm/node_modules/idb-keyval/**/*",
  "./node_modules/.pnpm/node_modules/is-url/**/*",
  "./node_modules/.pnpm/node_modules/node-fetch/**/*",
  "./node_modules/.pnpm/node_modules/regenerator-runtime/**/*",
  "./node_modules/.pnpm/node_modules/whatwg-url/**/*",
  "./node_modules/.pnpm/bmp-js@*/**/*",
  "./node_modules/.pnpm/zlibjs@*/**/*",
  "./node_modules/.pnpm/wasm-feature-detect@*/**/*",
  "./node_modules/.pnpm/idb-keyval@*/**/*",
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
    "zxing-wasm",
    "sharp",
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
