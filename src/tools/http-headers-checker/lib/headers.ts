export type HeaderField = { name: string; value: string };

export type HeaderCheck = { level: "pass" | "warn" | "fail" | "info"; label: string; detail: string };

export type HeaderGrade = "A" | "B" | "C" | "D" | "F";

export function headerValue(headers: HeaderField[], name: string) {
  return headers.find((header) => header.name.toLowerCase() === name.toLowerCase())?.value ?? "";
}

export function gradeHeaders(headers: HeaderField[], finalUrl: string): { grade: HeaderGrade; checks: HeaderCheck[] } {
  const secure = finalUrl.startsWith("https:");
  const checks: HeaderCheck[] = [];
  const hsts = headerValue(headers, "strict-transport-security");
  const csp = headerValue(headers, "content-security-policy");
  const frame = headerValue(headers, "x-frame-options");
  const nosniff = headerValue(headers, "x-content-type-options");
  const referrer = headerValue(headers, "referrer-policy");
  const permissions = headerValue(headers, "permissions-policy");
  const powered = headerValue(headers, "x-powered-by");

  if (!secure) checks.push({ level: "info", label: "HSTS", detail: "HSTS applies to HTTPS responses." });
  else if (!hsts) checks.push({ level: "fail", label: "HSTS", detail: "Strict-Transport-Security is missing." });
  else if (!/max-age=(\d+)/i.test(hsts) || Number(/max-age=(\d+)/i.exec(hsts)?.[1] ?? 0) < 15_552_000) {
    checks.push({ level: "warn", label: "HSTS", detail: "max-age is under 180 days, or missing." });
  } else checks.push({ level: "pass", label: "HSTS", detail: hsts });

  if (!csp) checks.push({ level: "fail", label: "Content-Security-Policy", detail: "No Content-Security-Policy header." });
  else if (/unsafe-inline|unsafe-eval|\*/i.test(csp)) checks.push({ level: "warn", label: "Content-Security-Policy", detail: "The policy is present and includes a broad source." });
  else checks.push({ level: "pass", label: "Content-Security-Policy", detail: csp });

  const framed = /frame-ancestors/i.test(csp);
  if (framed || /^(deny|sameorigin)$/i.test(frame)) checks.push({ level: "pass", label: "Framing", detail: framed ? "frame-ancestors is set." : frame });
  else if (frame) checks.push({ level: "warn", label: "Framing", detail: frame });
  else checks.push({ level: "fail", label: "Framing", detail: "Neither X-Frame-Options nor frame-ancestors is set." });

  if (/^nosniff$/i.test(nosniff)) checks.push({ level: "pass", label: "X-Content-Type-Options", detail: "nosniff" });
  else checks.push({ level: "fail", label: "X-Content-Type-Options", detail: "Set this to nosniff." });

  const tightReferrer = ["no-referrer", "same-origin", "strict-origin", "strict-origin-when-cross-origin"];
  if (tightReferrer.includes(referrer.toLowerCase())) checks.push({ level: "pass", label: "Referrer-Policy", detail: referrer });
  else if (!referrer) checks.push({ level: "fail", label: "Referrer-Policy", detail: "Referrer-Policy is missing." });
  else if (referrer.toLowerCase() === "unsafe-url") checks.push({ level: "fail", label: "Referrer-Policy", detail: "unsafe-url sends the full URL." });
  else checks.push({ level: "warn", label: "Referrer-Policy", detail: referrer });

  if (permissions) checks.push({ level: "pass", label: "Permissions-Policy", detail: permissions });
  else checks.push({ level: "info", label: "Permissions-Policy", detail: "No Permissions-Policy header." });

  if (powered) checks.push({ level: "warn", label: "X-Powered-By", detail: `Remove this header (${powered}).` });

  const fails = checks.filter((check) => check.level === "fail").length;
  const warns = checks.filter((check) => check.level === "warn").length;
  const grade: HeaderGrade = fails >= 3 ? "F" : fails === 2 ? "D" : fails === 1 ? "C" : warns > 0 ? "B" : "A";
  return { grade, checks };
}
