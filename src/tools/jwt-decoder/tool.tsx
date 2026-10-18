"use client";

import { useMemo, useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import { ActionButton, IconButton, TextArea } from "@/components/kit/controls";
import { Badge } from "@/components/kit/tag";
import { Check, Clock, Copy, Eye, EyeOff, KeyRound, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";
import { CodeEditor, CodeViewer } from "@/components/kit/code-viewer";
import { CopyButton } from "@/components/kit/copy-button";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { KvList } from "@/components/kit/kv-list";
import { Notice } from "@/components/kit/notice";
import { ResultStat } from "@/components/kit/result-stat";
import { Segmented } from "@/components/kit/segmented";
import { TokenSegments } from "@/components/kit/token-segments";
import { Pane, StatusStrip, ToolCard, ToolPanes, ToolToolbar } from "@/components/kit/shell";
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

  const status = statusLine({ result, alg, verify, expired, now: openedAt });
  const stripTone = status.color.includes("bad") ? "fail" : status.color.includes("warning") ? "warn" : status.color.includes("success") ? "pass" : "info";

  return (
    <div onKeyDown={onWindowKey}>
      <ToolCard>
        <ToolToolbar
          label="Mode"
          options={[{ value: "decode", label: "Decode" }, { value: "encode", label: "Encode" }]}
          value={tab}
          onChange={setTab}
          actions={<CopyButton value={payloadText} label="Copy payload" toastMessage="Payload copied" icon={<Copy />} />}
        />
        <ToolPanes ratio="40/60">
          <Pane label={tab === "decode" ? "Token" : "Sign"} padded={false} bodyClassName="flex flex-col gap-3">
            {tab === "decode" ? (
          <div id="panel-decode" role="tabpanel" aria-labelledby="tab-decode">
            <FieldRow
              className="px-4 pt-4"
              variant="well"
              label="JSON Web Token"
              htmlFor="jwt"
              help={TOKEN_HELP}
              actions={
                <span className="flex gap-1.5">
                  <ActionButton type="button" variant="ghost" size="xs" onClick={() => updateToken(EXAMPLE_TOKEN)}>Example</ActionButton>
                  <ActionButton type="button" variant="ghost" size="xs" onClick={clearToken}>Clear</ActionButton>
                </span>
              }
            >
              <div className="relative">
                {token ? (
                  <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden px-3.5 py-3.5 font-mono text-[12.5px] leading-[1.8] break-all whitespace-pre-wrap">
                    <TokenSegments header={parts[0] ?? ""} payload={parts[1] ?? ""} signature={parts[2] ?? ""} badSegment={isDecoded(result) ? undefined : result.segment} />
                  </div>
                ) : null}
                <TextArea
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
              <CodeEditor id="jwt-header" label="Header JSON" language="json" value={headerJson} onChange={(event) => setHeaderJson(event.target.value)} maxHeight={180} />
            </FieldRow>
            <FieldRow variant="well" label="Payload JSON" htmlFor="jwt-payload" error={jsonError(payloadJson)}>
              <CodeEditor id="jwt-payload" label="Payload JSON" language="json" value={payloadJson} onChange={(event) => setPayloadJson(event.target.value)} maxHeight={220} />
            </FieldRow>
            <FieldRow variant="well" label="HMAC secret" htmlFor="jwt-sign-secret" help={SIGN_HELP}>
              <TextArea id="jwt-sign-secret" value={signSecret} spellCheck={false} onChange={(event) => setSignSecret(event.target.value)} className={`${FIELD} min-h-16`} />
            </FieldRow>
            <ActionButton type="button" className="h-[38px] max-[699px]:h-11" onClick={() => void encode()}>Sign test token</ActionButton>
          </div>
        )}
        {tab === "decode" ? (
          <div className="flex flex-col gap-3.5 border-t border-border p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[11px] font-medium tracking-[0.07em] text-faint uppercase whitespace-nowrap">Verify signature</span>
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
                <TextArea
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
                  <IconButton label={secretVisible ? "Hide secret" : "Show secret"} className="absolute top-2 right-2" onClick={() => setSecretVisible((value) => !value)}>
                    {secretVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                  </IconButton>
                ) : null}
              </div>
            </FieldRow>
            <div>
              <div className="mb-2 text-[12.5px] font-medium text-fg2">Secret encoding</div>
              <Segmented label="Secret encoding" value={encoding} onChange={(value) => { setEncoding(value); setVerify(IDLE); }} options={[{ value: "utf8", label: "UTF-8" }, { value: "base64", label: "Base64" }]} className="w-full" />
            </div>
            {none ? null : (
              <ActionButton
                type="button"
                className="h-[38px] w-full aria-disabled:opacity-45 max-[699px]:h-11"
                aria-disabled={verifyDisabled || undefined}
                onClick={() => { if (!verifyDisabled) void check(); }}
              >
                <ShieldCheck />
                Verify signature
              </ActionButton>
            )}
            {!ok && token.trim() ? <p className="text-[12px] text-faint">Fix the token first.</p> : null}
            {ok ? <VerifyNotice verify={verify} alg={alg} /> : null}
          </div>
        ) : (
          <div className="flex flex-col gap-3 border-t border-border p-3">
            <Notice tone="neutral" icon={<ShieldCheck size={15} strokeWidth={1.75} />} title="Test secrets aren’t for production." body="Signing stays in this browser. Asymmetric private keys are not accepted here." />
          </div>
        )}
          </Pane>
          <Pane label={tab === "decode" ? "Claims" : "Token"}>
            {tab === "decode" ? <DecodedPane result={result} view={view} onView={setView} claims={claims} notices={notices} none={none} payloadText={payloadText} onExample={() => updateToken(EXAMPLE_TOKEN)} /> : (
          <div className="flex flex-1 flex-col p-4" aria-live="polite">
            {signError ? <Notice tone="bad" role="alert" icon={<X size={15} strokeWidth={1.75} />} title="Could not sign" body={signError} /> : null}
            {signed ? (
              <>
                <TokenSegments header={signed.split(".")[0] ?? ""} payload={signed.split(".")[1] ?? ""} signature={signed.split(".")[2] ?? ""} className="well p-3.5" />
                <div className="mt-3 flex gap-2">
                  <CopyButton value={signed} label="Copy token" toastMessage="Token copied" />
                  <ActionButton type="button" variant="outline" onClick={() => { setToken(signed); setVerify(IDLE); setAlert(""); setTab("decode"); }}>Open in Decode</ActionButton>
                </div>
              </>
            ) : signError ? null : (
              <EmptyState title="The test token shows up here" hint="HS256, HS384, or HS512. The secret stays in this browser." />
            )}
          </div>
            )}
          </Pane>
        </ToolPanes>
        <StatusStrip note={hydrated ? status.text : "Decoding…"} tone={stripTone} trailing="⌘↵ verify · ⌘⇧C copy payload · esc clear">
          <div className="grid w-full gap-2 min-[700px]:w-auto min-[700px]:grid-cols-2">
            <ResultStat variant="well" label="Claims" value={tab === "encode" ? String(claimCount(payloadJson)) : ok ? String(Object.keys(result.payload).length) : "0"} />
            <ResultStat variant="well" label={tab === "encode" ? "Algorithm" : "Token size"} value={tab === "encode" ? signAlg : ok ? `${new TextEncoder().encode(result.token).length} B` : "0 B"} />
          </div>
        </StatusStrip>
      </ToolCard>
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
        action={<ActionButton type="button" variant="outline" onClick={onExample}>Load an example</ActionButton>}
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
          <CodeViewer className="mx-4 mb-2" code={JSON.stringify(header, null, 2)} label="Header" language="json" maxHeight={220} wrapDefault />
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
      {payload && view === "json" ? <CodeViewer className="mx-4 mb-4" code={JSON.stringify(payload, null, 2)} label="Payload" language="json" maxHeight={320} wrapDefault /> : null}
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
  alg,
  verify,
  expired,
  now,
}: {
  result: ReturnType<typeof decodeJwt>;
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
  if (verify.status === "invalid") return { text: `${alg} · signature rejected`, color: "var(--status-bad)" };
  if (verify.status === "unsupported") return { text: verify.message, color: "var(--faint)" };
  if (expired && typeof result.payload.exp === "number") {
    return { text: `Expired ${relativeTo(new Date(result.payload.exp * 1000), now)}`, color: "var(--warning)" };
  }
  return { text: `${alg || "unsigned"} · 3 segments`, color: "var(--success)" };
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
