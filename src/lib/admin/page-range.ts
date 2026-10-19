import { firstParam, resolveRange, type AdminRange } from "@/lib/admin/range";

export async function rangeFrom(searchParams: Promise<Record<string, string | string[] | undefined>>): Promise<AdminRange> {
  const params = await searchParams;
  return resolveRange({
    range: firstParam(params.range),
    from: firstParam(params.from),
    to: firstParam(params.to),
    compare: firstParam(params.compare),
  });
}
