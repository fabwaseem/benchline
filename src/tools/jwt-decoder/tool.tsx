"use client";

import { useMemo, useState } from "react";
import { CodeOutput } from "@/components/kit/code-output";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { ResultStat } from "@/components/kit/result-stat";
import { Segmented } from "@/components/kit/segmented";
import { ToolShell } from "@/components/kit/tool-shell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { claimRows, decodeJwt, headerAlg, isDecoded } from "@/tools/jwt-decoder/lib/jwt";
import { signHs, verifyJwt, type VerifyResult } from "@/tools/jwt-decoder/lib/verify";

const EXAMPLE = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZGEiLCJuYW1lIjoiQWRhIExvdmVsYWNlIiwicm9sZSI6Imluc3RydW1lbnQiLCJpc3MiOiJ0b29sc21pdGgiLCJhdWQiOiJiZW5jaCIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoxOTAwMDAwMDAwLCJqdGkiOiJleGFtcGxlIn0.mo41BCR5Fs9QKOtTKWteKpKBpB6cNlgfNAiaaCYT8C4";

export default function JwtTool() {
  const [tab, setTab] = useState<"decode" | "encode">("decode");
  const [token, setToken] = useState(EXAMPLE);
  const [secret, setSecret] = useState("");
  const [encoding, setEncoding] = useState<"utf8" | "base64">("utf8");
  const [verify, setVerify] = useState<VerifyResult>({ status: "idle", message: "Add a secret or public key to check the signature." });
  const [headerJson, setHeaderJson] = useState('{\n  "typ": "JWT"\n}');
  const [payloadJson, setPayloadJson] = useState('{\n  "sub": "ada"\n}');
  const [signAlg, setSignAlg] = useState<"HS256" | "HS384" | "HS512">("HS256");
  const [signed, setSigned] = useState("");
  const [signError, setSignError] = useState("");
  const decoded = useMemo(() => decodeJwt(token), [token]);

  async function check() {
    if (!isDecoded(decoded)) return;
    setVerify(await verifyJwt(decoded.token, headerAlg(decoded.header), secret, encoding));
  }

  async function encode() {
    try {
      setSigned(await signHs(headerJson, payloadJson, secret || "toolsmith-example", signAlg));
      setSignError("");
    } catch (error) {
      setSigned("");
      setSignError(error instanceof Error ? error.message : "Could not sign.");
    }
  }

  return (
    <ToolShell
      runsLocally
      actions={
        <Button type="button" variant="outline" onClick={() => { setToken(""); setSecret(""); setVerify({ status: "idle", message: "Cleared." }); setSigned(""); }}>
          Clear
        </Button>
      }
    >
      <div className="flex flex-col gap-4 p-4">
        <Segmented label="Mode" value={tab} onChange={setTab} options={[{ value: "decode", label: "Decode" }, { value: "encode", label: "Encode" }]} />
        {tab === "decode" ? (
          <div className="grid gap-4 lg:grid-cols-2 [&>*]:min-w-0">
            <div className="flex flex-col gap-3">
              <FieldRow label="JSON Web Token" htmlFor="jwt" help="A Bearer prefix is fine. The token stays in this browser.">
                <Textarea id="jwt" value={token} onChange={(event) => setToken(event.target.value)} className="min-h-32 font-mono text-xs break-all" />
              </FieldRow>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setToken(EXAMPLE)}>Load an example</Button>
              </div>
              {isDecoded(decoded) ? <Segments token={decoded.token} /> : null}
              <FieldRow label="Secret or public key" htmlFor="jwt-key" help="HMAC secret, PEM public key, JWK, or a pasted JWKS document. No JWKS URL is fetched.">
                <Textarea id="jwt-key" value={secret} onChange={(event) => setSecret(event.target.value)} className="min-h-24 font-mono text-xs" />
              </FieldRow>
              <Segmented label="Secret encoding" value={encoding} onChange={setEncoding} options={[{ value: "utf8", label: "UTF-8" }, { value: "base64", label: "Base64" }]} />
              <Button type="button" onClick={() => void check()}>Verify signature</Button>
            </div>
            <div className="flex flex-col gap-3" aria-live="polite">
              {isDecoded(decoded) ? (
                <>
                  <ResultStat label="Signature" value={verify.status === "verified" ? "Verified" : verify.status === "invalid" ? "Invalid" : verify.status === "unsupported" ? "Unsupported" : "Not checked"} hint={"message" in verify ? verify.message : "Signature matches the key."} />
                  {headerAlg(decoded.header) === "none" ? <p className="text-sm text-destructive">alg none has no signature.</p> : null}
                  {!decoded.payload.exp ? <p className="text-sm text-amber-foreground">No exp claim.</p> : null}
                  <CodeOutput code={JSON.stringify(decoded.header, null, 2)} label="Header" />
                  <CodeOutput code={JSON.stringify(decoded.payload, null, 2)} label="Payload" />
                  <ul className="divide-y divide-border rounded-lg border border-border text-sm">
                    {claimRows(decoded.payload).map((row) => (
                      <li key={row.name} className="grid gap-1 px-3 py-2 sm:grid-cols-[4rem_1fr]">
                        <span className="font-mono text-xs">{row.name}</span>
                        <span>{row.value}</span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <EmptyState title={"error" in decoded ? decoded.error : "Paste a token"} hint="Three segments, two JSON objects." />
              )}
            </div>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2 [&>*]:min-w-0">
            <div className="flex flex-col gap-3">
              <Segmented label="Algorithm" value={signAlg} onChange={setSignAlg} options={[{ value: "HS256", label: "HS256" }, { value: "HS384", label: "HS384" }, { value: "HS512", label: "HS512" }]} />
              <FieldRow label="Header JSON" htmlFor="jwt-header"><Textarea id="jwt-header" value={headerJson} onChange={(event) => setHeaderJson(event.target.value)} className="min-h-24 font-mono text-xs" /></FieldRow>
              <FieldRow label="Payload JSON" htmlFor="jwt-payload"><Textarea id="jwt-payload" value={payloadJson} onChange={(event) => setPayloadJson(event.target.value)} className="min-h-28 font-mono text-xs" /></FieldRow>
              <FieldRow label="HMAC secret" htmlFor="jwt-sign-secret" help="For testing only. Asymmetric private keys are not accepted here.">
                <Textarea id="jwt-sign-secret" value={secret} onChange={(event) => setSecret(event.target.value)} className="min-h-16 font-mono text-xs" />
              </FieldRow>
              <Button type="button" onClick={() => void encode()}>Sign test token</Button>
            </div>
            <div aria-live="polite">
              {signError ? <EmptyState title="Could not sign" hint={signError} /> : signed ? <CodeOutput code={signed} label="Signed token" /> : <EmptyState title="The test token shows up here" hint="HS256, HS384, or HS512. The secret stays in this browser." />}
            </div>
          </div>
        )}
      </div>
    </ToolShell>
  );
}

function Segments({ token }: { token: string }) {
  const [header, payload, signature] = token.split(".");
  return (
    <p className="overflow-x-auto font-mono text-xs break-all">
      <span className="text-primary">{header}</span>.<span className="text-cat-seo">{payload}</span>.<span className="text-amber-foreground">{signature}</span>
    </p>
  );
}
