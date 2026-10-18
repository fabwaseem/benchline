FROM node:22-alpine AS deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.33.4 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.33.4 --activate
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm geo:download
RUN pnpm build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
RUN addgroup -S nextjs && adduser -S nextjs -G nextjs
COPY --from=build /app/public ./public
COPY --from=build --chown=nextjs:nextjs /app/data ./data
COPY --from=build --chown=nextjs:nextjs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nextjs /app/.next/static ./.next/static
# Copy resolved wasm/native trees so MCP tools can require them in the standalone image
RUN --mount=from=build,source=/app/node_modules,target=/mnt/nm \
  mkdir -p node_modules \
  && cp -aL /mnt/nm/pdfjs-dist node_modules/pdfjs-dist \
  && cp -aL /mnt/nm/zxing-wasm node_modules/zxing-wasm \
  && cp -aL /mnt/nm/tesseract.js node_modules/tesseract.js \
  && cp -aL /mnt/nm/tesseract.js-core node_modules/tesseract.js-core \
  && for dep in bmp-js idb-keyval is-url node-fetch opencollective-postinstall regenerator-runtime wasm-feature-detect zlibjs whatwg-url tr46 webidl-conversions postgres mmdb-lib; do \
       if [ -e "/mnt/nm/.pnpm/node_modules/$dep" ]; then \
         src="/mnt/nm/.pnpm/node_modules/$dep"; \
       elif [ -e "/mnt/nm/$dep" ]; then \
         src="/mnt/nm/$dep"; \
       else \
         echo "Required dependency not found: $dep (checked /mnt/nm/.pnpm/node_modules/$dep and /mnt/nm/$dep)" >&2; \
         exit 1; \
       fi; \
       cp -aL "$src" "node_modules/$dep"; \
     done \
  && mkdir -p node_modules/@resvg \
  && cp -aL /mnt/nm/@resvg/resvg-js node_modules/@resvg/resvg-js \
  && cp -aL /mnt/nm/satori node_modules/satori \
  && for pkg in /mnt/nm/.pnpm/node_modules/@resvg/resvg-js-linux-*; do \
       if [ -d "$pkg" ]; then cp -aL "$pkg" "node_modules/@resvg/$(basename "$pkg")"; fi; \
     done \
  && chown -R nextjs:nextjs node_modules
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
