"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Cover } from "@/components/site/cover";
import { claimRows, decodeJwt, headerAlg, isDecoded } from "@/tools/jwt-decoder/lib/jwt";
import { signHs, verifyJwt, type VerifyResult } from "@/tools/jwt-decoder/lib/verify";
import { explainCron } from "@/tools/cron-expression-builder/lib/cron";
import { buildMetaTags, ogExample, type OgInput } from "@/tools/og-image-generator/lib/og";
import { money } from "@/tools/ai-token-counter/lib/cost";

type Tab = "jwt" | "cron" | "tokens" | "og";

const tabs: { id: Tab; label: string; hue: number; icon: string; href: string }[] = [
  { id: "jwt", label: "JWT", hue: 150, icon: "KeyRound", href: "/t/jwt-decoder" },
  { id: "cron", label: "Cron", hue: 200, icon: "Clock", href: "/t/cron-expression-builder" },
  { id: "tokens", label: "Tokens", hue: 75, icon: "Coins", href: "/t/ai-token-counter" },
  { id: "og", label: "OG image", hue: 300, icon: "Image", href: "/t/og-image-generator" },
];

export function DemoWindow() {
  const [tab, setTab] = useState<Tab>("jwt");
  const current = tabs.find((item) => item.id === tab) ?? tabs[0]!;
  return (
    <div id="try" className="page-x">
      <div className="win">
        <div className="flex h-[46px] items-center gap-3 border-b border-border bg-gradient-to-b from-surface to-well px-3.5">
          <span className="flex gap-1.5" aria-hidden>
            <i className="size-2.5 rounded-full bg-border-strong" />
            <i className="size-2.5 rounded-full bg-border-strong" />
            <i className="size-2.5 rounded-full bg-border-strong" />
          </span>
          <div className="seg ml-2 max-w-full overflow-x-auto" role="tablist" aria-label="Try a tool">
            {tabs.map((item) => (
              <button key={item.id} type="button" role="tab" aria-label={item.label} aria-selected={tab === item.id} className={tab === item.id ? "on" : ""} onClick={() => setTab(item.id)}>
                <Cover hue={item.hue} icon={item.icon} size={18} />
                <span className={item.id === "og" || item.id === "tokens" ? "max-[699px]:hidden" : ""}>{item.label}</span>
              </button>
            ))}
          </div>
          <div className="ml-auto hidden items-center gap-2 min-[700px]:flex">
            <span className="chip"><span className="dot" /> Runs locally</span>
            <Link href={current.href} className="btn h-[30px] text-[12.5px]">
              Open full tool <ArrowRight size={13} strokeWidth={1.75} />
            </Link>
          </div>
        </div>
        {tab === "jwt" ? <JwtPane /> : null}
        {tab === "cron" ? <CronPane /> : null}
        {tab === "tokens" ? <TokenPane /> : null}
        {tab === "og" ? <OgPane /> : null}
      </div>
    </div>
  );
}

