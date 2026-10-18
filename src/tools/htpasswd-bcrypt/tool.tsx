"use client";

import { useState } from "react";
import { Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { ActionButton, OptionRow, Slider, TextInput } from "@/components/kit/controls";
import { CodeOutput } from "@/components/kit/code-output";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { Segmented } from "@/components/kit/segmented";
import { InkButton, Panel, ToolShell, ToolTabs, useWorkbenchKeys } from "@/components/kit/tool-shell";
import { hashLimits, hashPassword, type HashAlgorithm, type HashResult } from "@/tools/htpasswd-bcrypt/lib/hash";

export default function HtpasswdTool() {
  const [tab, setTab] = useState<"hash" | "verify">("hash");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [algorithm, setAlgorithm] = useState<HashAlgorithm>("bcrypt");
  const [cost, setCost] = useState(10);
  const [memory, setMemory] = useState(8192);
  const [hash, setHash] = useState("");
  const [result, setResult] = useState<HashResult | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    setError("");
    const next = await hashPassword({
      password,
      algorithm,
      cost,
      memory,
      username,
      hash: tab === "verify" ? hash : undefined,
    });
    setBusy(false);
    if ("error" in next) {
      setResult(null);
      setError(next.error);
      return;
    }
    setResult(next);
  }

  function clearSecrets() {
    setPassword("");
    setHash("");
    setResult(null);
    setError("");
  }

  useWorkbenchKeys({
    onEnter: () => void run(),
    onCopy: () => {
      if (!result) return;
      void navigator.clipboard.writeText(result.htpasswd).then(() => toast.success("Copied"));
    },
    onEscape: clearSecrets,
  });

  return (
    <ToolShell
      runsLocally
      busy={busy}
      layout="split"
      tabs={<ToolTabs label="Mode" value={tab} onChange={setTab} options={[{ value: "hash", label: "Hash" }, { value: "verify", label: "Verify" }]} />}
      actions={
        <>
          <InkButton onClick={clearSecrets}>Clear</InkButton>
          <InkButton disabled={!result} icon={<Lock size={15} />} onClick={() => result && void navigator.clipboard.writeText(result.htpasswd).then(() => toast.success("Copied"))}>Copy</InkButton>
        </>
      }
      status={
        <>
          <span className={error ? "dot dot-warn" : "dot"} />
          <span>{error || (result?.verified === true ? "Match" : result?.verified === false ? "Does not match" : result ? result.algorithm : "Password stays in this browser")}</span>
        </>
      }
      input={
        <Panel title="Password">
          <Notice tone="neutral" icon={<ShieldCheck size={15} strokeWidth={1.75} />} title="Not sent, logged, or stored." body="Hashing runs in this browser. The password never leaves the page." />
          <FieldRow label="Password" htmlFor="pw" error={error || undefined}>
            <TextInput id="pw" type="password" autoComplete="off" value={password} onChange={(event) => setPassword(event.target.value)} />
          </FieldRow>
          <Segmented label="Algorithm" value={algorithm} onChange={setAlgorithm} options={[{ value: "bcrypt", label: "bcrypt" }, { value: "argon2id", label: "argon2id" }]} />
          {algorithm === "bcrypt" ? (
            <FieldRow label={`Cost ${cost}`} htmlFor="cost" help={`${hashLimits.bcryptCost.min}–${hashLimits.bcryptCost.max}. 10 is the default.`}>
              <Slider id="cost" value={[cost]} min={hashLimits.bcryptCost.min} max={hashLimits.bcryptCost.max} onValueChange={(value) => setCost(value[0] ?? cost)} />
            </FieldRow>
          ) : (
            <FieldRow label={`Memory ${memory} KiB`} htmlFor="memory">
              <Slider id="memory" value={[memory]} min={1024} max={hashLimits.memory.max} step={1024} onValueChange={(value) => setMemory(value[0] ?? memory)} />
            </FieldRow>
          )}
          <FieldRow label="Username" htmlFor="user" help="Optional. Written as username:hash.">
            <TextInput id="user" value={username} autoComplete="off" className="font-mono" onChange={(event) => setUsername(event.target.value)} />
          </FieldRow>
          {tab === "verify" ? (
            <FieldRow label="Hash" htmlFor="hash">
              <TextInput id="hash" value={hash} className="font-mono" onChange={(event) => setHash(event.target.value)} />
            </FieldRow>
          ) : null}
          <OptionRow label={busy ? "Working…" : tab === "verify" ? "Verify" : "Hash"}>
            <ActionButton disabled={!password || busy || (tab === "verify" && !hash.trim())} onClick={() => void run()}>{tab === "verify" ? "Verify" : "Hash"}</ActionButton>
          </OptionRow>
        </Panel>
      }
      output={
        <Panel title="Hash">
          {result ? (
            <>
              {result.verified !== null ? <Notice tone={result.verified ? "ok" : "bad"} title={result.verified ? "The password matches." : "The password does not match."} /> : null}
              <CodeOutput code={result.hash} label={result.algorithm} />
              <CodeOutput code={result.htpasswd} filename="htpasswd.txt" label="htpasswd" />
            </>
          ) : (
            <EmptyState art={<Lock size={22} />} title={error || "The hash shows up here"} hint="bcrypt or argon2id, plus an htpasswd line when you set a username." />
          )}
        </Panel>
      }
    />
  );
}
