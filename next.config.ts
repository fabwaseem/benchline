import type { NextConfig } from "next";

const mcpNativeAssets = [
  "./node_modules/pdfjs-dist/**/*",
  "./node_modules/zxing-wasm/**/*",
  "./node_modules/tesseract.js/**/*",
  "./node_modules/tesseract.js-core/**/*",
  "./node_modules/@napi-rs/canvas/**/*",
];

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: [
    "@napi-rs/canvas",
    "@resvg/resvg-js",
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
