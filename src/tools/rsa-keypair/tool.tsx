"use client";

import { useState } from "react";
import { KeyRound, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { ActionButton, Select, TextArea } from "@/components/kit/controls";
import { CodeOutput } from "@/components/kit/code-output";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { Segmented } from "@/components/kit/segmented";
import { InkButton, Panel, ToolShell, ToolTabs, useWorkbenchKeys } from "@/components/kit/tool-shell";
import { generateMaterial, isKeyAlgorithm, jwkToMaterial, keyAlgorithms, pemToMaterial, type KeyAlgorithm, type KeyMaterial } from "@/tools/rsa-keypair/lib/keys";

export default function KeypairTool() {
  const [tab, setTab] = useState<"generate" | "pem" | "jwk">("generate");
  const [alg, setAlg] = useState<KeyAlgorithm>("ES256");
  const [bits, setBits] = useState<2048 | 4096>(2048);
  const [pem, setPem] = useState("");
  const [jwk, setJwk] = useState("");
  const [result, setResult] = useState<KeyMaterial | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const rsa = alg.startsWith("RS") || alg.startsWith("PS");

  async function run() {
    setBusy(true);
    setError("");
    const next = tab === "pem"
      ? await pemToMaterial(pem, alg)
      : tab === "jwk"
        ? await jwkToMaterial(jwk, alg)
        : await generateMaterial(alg, bits);
    setBusy(false);
    if ("error" in next) {
      setResult(null);
      setError(next.error);
      return;
    }
    setResult(next);
  }

  function clearSecrets() {
    setPem("");
    setJwk("");
    setResult(null);
    setError("");
  }

  useWorkbenchKeys({
    onEnter: () => void run(),
    onCopy: () => {
      if (!result?.publicPem) return;
      void navigator.clipboard.writeText(result.publicPem).then(() => toast.success("Public key copied"));
    },
    onEscape: clearSecrets,
  });

  return (
    <ToolShell
      runsLocally
      busy={busy}
      layout="split"
      tabs={<ToolTabs label="Mode" value={tab} onChange={setTab} options={[{ value: "generate", label: "Generate" }, { value: "pem", label: "From PEM" }, { value: "jwk", label: "From JWK" }]} />}
      actions={
        <>
          <InkButton onClick={clearSecrets}>Clear</InkButton>
          <InkButton disabled={!result} icon={<KeyRound size={15} />} onClick={() => result && void navigator.clipboard.writeText(result.publicPem).then(() => toast.success("Public key copied"))}>Copy public</InkButton>
        </>
      }
      status={
        <>
          <span className={error ? "dot dot-warn" : "dot"} />
          <span>{error || (result ? result.alg : "The private key stays in this browser")}</span>
        </>
      }
      input={
        <Panel title="Key">
          <Notice tone="neutral" icon={<ShieldCheck size={15} strokeWidth={1.75} />} title="Not sent, logged, or stored." body="Keys are generated and converted in this browser. The private key never leaves the page." />
          <FieldRow label="Algorithm" htmlFor="alg">
            <Select id="alg" value={alg} onChange={(event) => { if (isKeyAlgorithm(event.target.value)) setAlg(event.target.value); }}>
              {keyAlgorithms.map((item) => <option key={item} value={item}>{item}</option>)}
            </Select>
          </FieldRow>
          {tab === "generate" && rsa ? (
            <Segmented label="Modulus" value={String(bits)} onChange={(value) => setBits(value === "4096" ? 4096 : 2048)} options={[{ value: "2048", label: "2048" }, { value: "4096", label: "4096" }]} />
          ) : null}
          {tab === "pem" ? (
            <FieldRow label="PEM" htmlFor="pem" error={error || undefined}>
              <TextArea id="pem" value={pem} className="min-h-40 font-mono" onChange={(event) => setPem(event.target.value)} />
            </FieldRow>
          ) : null}
          {tab === "jwk" ? (
            <FieldRow label="JWK" htmlFor="jwk" error={error || undefined}>
              <TextArea id="jwk" value={jwk} className="min-h-40 font-mono" onChange={(event) => setJwk(event.target.value)} />
            </FieldRow>
          ) : null}
          <ActionButton disabled={busy || (tab === "pem" && !pem.trim()) || (tab === "jwk" && !jwk.trim())} onClick={() => void run()}>{busy ? "Working…" : tab === "generate" ? "Generate" : "Convert"}</ActionButton>
        </Panel>
      }
      output={
        <Panel title="Material">
          {result ? (
            <>
              <CodeOutput code={result.publicPem} filename="public.pem" label="Public PEM" />
              {result.privatePem ? <CodeOutput code={result.privatePem} filename="private.pem" label="Private PEM" /> : null}
              <CodeOutput code={result.jwks} filename="jwks.json" label="JWKS" />
              {result.privateJwk ? <CodeOutput code={result.privateJwk} filename="private.jwk" label="Private JWK" /> : null}
            </>
          ) : (
            <EmptyState art={<KeyRound size={22} />} title={error || "PEM and JWK show up here"} hint="RSA, EC, or Ed25519. The JWKS contains only the public key." />
          )}
        </Panel>
      }
    />
  );
}
