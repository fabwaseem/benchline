import { guard, readBody, toolError, toolJson } from "@/lib/api";
import { checkSsl } from "@/tools/ssl-checker/remote";

export async function POST(request: Request) {
  const blocked = await guard(request);
  if (blocked) return blocked;
  try {
    const body = (await readBody(request)) as { host?: string };
    return toolJson(await checkSsl(body.host ?? ""));
  } catch (error) {
    return toolError(error);
  }
}
