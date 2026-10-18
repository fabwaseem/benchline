export interface ParsedHeader {
  name: string;
  value: string;
}

export interface ParsedRequest {
  url: string;
  method: string;
  headers: ParsedHeader[];
  body?: string;
  user?: string;
  insecure?: boolean;
  followRedirects?: boolean;
  userAgent?: string;
}

export type Target = "fetch" | "python" | "go" | "php" | "rust";

export const TARGETS: Target[] = ["fetch", "python", "go", "php", "rust"];

export const TARGET_LABELS: Record<Target, string> = {
  fetch: "JavaScript (fetch)",
  python: "Python (requests)",
  go: "Go (net/http)",
  php: "PHP (cURL)",
  rust: "Rust (reqwest)",
};

function tokenize(command: string): { tokens: string[] } | { error: string } {
  const tokens: string[] = [];
  let current = "";
  let quote: string | null = null;
  let i = 0;
  const push = () => {
    tokens.push(current);
    current = "";
  };
  while (i < command.length) {
    const ch = command[i] as string;
    if (quote) {
      if (ch === "\\" && quote === '"') {
        const next = command[i + 1];
        if (next === undefined) return { error: "Trailing backslash inside quotes." };
        current += next === "n" ? "\n" : next === "t" ? "\t" : next;
        i += 2;
        continue;
      }
      if (ch === "\\" && quote === "'") {
        const next = command[i + 1];
        if (next === "'") {
          current += "'";
          i += 2;
          continue;
        }
        current += ch;
        i += 1;
        continue;
      }
      if (ch === quote) {
        quote = null;
        i += 1;
        continue;
      }
      current += ch;
      i += 1;
      continue;
    }
    if (ch === "'" || ch === '"') {
      quote = ch;
      i += 1;
      continue;
    }
    if (ch === "\\") {
      const next = command[i + 1];
      if (next === undefined) return { error: "Trailing backslash." };
      if (next === "\n") {
        i += 2;
        continue;
      }
      current += next;
      i += 2;
      continue;
    }
    if (ch === " " || ch === "\t" || ch === "\n") {
      if (current) push();
      i += 1;
      continue;
    }
    current += ch;
    i += 1;
  }
  if (quote) return { error: "Unterminated quote in the curl command." };
  if (current) push();
  return { tokens };
}

const VALUE_FLAGS = new Set([
  "-X", "--request",
  "-H", "--header",
  "-d", "--data", "--data-raw", "--data-binary", "--data-ascii",
  "--data-urlencode",
  "-u", "--user",
  "-A", "--user-agent",
  "-b", "--cookie",
  "--url",
  "-m", "--max-time",
  "--connect-timeout",
]);

const BOOLEAN_FLAGS = new Set([
  "-k", "--insecure",
  "-L", "--location",
  "--compressed",
  "-s", "--silent",
  "-S", "--show-error",
  "-v", "--verbose",
  "-i", "--include",
  "--fail",
  "-O", "--remote-name",
  "-N", "--no-buffer",
  "--http1.1", "--http2",
]);

