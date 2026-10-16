import { guard, readBody, toolError, toolJson } from "@/lib/api";
import { checkRobotsUrl } from "@/tools/robots-txt-checker/remote";

export async function POST(request: Request) {
  const blocked = await guard(request);
  if (blocked) return blocked;
  try {
    const body = (await readBody(request)) as { url?: string };
    return toolJson(await checkRobotsUrl(body.url ?? ""));
  } catch (error) {
    return toolError(error);
  }
}