function JwtPane() {
  const [token, setToken] = useState("");
  const [secret, setSecret] = useState("benchline-demo");
  const [verify, setVerify] = useState<VerifyResult>({ status: "idle", message: "Add a secret to check the signature." });
  const [elapsed, setElapsed] = useState<number | null>(null);
  const decoded = useMemo(() => (token ? decodeJwt(token) : null), [token]);

  useEffect(() => {
    let cancel = false;
    const header = JSON.stringify({ alg: "HS256", typ: "JWT" });
    const exp = Math.floor(Date.now() / 1000) + 58 * 60;
    const payload = JSON.stringify({ sub: "usr_8f2a", name: "Waseem Anjum", role: "admin", iat: exp - 3600, exp });
    void signHs(header, payload, "benchline-demo", "HS256").then(async (signed) => {
      if (cancel) return;
      const started = performance.now();
      decodeJwt(signed);
      setElapsed(performance.now() - started);
      setToken(signed);
      setVerify(await verifyJwt(signed, "HS256", "benchline-demo", "utf8"));
    });
    return () => {
      cancel = true;
    };
  }, []);

  async function check(nextSecret: string, nextToken: string) {
    if (!isDecoded(decodeJwt(nextToken))) return;
    const decodedNow = decodeJwt(nextToken);
    if (!isDecoded(decodedNow)) return;
    setVerify(await verifyJwt(decodedNow.token, headerAlg(decodedNow.header), nextSecret, "utf8"));
  }

  const rows = decoded && isDecoded(decoded) ? Object.entries(decoded.payload) : [];
  return (
    <>
      <div className="grid min-h-[420px] min-[900px]:grid-cols-[1.05fr_1fr_340px]">
        <div className="min-w-0 border-b border-border min-[900px]:border-r min-[900px]:border-b-0">
          <div className="pane-h flex h-10 items-center border-b border-border px-4 font-mono text-[11px] font-medium tracking-[0.07em] text-faint uppercase">Encoded</div>
          <textarea value={token} onChange={(event) => setToken(event.target.value)} spellCheck={false} className="min-h-48 w-full resize-none bg-transparent p-5 font-mono text-[12.5px] leading-7 break-all outline-none" aria-label="JSON Web Token" />
        </div>
        <div className="min-w-0 border-b border-border min-[900px]:border-r min-[900px]:border-b-0">
          <div className="flex h-10 items-center border-b border-border px-4 font-mono text-[11px] font-medium tracking-[0.07em] text-faint uppercase">Decoded claims</div>
          {decoded && isDecoded(decoded) ? (
            rows.map(([key, value]) => (
              <div key={key} className="grid grid-cols-[76px_minmax(0,1fr)] gap-3 border-b border-border px-4 py-2.5 text-[13px] last:border-0">
                <span className="font-mono text-faint">{key}</span>
                <span className="truncate font-mono">{typeof value === "string" ? value : JSON.stringify(value)}</span>
              </div>
            ))
          ) : (
            <p className="p-4 text-sm text-muted-foreground">{decoded && !isDecoded(decoded) ? decoded.error : "Signing a sample token…"}</p>
          )}
          {decoded && isDecoded(decoded) ? (
            <ul className="px-4 py-3 text-[12px] text-faint">
              {claimRows(decoded.payload).map((row) => (
                <li key={row.name}>{row.name}: {row.value}</li>
              ))}
            </ul>
          ) : null}
        </div>
        <div>
          <div className="flex h-10 items-center border-b border-border px-4 font-mono text-[11px] font-medium tracking-[0.07em] text-faint uppercase">Signature</div>
          <div className="flex flex-col gap-3 p-4">
            <input
              value={secret}
              onChange={(event) => {
                setSecret(event.target.value);
                void check(event.target.value, token);
              }}
              className="field font-mono"
              aria-label="HMAC secret"
              type="text"
            />
            <div className="well flex gap-2.5 p-3.5">
              <div>
                <div className="text-[13.5px] font-semibold">{verify.status === "verified" ? "Signature verified" : verify.status === "invalid" ? "Signature invalid" : "Not verified"}</div>
                <div className="mt-0.5 text-[12.5px] text-muted-foreground">{"message" in verify ? verify.message : "HMAC-SHA256 matches the secret."}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="well p-3">
                <div className="font-mono text-[22px] tracking-[-0.04em]">{rows.length}</div>
                <div className="text-[12px] text-muted-foreground">claims</div>
              </div>
              <div className="well p-3">
                <div className="font-mono text-[22px] tracking-[-0.04em]">{token ? new TextEncoder().encode(token).length : 0}<span className="text-[13px] text-faint"> B</span></div>
                <div className="text-[12px] text-muted-foreground">token size</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex h-[34px] items-center gap-4 border-t border-border bg-well px-4 font-mono text-[11.5px] font-medium text-faint">
        <span className="dot" />
        {elapsed === null ? "Decoding" : `Decoded in ${elapsed < 0.1 ? "<0.1" : elapsed.toFixed(1)} ms`}
        <span>HS256</span>
        <span className="ml-auto hidden min-[700px]:inline">Nothing left this tab</span>
      </div>
    </>
  );
}

