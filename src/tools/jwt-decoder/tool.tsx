"use client";

import { useMemo, useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import { Check, Clock, Copy, Eye, EyeOff, KeyRound, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";
import { CopyButton } from "@/components/kit/copy-button";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { KvList } from "@/components/kit/kv-list";
import { Notice } from "@/components/kit/notice";
import { ResultStat } from "@/components/kit/result-stat";
import { Segmented } from "@/components/kit/segmented";
import { TokenSegments } from "@/components/kit/token-segments";
import { ToolShell, ToolTabs } from "@/components/kit/tool-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  claimViews,
  decodeJwt,
  detectKey,
  EXAMPLE_SECRET,
  EXAMPLE_TOKEN,
  headerAlg,
  isDecoded,
  relativeTo,
  timeNotices,
  type JwtClaims,
} from "@/tools/jwt-decoder/lib/jwt";
import { signHs, verifyJwt, type VerifyResult } from "@/tools/jwt-decoder/lib/verify";

const IDLE: VerifyResult = { status: "idle", message: "Add a secret or public key to check the signature." };
const openedAt = Date.now();

function measureDecode(value: string) {
  const start = performance.now();
  decodeJwt(value);
  return performance.now() - start;
}

const initialMs = measureDecode(EXAMPLE_TOKEN);
const noopSubscribe = () => () => {};
// Timing and clock text differ between server and browser, so it only renders after hydration.
function useHydrated() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}
const TOKEN_HELP = "A Bearer prefix is stripped. The token stays in this browser.";
const KEY_HELP = "No JWKS URL is fetched. Paste the document instead.";
const SIGN_HELP = "For testing only. Asymmetric private keys are not accepted here.";
const FIELD = "min-h-[150px] w-full resize-y border-0 bg-transparent px-3.5 py-3.5 font-mono text-[12.5px] leading-[1.8] break-all shadow-none focus-visible:border-transparent focus-visible:ring-0 max-[699px]:min-h-11";

