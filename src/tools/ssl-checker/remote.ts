import { isIP } from "node:net";
import type tls from "node:tls";
import { FETCH_LIMITS } from "@/lib/net/fetch-public";
import { assertPublicHost, parsePublicHttpUrl, PublicUrlError } from "@/lib/net/ssrf";
import { assessCertificate, parseSanList, toIso, type CertFields } from "@/tools/ssl-checker/lib/cert";
import { openTls } from "@/tools/ssl-checker/lib/socket";

export type ChainLink = { subject: string; issuer: string; validTo: string };

export async function checkSsl(input: string, now = Date.now()) {
  const host = parseHost(input);
  const url = parsePublicHttpUrl(`https://${host.includes(":") ? `[${host}]` : host}/`);
  await assertPublicHost(url);
  const peer = await connect(host, isIP(host) ? undefined : host);
  const fields = fieldsFromPeer(peer.certificate);
  const chain = chainOf(peer.certificate);
  const assessed = assessCertificate(fields, now, {
    authorized: peer.authorized,
    protocol: peer.protocol,
    hostname: host,
  });
  return {
    host,
    authorized: peer.authorized,
    protocol: peer.protocol,
    authorizationError: peer.authorizationError,
    ...fields,
    daysRemaining: assessed.daysRemaining,
    grade: assessed.grade,
    checks: assessed.checks,
    chain,
  };
}

function parseHost(input: string) {
  const trimmed = input.trim();
  if (!trimmed) throw new PublicUrlError("Enter a hostname.");
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    throw new PublicUrlError("Enter a hostname.");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new PublicUrlError("Enter a hostname.");
  if (url.port && url.port !== "443") throw new PublicUrlError("Only port 443 is checked.");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (!host) throw new PublicUrlError("Enter a hostname.");
  return host;
}

function connect(host: string, servername?: string) {
  return new Promise<{ certificate: tls.DetailedPeerCertificate; authorized: boolean; protocol: string; authorizationError: string }>((resolve, reject) => {
    const socket = openTls({
      host,
      port: 443,
      servername,
      rejectUnauthorized: false,
      timeout: FETCH_LIMITS.timeoutMs,
    });
    const timer = setTimeout(() => {
      socket.destroy();
      reject(new PublicUrlError("The TLS handshake timed out."));
    }, FETCH_LIMITS.timeoutMs);
    const fail = (error: unknown) => {
      clearTimeout(timer);
      socket.destroy();
      const message = error instanceof Error ? error.message : "The TLS handshake failed.";
      reject(new PublicUrlError(message));
    };
    socket.once("error", fail);
    socket.once("timeout", () => fail(new PublicUrlError("The TLS handshake timed out.")));
    socket.once("secureConnect", () => {
      clearTimeout(timer);
      const certificate = socket.getPeerCertificate(true);
      const protocol = socket.getProtocol() ?? "";
      const authorized = socket.authorized;
      const authorizationError = socket.authorizationError ? String(socket.authorizationError) : "";
      socket.end();
      if (!certificate || Object.keys(certificate).length === 0) {
        reject(new PublicUrlError("The server did not present a certificate."));
        return;
      }
      resolve({ certificate, authorized, protocol, authorizationError });
    });
  });
}

function fieldsFromPeer(certificate: tls.PeerCertificate): CertFields {
  return {
    subject: formatName(certificate.subject),
    commonName: first(certificate.subject?.CN),
    issuer: formatName(certificate.issuer),
    validFrom: toIso(certificate.valid_from),
    validTo: toIso(certificate.valid_to),
    sans: parseSanList(certificate.subjectaltname ?? ""),
    fingerprint: certificate.fingerprint256 ?? "",
    serial: certificate.serialNumber ?? "",
    bits: typeof certificate.bits === "number" ? certificate.bits : null,
  };
}

function chainOf(certificate: tls.DetailedPeerCertificate): ChainLink[] {
  const chain: ChainLink[] = [];
  let current: tls.DetailedPeerCertificate | undefined = certificate;
  const seen = new Set<string>();
  for (let depth = 0; current && depth < 6; depth += 1) {
    const key = `${formatName(current.subject)}|${current.fingerprint256 ?? depth}`;
    if (seen.has(key)) break;
    seen.add(key);
    chain.push({
      subject: formatName(current.subject),
      issuer: formatName(current.issuer),
      validTo: toIso(current.valid_to),
    });
    const next: tls.DetailedPeerCertificate | undefined = current.issuerCertificate;
    if (!next || next === current || formatName(next.subject) === formatName(current.subject)) break;
    current = next;
  }
  return chain;
}

function formatName(name: tls.Certificate | undefined) {
  if (!name) return "";
  const cn = first(name.CN);
  const org = first(name.O);
  if (cn && org) return `${cn} · ${org}`;
  return cn || org || "";
}

function first(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}