export function parseCurl(command: string): { request: ParsedRequest; warnings: string[] } | { error: string } {
  const lexed = tokenize(command.trim());
  if ("error" in lexed) return { error: lexed.error };
  const tokens = lexed.tokens;
  if (tokens.length === 0) return { error: "Paste a curl command first." };
  if (tokens[0] !== "curl") return { error: "The command must start with curl." };

  const request: ParsedRequest = { url: "", method: "", headers: [] };
  const warnings: string[] = [];
  const bodies: string[] = [];
  let explicitMethod = false;

  let i = 1;
  while (i < tokens.length) {
    const token = tokens[i] as string;
    if (token === "--") {
      i += 1;
      continue;
    }
    if (token.startsWith("--") && token.includes("=")) {
      const eq = token.indexOf("=");
      const flag = token.slice(0, eq);
      const value = token.slice(eq + 1);
      if (VALUE_FLAGS.has(flag)) {
        tokens.splice(i, 1, flag, value);
        continue;
      }
      if (BOOLEAN_FLAGS.has(flag)) {
        tokens.splice(i, 1, flag);
        continue;
      }
      warnings.push(`Ignored unsupported flag ${flag}.`);
      i += 1;
      continue;
    }
    if (token.startsWith("-") && token.length > 1) {
      if (VALUE_FLAGS.has(token)) {
        const value = tokens[i + 1];
        if (value === undefined) return { error: `Flag ${token} needs a value.` };
        switch (token) {
          case "-X":
          case "--request":
            request.method = value.toUpperCase();
            explicitMethod = true;
            break;
          case "-H":
          case "--header": {
            const colon = value.indexOf(":");
            if (colon === -1) {
              warnings.push(`Skipped malformed header ${JSON.stringify(value)}.`);
            } else {
              request.headers.push({ name: value.slice(0, colon).trim(), value: value.slice(colon + 1).trim() });
            }
            break;
          }
          case "-d":
          case "--data":
          case "--data-raw":
          case "--data-binary":
          case "--data-ascii":
            bodies.push(value);
            break;
          case "--data-urlencode":
            bodies.push(value);
            break;
          case "-u":
          case "--user":
            request.user = value;
            break;
          case "-A":
          case "--user-agent":
            request.userAgent = value;
            break;
          case "-b":
          case "--cookie":
            request.headers.push({ name: "Cookie", value });
            break;
          case "--url":
            request.url = value;
            break;
          default:
            warnings.push(`Ignored flag ${token}.`);
        }
        i += 2;
        continue;
      }
      if (BOOLEAN_FLAGS.has(token)) {
        if (token === "-k" || token === "--insecure") request.insecure = true;
        if (token === "-L" || token === "--location") request.followRedirects = true;
        i += 1;
        continue;
      }
      // combined short flags like -sS or -sk
      if (/^-[a-zA-Z]{2,}$/.test(token) && ![...token.slice(1)].some((c) => VALUE_FLAGS.has(`-${c}`))) {
        for (const c of token.slice(1)) {
          const flag = `-${c}`;
          if (flag === "-k") request.insecure = true;
          if (flag === "-L") request.followRedirects = true;
          if (!BOOLEAN_FLAGS.has(flag)) warnings.push(`Ignored flag ${flag}.`);
        }
        i += 1;
        continue;
      }
      warnings.push(`Ignored unsupported flag ${token}.`);
      i += 1;
      continue;
    }
    if (!request.url) {
      request.url = token;
    } else {
      warnings.push(`Ignored extra argument ${JSON.stringify(token)}.`);
    }
    i += 1;
  }

  if (!request.url) return { error: "No URL found in the curl command." };
  if (bodies.length > 0) request.body = bodies.join("&");
  if (!explicitMethod) request.method = request.body !== undefined ? "POST" : "GET";
  if (request.insecure) warnings.push("The -k/--insecure flag disables TLS verification — the snippets keep verification on.");
  return { request, warnings: [...new Set(warnings)] };
}

function jsString(value: string): string {
  return JSON.stringify(value);
}

function pyString(value: string): string {
  if (!value.includes("'") && !value.includes("\\")) return `'${value}'`;
  if (!value.includes('"') && !value.includes("\\")) return `"${value}"`;
  const escaped = value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  return `'${escaped}'`;
}

function goString(value: string): string {
  if (!value.includes("`") && !value.includes("\\")) return `\`${value}\``;
  return JSON.stringify(value);
}

