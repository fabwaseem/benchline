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
  experimental: {
    // Load only the kineticons a page uses instead of the whole 2,800-icon barrel.
    optimizePackageImports: ["kineticons"],
    // Keep visited pages in the client router cache so back-and-forth navigation is instant.
    staleTimes: { dynamic: 30, static: 600 },
  },
  // Static art and brand files change rarely: cache them for a week, serve stale for a day while revalidating.
  async headers() {
    const longCache = [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }];
    return [
      { source: "/tools/:slug/:file*", headers: longCache },
      { source: "/brand/:file*", headers: longCache },
      { source: "/fonts/:file*", headers: longCache },
      { source: "/:icon(favicon.ico|favicon.svg|apple-touch-icon.png|app-icon-192.png|app-icon-512.png)", headers: longCache },
    ];
  },
  // The directory moved from the home page to /tools. Old filtered links keep their query string.
  async redirects() {
    return ["q", "tag", "sort", "view", "browser", "mcp", "fresh"].map((key) => ({
      source: "/",
      has: [{ type: "query" as const, key }],
      destination: "/tools",
      permanent: true,
    }));
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
