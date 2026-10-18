"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { renderLlmsTxt } from "@/tools/llms-txt-generator/lib/llms";
import { decodeJwt, isDecoded } from "@/tools/jwt-decoder/lib/jwt";
import { explainCron } from "@/tools/cron-expression-builder/lib/cron";
import { buildDockerfile, dockerfileDefaults } from "@/tools/nextjs-dockerfile-generator/lib/dockerfile";
import { buildSchema, exampleValues } from "@/tools/schema-generator/lib/schema";
import { CodeViewer } from "@/components/kit/code-viewer";
import { metaTagsFor, resolveState } from "@/tools/og-image-generator/lib/og";

export function Flagship({ category, href, name }: { category: string; href: string; name: string }) {
  return (
    <div className="win">
      <div className="flex h-10 items-center gap-2 border-b border-border px-3 font-mono text-[11px] tracking-[0.07em] text-faint uppercase">
        <span className="flex gap-1.5" aria-hidden>
          <i className="size-2.5 rounded-full bg-border-strong" />
          <i className="size-2.5 rounded-full bg-border-strong" />
          <i className="size-2.5 rounded-full bg-border-strong" />
        </span>
        <span className="ml-2">{name}</span>
        <Link href={href} className="btn ml-auto h-7 normal-case tracking-normal">
          Open <ArrowRight size={13} strokeWidth={1.75} />
        </Link>
      </div>
      <div className="p-4">
        {category === "ai-search" ? <LlmsMini /> : null}
        {category === "auth" ? <JwtMini /> : null}
        {category === "developer" ? <CronMini /> : null}
        {category === "nextjs" ? <DockerMini /> : null}
        {category === "seo" ? <SchemaMini /> : null}
        {category === "social" ? <OgMini /> : null}
        {category === "ai-dev" ? <p className="text-sm text-muted-foreground">Counts tokens with o200k and prices the models on the bench. The count stays in this browser.</p> : null}
      </div>
    </div>
  );
}

function LlmsMini() {
  const [site, setSite] = useState("Benchline");
  const text = useMemo(
    () =>
      renderLlmsTxt(site, "Exact tools for people who ship the web.", [
        { url: "https://tools.fabwaseem.com/t/jwt-decoder", title: "JWT decoder", description: "Read and verify a token.", excerpt: "" },
        { url: "https://tools.fabwaseem.com/t/llms-txt-generator", title: "llms.txt generator", description: "Write the index.", excerpt: "" },
      ]),
    [site],
  );
  return (
    <div className="grid gap-3">
      <input value={site} onChange={(event) => setSite(event.target.value)} className="field text-foreground" aria-label="Site name" />
      <CodeViewer code={text} label="llms.txt" language="markdown" filename="llms.txt" maxHeight={192} dense />
    </div>
  );
}

function JwtMini() {
  const sample = "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJhZGEifQ.e30";
  const [token, setToken] = useState(sample);
  const decoded = decodeJwt(token);
  return (
    <div className="grid gap-3">
      <input value={token} onChange={(event) => setToken(event.target.value)} className="field font-mono text-foreground" aria-label="Token" />
      <CodeViewer code={isDecoded(decoded) ? JSON.stringify(decoded.payload, null, 2) : decoded.error} label="Payload" language="json" maxHeight={160} dense />
    </div>
  );
}

function CronMini() {
  const [expression, setExpression] = useState("0 9 * * 1-5");
  const result = explainCron(expression, "standard", "UTC", new Date("2026-10-19T08:00:00Z"));
  return (
    <div className="grid gap-3">
      <input value={expression} onChange={(event) => setExpression(event.target.value)} className="field font-mono text-foreground" aria-label="Cron expression" />
      <p className="text-sm">{result.valid ? result.english : result.error}</p>
    </div>
  );
}

function DockerMini() {
  const text = buildDockerfile(dockerfileDefaults).split("\n").slice(0, 8).join("\n");
  return <CodeViewer code={text} label="Dockerfile" language="dockerfile" filename="Dockerfile" maxHeight={192} dense />;
}

function SchemaMini() {
  const json = JSON.stringify(buildSchema("SoftwareApplication", exampleValues("SoftwareApplication")), null, 2);
  return <CodeViewer code={json} label="JSON-LD" language="json" filename="schema.json" maxHeight={192} dense />;
}

function OgMini() {
  const [title, setTitle] = useState("Designing tools people return to");
  return (
    <div className="grid gap-3">
      <input value={title} onChange={(event) => setTitle(event.target.value)} className="field text-foreground" aria-label="Card title" />
      <CodeViewer code={metaTagsFor(resolveState({ template: "editorial", title }))} label="Meta tags" language="html" maxHeight={160} dense />
    </div>
  );
}
