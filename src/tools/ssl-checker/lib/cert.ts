export type CertCheck = { level: "pass" | "warn" | "fail" | "info"; label: string; detail: string };

export type CertFields = {
  subject: string;
  commonName: string;
  issuer: string;
  validFrom: string;
  validTo: string;
  sans: string[];
  fingerprint: string;
  serial: string;
  bits: number | null;
};

export type CertAssessment = {
  daysRemaining: number | null;
  grade: "A" | "B" | "C" | "D" | "F";
  checks: CertCheck[];
};

export function assessCertificate(
  fields: CertFields,
  now: number,
  extra?: { authorized?: boolean; protocol?: string; hostname?: string },
): CertAssessment {
  const days = daysUntil(fields.validTo, now);
  const checks: CertCheck[] = [];
  if (days === null) checks.push({ level: "fail", label: "Expiry", detail: "The certificate has no readable end date." });
  else if (days < 0) checks.push({ level: "fail", label: "Expiry", detail: `Expired ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago.` });
  else if (days < 14) checks.push({ level: "fail", label: "Expiry", detail: `${days} day${days === 1 ? "" : "s"} left.` });
  else if (days < 30) checks.push({ level: "warn", label: "Expiry", detail: `${days} days left.` });
  else checks.push({ level: "pass", label: "Expiry", detail: `${days} days left. Valid until ${fields.validTo}.` });

  if (extra?.authorized === false) checks.push({ level: "fail", label: "Trust", detail: "The certificate did not chain to a trusted root." });
  else if (extra?.authorized === true) checks.push({ level: "pass", label: "Trust", detail: "The chain is trusted by this runtime." });

  const protocol = extra?.protocol ?? "";
  if (protocol && protocol !== "TLSv1.2" && protocol !== "TLSv1.3") {
    checks.push({ level: "warn", label: "Protocol", detail: protocol });
  } else if (protocol) checks.push({ level: "pass", label: "Protocol", detail: protocol });

  const host = extra?.hostname?.toLowerCase();
  if (host) {
    const matched = fields.sans.some((name) => hostMatches(host, name)) || hostMatches(host, fields.commonName);
    checks.push(matched
      ? { level: "pass", label: "Name", detail: `${host} is covered.` }
      : { level: "fail", label: "Name", detail: `${host} is not in the certificate names.` });
  }

  if (fields.sans.length === 0) checks.push({ level: "warn", label: "SAN", detail: "No subject alternative names." });
  else checks.push({ level: "info", label: "SAN", detail: `${fields.sans.length} name${fields.sans.length === 1 ? "" : "s"}.` });

  const fails = checks.filter((check) => check.level === "fail").length;
  const warns = checks.filter((check) => check.level === "warn").length;
  const grade = fails >= 2 ? "F" : fails === 1 ? "D" : warns > 0 ? "C" : "A";
  return { daysRemaining: days, grade, checks };
}

export function daysUntil(iso: string, now: number) {
  const end = Date.parse(iso);
  if (Number.isNaN(end)) return null;
  return Math.floor((end - now) / 86_400_000);
}

export function parseSanList(value: string) {
  return value
    .split(",")
    .map((part) => part.trim().replace(/^(DNS|IP Address):/i, "").trim())
    .filter(Boolean);
}

export function hostMatches(host: string, pattern: string) {
  const name = pattern.trim().toLowerCase().replace(/\.$/, "");
  const target = host.trim().toLowerCase().replace(/\.$/, "");
  if (!name || !target) return false;
  if (name === target) return true;
  if (!name.startsWith("*.")) return false;
  const rest = name.slice(1);
  const head = target.slice(0, target.length - rest.length);
  return target.endsWith(rest) && head.length > 0 && !head.includes(".");
}

export function toIso(value: string) {
  const time = Date.parse(value);
  if (Number.isNaN(time)) return "";
  return new Date(time).toISOString();
}
