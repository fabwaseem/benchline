import { guard, readBody, toolError, toolJson } from "@/lib/api";
import { recordTypes, resolvers, type RecordType, type ResolverId } from "@/tools/dns-lookup/lib/dns";
import { lookupDns } from "@/tools/dns-lookup/remote";

export async function POST(request: Request) {
  const blocked = await guard(request);
  if (blocked) return blocked;
  try {
    const body = (await readBody(request)) as { name?: string; types?: string[]; resolver?: string; mail?: boolean };
    const types = (body.types ?? []).filter((type): type is RecordType => (recordTypes as readonly string[]).includes(type));
    const resolver = (resolvers as readonly string[]).includes(body.resolver ?? "") ? (body.resolver as ResolverId) : "cloudflare";
    return toolJson(await lookupDns({ name: body.name ?? "", types, resolver, mail: body.mail }));
  } catch (error) {
    return toolError(error);
  }
}