function CronPane() {
  const [expression, setExpression] = useState("*/15 9-17 * * 1-5");
  const result = useMemo(() => explainCron(expression, "standard", "UTC"), [expression]);
  return (
    <div className="grid gap-4 p-5 min-[800px]:grid-cols-[280px_1fr]">
      <label className="text-sm text-muted-foreground">
        Expression
        <input value={expression} onChange={(event) => setExpression(event.target.value)} className="field mt-2 font-mono text-foreground" />
      </label>
      <div>
        <p className="text-[15px]">{result.valid ? result.english : result.error}</p>
        <div className="mt-4 border-l border-border-strong">
          {result.runs.slice(0, 4).map((run) => (
            <div key={run.utc} className="relative py-1 pl-4 font-mono text-[12.5px]">
              <span className="absolute top-2.5 -left-1 size-1.5 rounded-full bg-foreground" />
              {run.utc.replace("T", " ").replace(".000Z", "Z")}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TokenPane() {
  const [text, setText] = useState("Summarise this changelog for a release tweet. Keep it under 280 characters and mention the llms.txt validator.");
  const [rows, setRows] = useState<{ label: string; count: number; cost: string }[]>([]);
  useEffect(() => {
    let cancel = false;
    void import("@/tools/ai-token-counter/lib/tokenize").then(async ({ countTokens }) => {
      const { priceSelected } = await import("@/tools/ai-token-counter/lib/cost");
      const { DEFAULT_MODEL_IDS } = await import("@/tools/ai-token-counter/lib/prices");
      const counted = countTokens(text, "o200k");
      const priced = priceSelected({ ids: [...DEFAULT_MODEL_IDS], inputTokens: counted.count, outputTokens: 120, cachedRatio: 0, requestsPerDay: 1 });
      if (cancel) return;
      setRows(priced.map((row) => ({ label: row.model.label, count: counted.count, cost: money(row.requestUsd) })));
    });
    return () => {
      cancel = true;
    };
  }, [text]);
  return (
    <div className="grid gap-4 p-5">
      <textarea value={text} onChange={(event) => setText(event.target.value)} className="well min-h-24 w-full resize-none p-3.5 text-[13px] text-fg2 outline-none" aria-label="Prompt" />
      <div className="grid gap-2 min-[700px]:grid-cols-3">
        {rows.map((row) => (
          <div key={row.label} className="well p-3">
            <div className="font-mono text-[11.5px] text-faint">{row.label}</div>
            <div className="mt-1 font-mono text-[20px] tracking-[-0.04em]">{row.count.toLocaleString("en-US")}</div>
            <div className="font-mono text-[11px] text-faint">{row.cost} with 120 output tokens</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OgPane() {
  const [title, setTitle] = useState(ogExample.title);
  const input: OgInput = { ...ogExample, title };
  return (
    <div className="grid gap-4 p-5 min-[800px]:grid-cols-[1fr_240px]">
      <div className="relative flex aspect-[1200/630] flex-col justify-end overflow-hidden rounded-xl bg-foreground p-6 text-background shadow-[var(--shadow-2)]">
        <div className="font-mono text-[11px] tracking-[0.06em] text-background/60">BENCHLINE · SAMPLE</div>
        <div className="mt-auto max-w-[16ch] text-[clamp(22px,3vw,34px)] leading-none font-semibold tracking-[-0.045em]">{title}</div>
      </div>
      <label className="text-sm text-muted-foreground">
        Title
        <input value={title} onChange={(event) => setTitle(event.target.value)} className="field mt-2 text-foreground" />
        <pre className="mt-3 max-h-40 overflow-auto font-mono text-[11px] leading-relaxed text-faint">{buildMetaTags(input, "https://tools.fabwaseem.com/opengraph-image")}</pre>
      </label>
    </div>
  );
}
