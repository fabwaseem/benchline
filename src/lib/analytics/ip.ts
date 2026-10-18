/** Traefik sets both headers from the TCP peer and ignores client-supplied forwards. */
export function analyticsIp(request: { headers: { get(name: string): string | null } }): string | null {
  const real = request.headers.get("x-real-ip")?.trim();
  if (real && real.length <= 80 && !/[\s,]/.test(real)) return real;
  const forwarded = request.headers.get("x-forwarded-for");
  if (!forwarded) return null;
  const first = forwarded.split(",")[0]?.trim() ?? "";
  if (!first || first.length > 80 || /[\s]/.test(first)) return null;
  return first;
}
