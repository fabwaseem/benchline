import { readFile } from "node:fs/promises";
import { connection } from "next/server";
import { resolvePdfAsset } from "@/lib/pdf-assets";

export async function GET(_request: Request, context: { params: Promise<{ path: string[] }> }) {
  await connection();
  const { path: parts } = await context.params;
  const asset = resolvePdfAsset(parts);
  if (!asset) return new Response("Not found", { status: 404 });
  try {
    const bytes = new Uint8Array(await readFile(asset.file));
    return new Response(bytes, {
      headers: {
        "content-type": asset.contentType,
        "cache-control": "public, max-age=86400",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