function phpString(value: string): string {
  return `'${value.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
}

function rustString(value: string): string {
  let hashes = "";
  while (value.includes(`"${hashes}`) || value.includes(`${hashes}"`)) hashes += "#";
  return `r${hashes}"${value}"${hashes}`;
}

function headerLines(req: ParsedRequest, format: (name: string, value: string) => string): string[] {
  const lines = req.headers.map((h) => format(h.name, h.value));
  if (req.userAgent) lines.unshift(format("User-Agent", req.userAgent));
  return lines;
}

function splitUser(user: string): [string, string] {
  const idx = user.indexOf(":");
  return idx === -1 ? [user, ""] : [user.slice(0, idx), user.slice(idx + 1)];
}

function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function generateFetch(req: ParsedRequest): string {
  const lines = [`const res = await fetch(${jsString(req.url)}, {`];
  if (req.method !== "GET" || req.body !== undefined) lines.push(`  method: ${jsString(req.method)},`);
  const headers = headerLines(req, (n, v) => `    ${jsString(n)}: ${jsString(v)},`);
  if (req.user) {
    const [user, pass] = splitUser(req.user);
    const encoded = toBase64(`${user}:${pass}`);
    headers.push(`    ${jsString("Authorization")}: ${jsString(`Basic ${encoded}`)},`);
  }
  if (headers.length > 0) lines.push("  headers: {", ...headers, "  },");
  if (req.body !== undefined) lines.push(`  body: ${jsString(req.body)},`);
  lines.push("});", "", "const data = await res.json();", "console.log(data);");
  return lines.join("\n");
}

function generatePython(req: ParsedRequest): string {
  const lines = ["import requests", ""];
  const args: string[] = [`    ${pyString(req.url)},`];
  const headers = headerLines(req, (n, v) => `        ${pyString(n)}: ${pyString(v)},`);
  if (headers.length > 0) args.push("    headers={", ...headers, "    },");
  if (req.body !== undefined) args.push(`    data=${pyString(req.body)},`);
  if (req.user) {
    const [user, pass] = splitUser(req.user);
    args.push(`    auth=(${pyString(user)}, ${pyString(pass)}),`);
  }
  if (req.insecure) args.push("    verify=False,");
  lines.push(`res = requests.${req.method.toLowerCase()}(`, ...args, ")", "", "print(res.json())");
  return lines.join("\n");
}

function generateGo(req: ParsedRequest): string {
  const lines = [
    "package main",
    "",
    "import (",
    '    "fmt"',
    '    "io"',
    '    "net/http"',
    '    "strings"',
    ")",
    "",
    "func main() {",
  ];
  if (req.body !== undefined) {
    lines.push(`    body := strings.NewReader(${goString(req.body)})`);
    lines.push(`    req, err := http.NewRequest(${jsString(req.method)}, ${goString(req.url)}, body)`);
  } else {
    lines.push(`    req, err := http.NewRequest(${jsString(req.method)}, ${goString(req.url)}, nil)`);
  }
  lines.push("    if err != nil { panic(err) }");
  for (const line of headerLines(req, (n, v) => `    req.Header.Set(${goString(n)}, ${goString(v)})`)) lines.push(line);
  if (req.user) {
    const [user, pass] = splitUser(req.user);
    lines.push(`    req.SetBasicAuth(${goString(user)}, ${goString(pass)})`);
  }
  lines.push(
    "    res, err := http.DefaultClient.Do(req)",
    "    if err != nil { panic(err) }",
    "    defer res.Body.Close()",
    "    out, _ := io.ReadAll(res.Body)",
    '    fmt.Println(string(out))',
    "}",
  );
  return lines.join("\n");
}

function generatePhp(req: ParsedRequest): string {
  const lines = ["<?php", `$ch = curl_init(${phpString(req.url)});`, "curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);"];
  if (req.method !== "GET") lines.push(`curl_setopt($ch, CURLOPT_CUSTOMREQUEST, ${phpString(req.method)});`);
  const headers = req.headers.map((h) => `        ${phpString(`${h.name}: ${h.value}`)},`);
  if (req.userAgent) headers.unshift(`        ${phpString(`User-Agent: ${req.userAgent}`)},`);
  if (headers.length > 0) lines.push("curl_setopt($ch, CURLOPT_HTTPHEADER, [", ...headers, "]);");
  if (req.body !== undefined) lines.push(`curl_setopt($ch, CURLOPT_POSTFIELDS, ${phpString(req.body)});`);
  if (req.user) lines.push(`curl_setopt($ch, CURLOPT_USERPWD, ${phpString(req.user)});`);
  if (req.followRedirects) lines.push("curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);");
  if (req.insecure) lines.push("curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);");
  lines.push("$res = curl_exec($ch);", "curl_close($ch);", "echo $res;");
  return lines.join("\n");
}

function generateRust(req: ParsedRequest): string {
  const method = req.method.toLowerCase();
  const known = ["get", "post", "put", "delete", "patch", "head"];
  const builder = known.includes(method) ? `.${method}(${rustString(req.url)})` : `.request(reqwest::Method::${req.method}, ${rustString(req.url)})`;
  const lines = [
    "#[tokio::main]",
    "async fn main() -> Result<(), Box<dyn std::error::Error>> {",
    "    let res = reqwest::Client::new()",
    `        ${builder}`,
  ];
  for (const line of headerLines(req, (n, v) => `        .header(${rustString(n)}, ${rustString(v)})`)) lines.push(line);
  if (req.user) {
    const [user, pass] = splitUser(req.user);
    lines.push(`        .basic_auth(${rustString(user)}, Some(${rustString(pass)}))`);
  }
  if (req.body !== undefined) lines.push(`        .body(${rustString(req.body)})`);
  lines.push("        .send()", "        .await?;", '    println!("{}", res.text().await?);', "    Ok(())", "}");
  return lines.join("\n");
}

const GENERATORS: Record<Target, (req: ParsedRequest) => string> = {
  fetch: generateFetch,
  python: generatePython,
  go: generateGo,
  php: generatePhp,
  rust: generateRust,
};

export function generateSnippet(target: Target, request: ParsedRequest): string {
  return GENERATORS[target](request);
}

export function convertCurl(
  command: string,
  target: Target,
): { request: ParsedRequest; snippet: string; warnings: string[] } | { error: string } {
  const parsed = parseCurl(command);
  if ("error" in parsed) return parsed;
  return { request: parsed.request, snippet: generateSnippet(target, parsed.request), warnings: parsed.warnings };
}

export const exampleCurl = `curl -X POST https://api.example.com/v1/items \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer secret" \\
  -d '{"name":"widget","qty":3}'`;