export default function JwtTool() {
  const [tab, setTab] = useState<"decode" | "encode">("decode");
  const [token, setToken] = useState(EXAMPLE_TOKEN);
  const [decodeMs, setDecodeMs] = useState(initialMs);
  const [secret, setSecret] = useState("");
  const [secretVisible, setSecretVisible] = useState(false);
  const [encoding, setEncoding] = useState<"utf8" | "base64">("utf8");
  const [verify, setVerify] = useState<VerifyResult>(IDLE);
  const [alert, setAlert] = useState("");
  const [headerJson, setHeaderJson] = useState('{\n  "typ": "JWT"\n}');
  const [payloadJson, setPayloadJson] = useState('{\n  "sub": "ada"\n}');
  const [signAlg, setSignAlg] = useState<"HS256" | "HS384" | "HS512">("HS256");
  const [signSecret, setSignSecret] = useState(EXAMPLE_SECRET);
  const [signed, setSigned] = useState("");
  const [signError, setSignError] = useState("");
  const [view, setView] = useState<"claims" | "json">("claims");
  const hydrated = useHydrated();
  const tokenRef = useRef<HTMLTextAreaElement>(null);
  const alertTimer = useRef<number | null>(null);
  const result = useMemo(() => decodeJwt(token), [token]);
  const ok = isDecoded(result);
  const parts = tokenParts(token);
  const keyKind = detectKey(secret);
  const maskSecret = secretVisible ? false : keyKind === "" || keyKind === "HMAC secret";
  const shownPayload = ok ? result.payload : result.partialPayload;
  const alg = ok ? headerAlg(result.header) : result.partialHeader ? headerAlg(result.partialHeader) : "";
  const claims = shownPayload ? claimViews(shownPayload, openedAt) : [];
  const notices = shownPayload ? timeNotices(shownPayload, openedAt) : [];
  const none = alg === "none";
  const expired = ok && typeof result.payload.exp === "number" && result.payload.exp * 1000 < openedAt;
  const verifyDisabled = !ok;
  const payloadText = ok ? JSON.stringify(result.payload, null, 2) : tab === "encode" ? payloadJson : "";

  function scheduleAlert(value: string) {
    if (alertTimer.current) window.clearTimeout(alertTimer.current);
    alertTimer.current = window.setTimeout(() => {
      const next = decodeJwt(value);
      setAlert(!value.trim() || isDecoded(next) ? "" : next.error);
    }, 400);
  }

  function updateToken(value: string) {
    setDecodeMs(measureDecode(value));
    setToken(value);
    setVerify(IDLE);
    scheduleAlert(value);
  }

  function clearToken() {
    if (secret.trim() && !window.confirm("Clear the token? The secret stays in this browser.")) return;
    updateToken("");
    setAlert("");
    tokenRef.current?.focus();
  }

  async function check() {
    if (!ok || none) return;
    setVerify(await verifyJwt(result.token, alg, secret, encoding));
  }

  async function encode() {
    try {
      const next = await signHs(headerJson, payloadJson, signSecret || EXAMPLE_SECRET, signAlg);
      setSigned(next);
      setSignError("");
    } catch (error) {
      setSigned("");
      setSignError(error instanceof Error ? error.message : "Could not sign.");
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Escape") return;
    event.preventDefault();
    clearToken();
  }

  function onWindowKey(event: KeyboardEvent) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      if (tab === "encode") void encode();
      else void check();
    }
    if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === "c") {
      event.preventDefault();
      if (!payloadText) return;
      void navigator.clipboard.writeText(payloadText).then(() => toast.success("Payload copied"));
    }
  }

  const status = statusLine({ result, ms: decodeMs, alg, verify, expired, now: openedAt });

  return (
    <div onKeyDown={onWindowKey}>
      <ToolShell
        runsLocally
        layout="split+inspector"
        tabs={<ToolTabs label="Mode" value={tab} onChange={setTab} options={[{ value: "decode", label: "Decode" }, { value: "encode", label: "Encode" }]} />}
        actions={
          <>
            <CopyButton value={payloadText} label="Copy payload" toastMessage="Payload copied" icon={<Copy />} className="hidden h-[30px] min-[700px]:inline-flex" />
            <CopyButton value={payloadText} label="Copy payload" toastMessage="Payload copied" icon={<Copy />} iconOnly className="min-[700px]:hidden" />
          </>
        }
        status={
          <>
            <span className="dot" style={{ background: status.color }} />
            <span>{hydrated ? status.text : "Decoding…"}</span>
            <span className="ml-auto hidden min-[700px]:inline">⌘↵ verify · ⌘⇧C copy payload · esc clear</span>
          </>
        }
        input={tab === "decode" ? (
          <div id="panel-decode" role="tabpanel" aria-labelledby="tab-decode">
            <FieldRow
              className="px-4 pt-4"
              variant="well"
              label="JSON Web Token"
              htmlFor="jwt"
              help={TOKEN_HELP}
              actions={
                <span className="flex gap-1.5">
                  <Button type="button" variant="ghost" size="xs" onClick={() => updateToken(EXAMPLE_TOKEN)}>Example</Button>
                  <Button type="button" variant="ghost" size="xs" onClick={clearToken}>Clear</Button>
                </span>
              }
            >
              <div className="relative">
                {token ? (
                  <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden px-3.5 py-3.5 font-mono text-[12.5px] leading-[1.8] break-all whitespace-pre-wrap">
                    <TokenSegments header={parts[0] ?? ""} payload={parts[1] ?? ""} signature={parts[2] ?? ""} badSegment={isDecoded(result) ? undefined : result.segment} />
                  </div>
                ) : null}
                <Textarea
                  ref={tokenRef}
                  id="jwt"
                  value={token}
                  placeholder="Paste a JWT, or a full “Authorization: Bearer …” header"
                  spellCheck={false}
                  autoCapitalize="off"
                  autoComplete="off"
                  onChange={(event) => updateToken(event.target.value)}
                  onKeyDown={onKeyDown}
                  className={`${FIELD} ${token ? "text-transparent caret-foreground" : ""}`}
                />
              </div>
            </FieldRow>
            {alert ? (
              <Notice className="mx-4 mt-3" tone="bad" role="alert" icon={<X size={15} strokeWidth={1.75} />} title={alert} />
            ) : null}
            {token && parts.length >= 2 ? (
              <div className="px-4 pt-3 pb-4">
                <TokenSegments header={parts[0] ?? ""} payload={parts[1] ?? ""} signature={parts[2] ?? ""} chips chipsOnly />
              </div>
            ) : (
              <div className="h-4" />
            )}
          </div>
        ) : (
          <div id="panel-encode" role="tabpanel" aria-labelledby="tab-encode" className="flex flex-col gap-3 p-4">
            <div>
              <div className="mb-2 text-[12.5px] font-medium text-fg2">Algorithm</div>
              <Segmented label="Algorithm" value={signAlg} onChange={setSignAlg} options={[{ value: "HS256", label: "HS256" }, { value: "HS384", label: "HS384" }, { value: "HS512", label: "HS512" }]} className="w-full" />
            </div>
            <FieldRow variant="well" label="Header JSON" htmlFor="jwt-header" error={jsonError(headerJson)}>
              <Textarea id="jwt-header" value={headerJson} spellCheck={false} onChange={(event) => setHeaderJson(event.target.value)} className={`${FIELD} min-h-24`} />
            </FieldRow>
            <FieldRow variant="well" label="Payload JSON" htmlFor="jwt-payload" error={jsonError(payloadJson)}>
              <Textarea id="jwt-payload" value={payloadJson} spellCheck={false} onChange={(event) => setPayloadJson(event.target.value)} className={`${FIELD} min-h-28`} />
            </FieldRow>
            <FieldRow variant="well" label="HMAC secret" htmlFor="jwt-sign-secret" help={SIGN_HELP}>
              <Textarea id="jwt-sign-secret" value={signSecret} spellCheck={false} onChange={(event) => setSignSecret(event.target.value)} className={`${FIELD} min-h-16`} />
            </FieldRow>
            <Button type="button" className="h-[38px] max-[699px]:h-11" onClick={() => void encode()}>Sign test token</Button>
          </div>
        )}
        output={tab === "decode" ? <DecodedPane result={result} view={view} onView={setView} claims={claims} notices={notices} none={none} payloadText={payloadText} onExample={() => updateToken(EXAMPLE_TOKEN)} /> : (
          <div className="flex flex-1 flex-col p-4" aria-live="polite">
            {signError ? <Notice tone="bad" role="alert" icon={<X size={15} strokeWidth={1.75} />} title="Could not sign" body={signError} /> : null}
            {signed ? (
              <>
                <TokenSegments header={signed.split(".")[0] ?? ""} payload={signed.split(".")[1] ?? ""} signature={signed.split(".")[2] ?? ""} className="well p-3.5" />
                <div className="mt-3 flex gap-2">
                  <CopyButton value={signed} label="Copy token" toastMessage="Token copied" />
                  <Button type="button" variant="outline" onClick={() => { setToken(signed); setVerify(IDLE); setAlert(""); setTab("decode"); }}>Open in Decode</Button>
                </div>
              </>
            ) : signError ? null : (
              <EmptyState title="The test token shows up here" hint="HS256, HS384, or HS512. The secret stays in this browser." />
            )}
          </div>
        )}
        inspector={tab === "decode" ? (
          <div className="flex flex-1 flex-col gap-3.5 p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[11px] font-medium tracking-[0.07em] text-faint uppercase">Verify signature</span>
              {alg ? <Badge variant="mono">{alg}</Badge> : null}
            </div>
            <FieldRow
              variant="well"
              label="Secret or public key"
              htmlFor="jwt-key"
              help={KEY_HELP}
              actions={keyKind ? <Badge variant="mono">detected: {keyKind}</Badge> : null}
            >
              <div className="relative">
                <Textarea
                  id="jwt-key"
                  value={secret}
                  spellCheck={false}
                  autoCapitalize="off"
                  autoComplete="off"
                  placeholder="HMAC secret, PEM, JWK, or JWKS"
                  onChange={(event) => { setSecret(event.target.value); setVerify(IDLE); }}
                  className={`${FIELD} min-h-[84px] pr-10 ${maskSecret ? "secret-mask" : ""}`}
                />
                {maskSecret || keyKind === "HMAC secret" || keyKind === "" ? (
                  <button type="button" className="absolute top-2 right-2 grid size-7 place-items-center text-muted-foreground" aria-label={secretVisible ? "Hide secret" : "Show secret"} onClick={() => setSecretVisible((value) => !value)}>
                    {secretVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                ) : null}
              </div>
            </FieldRow>
            <div>
              <div className="mb-2 text-[12.5px] font-medium text-fg2">Secret encoding</div>
              <Segmented label="Secret encoding" value={encoding} onChange={(value) => { setEncoding(value); setVerify(IDLE); }} options={[{ value: "utf8", label: "UTF-8" }, { value: "base64", label: "Base64" }]} className="w-full" />
            </div>
            {none ? null : (
              <Button
                type="button"
                className="h-[38px] w-full aria-disabled:opacity-45 max-[699px]:h-11"
                aria-disabled={verifyDisabled || undefined}
                onClick={() => { if (!verifyDisabled) void check(); }}
              >
                <ShieldCheck />
                Verify signature
                <span className="keycap ml-1 bg-transparent text-inherit shadow-[inset_0_0_0_1px_oklch(100%_0_0/0.25)]">⌘↵</span>
              </Button>
            )}
            {!ok && token.trim() ? <p className="text-[12px] text-faint">Fix the token first.</p> : null}
            {ok ? <VerifyNotice verify={verify} alg={alg} /> : null}
            <div className="mt-auto grid grid-cols-2 gap-2">
              <ResultStat variant="well" label="claims" value={ok ? String(Object.keys(result.payload).length) : "0"} />
              <ResultStat variant="well" label="token size" value={ok ? `${new TextEncoder().encode(result.token).length} B` : "0 B"} />
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col gap-3 p-4">
            <ResultStat variant="well" label="algorithm" value={signAlg} />
            <ResultStat variant="well" label="claims" value={String(claimCount(payloadJson))} />
            <Notice tone="neutral" icon={<ShieldCheck size={15} strokeWidth={1.75} />} title="Test secrets aren’t for production." body="Signing stays in this browser. Asymmetric private keys are not accepted here." />
          </div>
        )}
      />
    </div>
  );
}

