import { guard, readBody, toolError, toolJson } from "@/lib/api";
import { inspectSitemap } from "@/tools/sitemap-validator/remote";

export async function POST(request: Request) {
  const blocked = await guard(request);
  if (blocked) return blocked;
  try {
    const body = (await readBody(request)) as { url?: string; xml?: string; probe?: boolean };
    return toolJson(await inspectSitemap(body));
  } catch (error) {
    return toolError(error);
  }
}
