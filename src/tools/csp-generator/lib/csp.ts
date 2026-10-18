export const sourceDirectives = [
  "default-src",
  "script-src",
  "style-src",
  "img-src",
  "font-src",
  "connect-src",
  "frame-src",
  "frame-ancestors",
  "media-src",
  "object-src",
  "base-uri",
  "form-action",
  "worker-src",
  "manifest-src",
] as const;

export type SourceDirective = (typeof sourceDirectives)[number];

export const flagDirectives = ["upgrade-insecure-requests", "block-all-mixed-content"] as const;

export type CspCheck = { level: "pass" | "warn" | "fail" | "info"; label: string; detail: string };

export type CspDraft = {
  sources: Partial<Record<SourceDirective, string>>;
  upgradeInsecureRequests: boolean;
  blockAllMixedContent: boolean;
};

export type CspDocument = {
  policy: string;
  header: string;
  nextConfig: string;
  checks: CspCheck[];
};

const KNOWN = new Set<string>([...sourceDirectives, ...flagDirectives]);

export const strictPreset: CspDraft = {
  sources: {
    "default-src": "'none'",
    "script-src": "'self'",
    "style-src": "'self'",
    "img-src": "'self'",
    "font-src": "'self'",
    "connect-src": "'self'",
    "frame-ancestors": "'none'",
    "base-uri": "'none'",
    "form-action": "'self'",
    "object-src": "'none'",
  },
  upgradeInsecureRequests: true,
  blockAllMixedContent: false,
};

export const nextPreset: CspDraft = {
  sources: {
    "default-src": "'self'",
    "script-src": "'self'",
    "style-src": "'self' 'unsafe-inline'",
    "img-src": "'self' data: blob:",
    "font-src": "'self'",
    "connect-src": "'self'",
    "frame-ancestors": "'none'",
    "base-uri": "'self'",
    "form-action": "'self'",
    "object-src": "'none'",
  },
  upgradeInsecureRequests: true,
  blockAllMixedContent: false,
};

export function buildPolicy(draft: CspDraft) {
  const parts: string[] = [];
  for (const name of sourceDirectives) {
    const value = draft.sources[name]?.trim().replace(/\s+/g, " ");
    if (!value) continue;
    parts.push(`${name} ${value}`);
  }
  if (draft.upgradeInsecureRequests) parts.push("upgrade-insecure-requests");
  if (draft.blockAllMixedContent) parts.push("block-all-mixed-content");
  return parts.join("; ");
}

export function parsePolicy(policy: string): CspDraft & { unknown: string[] } {
  const sources: CspDraft["sources"] = {};
  const unknown: string[] = [];
  let upgradeInsecureRequests = false;
  let blockAllMixedContent = false;
  for (const part of policy.split(";")) {
    const tokens = part.trim().split(/\s+/).filter(Boolean);
    const name = tokens[0];
    if (!name) continue;
    if (name === "upgrade-insecure-requests") {
      upgradeInsecureRequests = true;
      continue;
    }
    if (name === "block-all-mixed-content") {
      blockAllMixedContent = true;
      continue;
    }
    if (!KNOWN.has(name)) {
      unknown.push(part.trim());
      continue;
    }
    sources[name as SourceDirective] = tokens.slice(1).join(" ");
  }
  return { sources, upgradeInsecureRequests, blockAllMixedContent, unknown };
}

export function lintPolicy(policy: string): CspCheck[] {
  const draft = parsePolicy(policy);
  const checks: CspCheck[] = [];
  const list = (name: SourceDirective) => (draft.sources[name] ?? "").split(/\s+/).filter(Boolean);
  const script = list("script-src").length > 0 ? list("script-src") : list("default-src");

  if (!draft.sources["default-src"]) {
    checks.push({ level: "warn", label: "default-src", detail: "Without default-src, a directive you omit is left open." });
  } else if (list("default-src").includes("*")) {
    checks.push({ level: "fail", label: "default-src", detail: "* allows any host, including ones you do not operate." });
  } else {
    checks.push({ level: "pass", label: "default-src", detail: draft.sources["default-src"] ?? "" });
  }

  if (script.includes("*")) checks.push({ level: "fail", label: "script-src", detail: "* allows scripts from any host." });
  if (script.includes("'unsafe-eval'")) checks.push({ level: "warn", label: "unsafe-eval", detail: "'unsafe-eval' lets the page turn strings into code." });
  if (script.includes("'unsafe-inline'") && !script.some((token) => token.startsWith("'nonce-") || token.startsWith("'sha"))) {
    checks.push({ level: "warn", label: "unsafe-inline", detail: "'unsafe-inline' allows inline scripts. A nonce or hash is tighter." });
  }
  if (list("style-src").includes("'unsafe-inline'")) {
    checks.push({ level: "warn", label: "unsafe-inline", detail: "style-src 'unsafe-inline' allows inline styles." });
  }
  if (script.includes("'none'")) checks.push({ level: "pass", label: "script-src", detail: "Scripts are blocked." });

  const objectSrc = list("object-src");
  if (objectSrc.includes("'none'")) checks.push({ level: "pass", label: "object-src", detail: "Plugins and legacy embeds are blocked." });
  else checks.push({ level: "warn", label: "object-src", detail: "Set object-src to 'none'." });

  if (list("base-uri").includes("'self'") || list("base-uri").includes("'none'")) {
    checks.push({ level: "pass", label: "base-uri", detail: draft.sources["base-uri"] ?? "" });
  } else {
    checks.push({ level: "warn", label: "base-uri", detail: "Set base-uri to 'self' or 'none' so a base tag cannot rewrite URLs." });
  }

  if (!draft.sources["frame-ancestors"]) {
    checks.push({ level: "warn", label: "frame-ancestors", detail: "Set frame-ancestors so other sites cannot frame this page." });
  } else {
    checks.push({ level: "pass", label: "frame-ancestors", detail: draft.sources["frame-ancestors"] ?? "" });
  }

  if (draft.upgradeInsecureRequests) checks.push({ level: "pass", label: "upgrade-insecure-requests", detail: "HTTP subresources are upgraded." });
  else checks.push({ level: "info", label: "upgrade-insecure-requests", detail: "Turn this on for an HTTPS site." });

  for (const extra of draft.unknown) {
    checks.push({ level: "info", label: "Unrecognized", detail: extra });
  }
  return checks;
}

export function nextConfigSnippet(policy: string) {
  const value = policy.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
  return `const contentSecurityPolicy = \`${value}\`;

const nextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
        ],
      },
    ];
  },
};

export default nextConfig;
`;
}

export function documentFor(draft: CspDraft): CspDocument {
  const policy = buildPolicy(draft);
  return {
    policy,
    header: `Content-Security-Policy: ${policy}`,
    nextConfig: nextConfigSnippet(policy),
    checks: lintPolicy(policy),
  };
}