function DecodedPane({
  result,
  view,
  onView,
  claims,
  notices,
  none,
  payloadText,
  onExample,
}: {
  result: ReturnType<typeof decodeJwt>;
  view: "claims" | "json";
  onView: (value: "claims" | "json") => void;
  claims: ReturnType<typeof claimViews>;
  notices: ReturnType<typeof timeNotices>;
  none: boolean;
  payloadText: string;
  onExample: () => void;
}) {
  if (!result || ("error" in result && !result.partialHeader && !result.partialPayload)) {
    return (
      <EmptyState
        art={<KeyRound size={28} strokeWidth={1.75} />}
        title="Paste a token to decode it"
        hint="Three segments, two JSON objects. Nothing is uploaded."
        action={<Button type="button" variant="outline" onClick={onExample}>Load an example</Button>}
      />
    );
  }
  const header = isDecoded(result) ? result.header : result.partialHeader;
  const payload = isDecoded(result) ? result.payload : result.partialPayload;
  return (
    <div aria-live="polite">
      {header ? (
        <>
          <div className="flex items-center gap-2 px-4 pt-3.5 pb-2">
            <span className="font-mono text-[11px] font-medium tracking-[0.07em] text-faint uppercase">Header</span>
            <span className="ml-auto flex gap-1.5">
              {typeof header.alg === "string" ? <Badge variant="mono">{header.alg}</Badge> : null}
              {typeof header.typ === "string" ? <Badge variant="mono">{header.typ}</Badge> : null}
            </span>
          </div>
          <pre className="well mx-4 mb-2 overflow-auto px-3.5 py-3 font-mono text-[12.5px] leading-[1.75] break-all whitespace-pre-wrap">{JSON.stringify(header, null, 2)}</pre>
        </>
      ) : null}
      <div className="flex items-center gap-2 px-4 pt-2 pb-2">
        <span className="font-mono text-[11px] font-medium tracking-[0.07em] text-faint uppercase">Payload</span>
        <div className="ml-auto flex items-center gap-1.5">
          {payload ? (
            <Segmented label="Payload view" value={view} onChange={onView} options={[{ value: "claims", label: "Claims" }, { value: "json", label: "JSON" }]} />
          ) : (
            <Badge variant="mono">invalid</Badge>
          )}
          {payloadText ? <CopyButton value={payloadText} label="Copy payload" toastMessage="Payload copied" icon={<Copy size={12} />} iconOnly variant="ghost" /> : null}
        </div>
      </div>
      {none ? (
        <Notice className="mx-4 mb-3" tone="bad" icon={<X size={15} strokeWidth={1.75} />} title="alg none has no signature." body="Anyone can edit this payload. Reject it in your app." />
      ) : null}
      {notices.map((notice) => (
        <Notice key={notice.title} className="mx-4 mb-3" tone="warn" icon={<Clock size={15} strokeWidth={1.75} />} title={notice.title} body={notice.body} />
      ))}
      {payload && view === "claims" ? <KvList items={claims} /> : null}
      {payload && view === "json" ? <pre className="well mx-4 mb-4 overflow-auto px-3.5 py-3 font-mono text-[12.5px] leading-[1.75] break-all whitespace-pre-wrap">{JSON.stringify(payload, null, 2)}</pre> : null}
      {!payload && "error" in result ? <p className="px-4 pb-4 font-mono text-[12px] break-all text-muted-foreground">{result.error}</p> : null}
    </div>
  );
}

function VerifyNotice({ verify, alg }: { verify: VerifyResult; alg: string }) {
  if (verify.status === "idle") {
    return <Notice tone="neutral" title="Not checked yet" body={verify.message} />;
  }
  if (verify.status === "verified") {
    return <Notice tone="ok" icon={<Check size={15} strokeWidth={1.75} />} title="Signature verified" body={verifiedBody(alg)} />;
  }
  if (verify.status === "invalid") {
    return <Notice tone="bad" role="alert" icon={<X size={15} strokeWidth={1.75} />} title="Signature doesn’t match." body="The secret is wrong, the encoding is wrong (try Base64), or the token was edited." />;
  }
  return <Notice tone="neutral" icon={<ShieldCheck size={15} strokeWidth={1.75} />} title="Can’t verify this token." body={verify.message} />;
}

function verifiedBody(alg: string) {
  const hmac: Record<string, string> = { HS256: "HMAC-SHA256", HS384: "HMAC-SHA384", HS512: "HMAC-SHA512" };
  if (hmac[alg]) return `${hmac[alg]} matches the secret. The header and payload have not been changed.`;
  return `${alg || "The signature"} matches the public key. The header and payload have not been changed.`;
}

function statusLine({
  result,
  ms,
  alg,
  verify,
  expired,
  now,
}: {
  result: ReturnType<typeof decodeJwt>;
  ms: number;
  alg: string;
  verify: VerifyResult;
  expired: boolean;
  now: number;
}) {
  if (!isDecoded(result)) {
    if (result.error === "Paste a token.") return { text: "Waiting for a token", color: "var(--faint)" };
    return { text: result.segment ? `Could not decode segment ${result.segment}` : result.error, color: "var(--status-bad)" };
  }
  if (alg === "none") return { text: "alg none · no signature", color: "var(--status-bad)" };
  if (verify.status === "invalid") return { text: `Decoded in ${ms.toFixed(1)} ms · ${alg} · signature rejected`, color: "var(--status-bad)" };
  if (verify.status === "unsupported") return { text: verify.message, color: "var(--faint)" };
  if (expired && typeof result.payload.exp === "number") {
    return { text: `Decoded · expired ${relativeTo(new Date(result.payload.exp * 1000), now)}`, color: "var(--warning)" };
  }
  return { text: `Decoded in ${ms.toFixed(1)} ms · ${alg || "unsigned"} · 3 segments`, color: "var(--success)" };
}

function tokenParts(value: string) {
  return value.trim().replace(/^bearer\s+/i, "").split(".");
}

function jsonError(text: string) {
  try {
    const value = JSON.parse(text) as unknown;
    if (!value || typeof value !== "object" || Array.isArray(value)) return "JSON must be an object.";
    return "";
  } catch (error) {
    return error instanceof Error ? error.message : "Invalid JSON.";
  }
}

function claimCount(text: string) {
  try {
    const value = JSON.parse(text) as JwtClaims;
    if (!value || typeof value !== "object" || Array.isArray(value)) return 0;
    return Object.keys(value).length;
  } catch {
    return 0;
  }
}
