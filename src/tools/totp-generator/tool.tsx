"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, Eye, EyeOff, Plus, QrCode, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { toDataURL } from "qrcode";
import { ActionButton, ChipButton, Select, TextArea, TextInput } from "@/components/kit/controls";
import { CopyButton } from "@/components/kit/copy-button";
import { DownloadButton } from "@/components/kit/download-button";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { Segmented } from "@/components/kit/segmented";
import { Pane, StatusStrip, ToolCard, ToolPanes, ToolToolbar } from "@/components/kit/shell";
import { useWorkbenchKeys } from "@/components/kit/tool-shell";
import {
  buildOtpAuthUri,
  decodeBase32,
  generateHotp,
  generateTotp,
  groupCode,
  parseOtpAuthUri,
  TOTP_ALGORITHMS,
  type TotpAccount,
  type TotpAlgorithm,
  type TotpDigits,
} from "@/tools/totp-generator/lib/totp";

const STORAGE_KEY = "benchline.totp.accounts.v1";

type LiveCode = { code: string; secondsRemaining: number; period: number };

function newId(): string {
  return typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function loadAccounts(): TotpAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as TotpAccount[];
    return Array.isArray(parsed) ? parsed.filter((account) => typeof account?.secret === "string") : [];
  } catch {
    return [];
  }
}

export default function TotpGeneratorTool() {
  const [tab, setTab] = useState<"codes" | "manage">("codes");
  const [accounts, setAccounts] = useState<TotpAccount[]>([]);
  const [codes, setCodes] = useState<Record<string, LiveCode>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [qrFor, setQrFor] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState("");
  const [showSecrets, setShowSecrets] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState("");

  // Add-account form
  const [label, setLabel] = useState("");
  const [issuer, setIssuer] = useState("");
  const [secret, setSecret] = useState("");
  const [digits, setDigits] = useState<TotpDigits>(6);
  const [period, setPeriod] = useState(30);
  const [algorithm, setAlgorithm] = useState<TotpAlgorithm>("SHA1");
  const [mode, setMode] = useState<"totp" | "hotp">("totp");
  const [counter, setCounter] = useState(0);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const id = window.setTimeout(() => setAccounts(loadAccounts()), 0);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
    } catch {
      // Storage full or unavailable; the session still works.
    }
  }, [accounts]);

  useEffect(() => {
    let alive = true;
    const update = async () => {
      const nextCodes: Record<string, LiveCode> = {};
      const nextErrors: Record<string, string> = {};
      for (const account of accounts) {
        if (account.mode === "hotp") {
          const code = await generateHotp(account.secret, account.counter, { digits: account.digits, algorithm: account.algorithm });
          if (typeof code === "string") nextCodes[account.id] = { code, secondsRemaining: 0, period: account.period };
          else nextErrors[account.id] = code.error;
          continue;
        }
        const result = await generateTotp(
          account.secret,
          { digits: account.digits, period: account.period, algorithm: account.algorithm },
          Date.now(),
        );
        if ("error" in result) nextErrors[account.id] = result.error;
        else nextCodes[account.id] = { code: result.code, secondsRemaining: result.secondsRemaining, period: result.period };
      }
      if (alive) {
        setCodes(nextCodes);
        setErrors(nextErrors);
      }
    };
    void update();
    const id = window.setInterval(update, 1000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [accounts]);

  useEffect(() => {
    if (!qrFor) return;
    const account = accounts.find((item) => item.id === qrFor);
    if (!account) return;
    let alive = true;
    void toDataURL(buildOtpAuthUri(account), { width: 220, margin: 1 })
      .then((url) => {
        if (alive) setQrUrl(url);
      })
      .catch(() => {
        if (alive) toast.error("Could not render the QR code.");
      });
    return () => {
      alive = false;
    };
  }, [qrFor, accounts]);

  const exportText = useMemo(() => accounts.map((account) => buildOtpAuthUri(account)).join("\n"), [accounts]);

  useWorkbenchKeys({
    onCopy: () => {
      const first = accounts[0];
      const code = first ? codes[first.id]?.code : undefined;
      if (!code) return;
      void navigator.clipboard.writeText(code).then(() => toast.success("Copied"));
    },
  });

  function addAccount() {
    const key = decodeBase32(secret);
    if ("error" in key) {
      setFormError(key.error);
      return;
    }
    if (!label.trim()) {
      setFormError("Give the account a label.");
      return;
    }
    setAccounts((previous) => [
      ...previous,
      {
        id: newId(),
        label: label.trim(),
        issuer: issuer.trim(),
        secret: secret.trim().replace(/[\s-]/g, "").toUpperCase(),
        digits,
        period,
        algorithm,
        mode,
        counter,
      },
    ]);
    setLabel("");
    setIssuer("");
    setSecret("");
    setFormError("");
    toast.success("Account added");
  }

  function importAccounts() {
    const lines = importText.split("\n").map((line) => line.trim()).filter(Boolean);
    if (lines.length === 0) {
      setImportError("Paste one otpauth:// URI per line.");
      return;
    }
    const added: TotpAccount[] = [];
    for (const line of lines) {
      const parsed = parseOtpAuthUri(line);
      if ("error" in parsed) {
        setImportError(`Could not import a URI: ${parsed.error}`);
        return;
      }
      added.push({ ...parsed, id: newId() });
    }
    setAccounts((previous) => [...previous, ...added]);
    setImportText("");
    setImportError("");
    toast.success(`Imported ${added.length} account${added.length === 1 ? "" : "s"}`);
  }

  function bumpHotp(id: string) {
    setAccounts((previous) => previous.map((account) => (account.id === id ? { ...account, counter: account.counter + 1 } : account)));
  }

  function removeAccount(id: string) {
    setAccounts((previous) => previous.filter((account) => account.id !== id));
    if (qrFor === id) setQrFor(null);
  }

  const note = accounts.length === 0 ? "No accounts yet" : `${accounts.length} account${accounts.length === 1 ? "" : "s"} · secrets stay in this browser`;

  return (
    <ToolCard>
      <ToolToolbar
        label="View"
        options={[
          { value: "codes", label: "Codes" },
          { value: "manage", label: "Add & manage" },
        ]}
        value={tab}
        onChange={setTab}
      />
      {tab === "manage" ? (
        <ToolPanes>
          <Pane label="Add account">
            <FieldRow label="Label" htmlFor="totp-label" help="Shown next to the code, e.g. alice@example.com.">
              <TextInput id="totp-label" value={label} onChange={(event) => setLabel(event.target.value)} placeholder="alice@example.com" />
            </FieldRow>
            <FieldRow label="Issuer" htmlFor="totp-issuer" help="Optional service name.">
              <TextInput id="totp-issuer" value={issuer} onChange={(event) => setIssuer(event.target.value)} placeholder="Example" />
            </FieldRow>
            <FieldRow label="Secret" htmlFor="totp-secret" help="Base32 secret from the service.">
              <TextInput
                id="totp-secret"
                value={secret}
                onChange={(event) => setSecret(event.target.value)}
                placeholder="JBSWY3DPEHPK3PXP"
                className="font-mono"
                type={showSecrets ? "text" : "password"}
              />
            </FieldRow>
            <FieldRow label="Digits">
              <Segmented value={String(digits)} onChange={(value) => setDigits(Number(value) === 8 ? 8 : 6)} options={[{ value: "6", label: "6" }, { value: "8", label: "8" }]} label="Digits" />
            </FieldRow>
            <FieldRow label="Algorithm">
              <Segmented
                value={algorithm}
                onChange={(value) => setAlgorithm(value as TotpAlgorithm)}
                options={TOTP_ALGORITHMS.map((name) => ({ value: name, label: name }))}
                label="Algorithm"
              />
            </FieldRow>
            <FieldRow label="Mode">
              <Segmented value={mode} onChange={setMode} options={[{ value: "totp", label: "TOTP" }, { value: "hotp", label: "HOTP" }]} label="Mode" />
            </FieldRow>
            {mode === "totp" ? (
              <FieldRow label="Period">
                <Select value={period} onChange={(event) => setPeriod(Number(event.target.value))} aria-label="Period">
                  {[15, 30, 60].map((value) => (
                    <option key={value} value={value}>{value} seconds</option>
                  ))}
                </Select>
              </FieldRow>
            ) : (
              <FieldRow label="Counter" htmlFor="totp-counter">
                <TextInput id="totp-counter" type="number" min={0} value={counter} onChange={(event) => setCounter(Math.max(0, Number(event.target.value) || 0))} />
              </FieldRow>
            )}
            {formError ? <Notice tone="bad" role="alert" title={formError} /> : null}
            <ChipButton onClick={addAccount}>
              <Plus size={14} /> Add account
            </ChipButton>
          </Pane>
          <Pane label="Import & export">
            <FieldRow label="Import otpauth:// URIs" htmlFor="totp-import" help="One URI per line, from another authenticator.">
              <TextArea
                id="totp-import"
                value={importText}
                onChange={(event) => setImportText(event.target.value)}
                placeholder="otpauth://totp/Example:alice?secret=JBSW…&issuer=Example"
                rows={4}
                className="font-mono text-[13px]"
              />
            </FieldRow>
            {importError ? <Notice tone="bad" role="alert" title={importError} /> : null}
            <div className="flex flex-wrap gap-2">
              <ActionButton className="btn btn-ink" onClick={importAccounts} disabled={!importText.trim()}>Import</ActionButton>
              <DownloadButton filename="totp-backup.txt" content={exportText} mime="text/plain" label="Export URIs" disabled={accounts.length === 0} />
              <CopyButton value={exportText} label="Copy URIs" disabled={accounts.length === 0} />
              <ChipButton onClick={() => setShowSecrets((value) => !value)}>
                {showSecrets ? <EyeOff size={14} /> : <Eye size={14} />} {showSecrets ? "Hide" : "Show"} secrets
              </ChipButton>
            </div>
            <Notice
              tone="neutral"
              title="Back up before clearing site data"
              body="Accounts live in this browser's localStorage only. Export the URIs somewhere safe."
            />
          </Pane>
        </ToolPanes>
      ) : (
        <ToolPanes>
          <Pane label="Live codes">
            {accounts.length === 0 ? (
              <EmptyState
                art={<QrCode size={22} />}
                title="No accounts yet"
                hint="Add one under Add & manage, or paste an otpauth:// URI to import it."
                action={<ChipButton onClick={() => setTab("manage")}>Add an account</ChipButton>}
              />
            ) : (
              <ul className="flex flex-col gap-3">
                {accounts.map((account) => {
                  const live = codes[account.id];
                  const error = errors[account.id];
                  const fraction = live && live.period > 0 ? Math.max(0, Math.min(1, live.secondsRemaining / live.period)) : 0;
                  const uri = buildOtpAuthUri(account);
                  return (
                    <li key={account.id} className="rounded-xl border border-border bg-surface p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate text-[14px] font-medium">{account.label}</div>
                          <div className="text-[12px] text-muted-foreground">
                            {account.issuer ? `${account.issuer} · ` : ""}{account.mode.toUpperCase()} · {account.digits} digits · {account.algorithm}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          {account.mode === "hotp" ? (
                            <ChipButton onClick={() => bumpHotp(account.id)}>Next</ChipButton>
                          ) : null}
                          <CopyButton value={live?.code ?? ""} iconOnly icon={<Copy size={14} />} label="Copy code" disabled={!live} />
                          <ChipButton
                            onClick={() => {
                              setQrFor(qrFor === account.id ? null : account.id);
                              setQrUrl("");
                            }}
                            aria-label="Toggle QR code"
                          >
                            <QrCode size={14} />
                          </ChipButton>
                          <ChipButton onClick={() => removeAccount(account.id)} aria-label={`Remove ${account.label}`}>
                            <Trash2 size={14} />
                          </ChipButton>
                        </div>
                      </div>
                      {error ? (
                        <Notice tone="bad" role="alert" title={error} className="mt-2" />
                      ) : live ? (
                        <div className="mt-2">
                          <div className="flex items-baseline justify-between">
                            <span className="font-mono text-[26px] font-semibold tracking-widest">{groupCode(live.code)}</span>
                            {account.mode === "totp" ? (
                              <span className="font-mono text-[12px] text-muted-foreground">{live.secondsRemaining}s</span>
                            ) : (
                              <span className="font-mono text-[12px] text-muted-foreground">#{account.counter}</span>
                            )}
                          </div>
                          {account.mode === "totp" ? (
                            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                              <div className="h-full bg-primary transition-[width] duration-1000" style={{ width: `${fraction * 100}%` }} />
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <div className="mt-2 text-[13px] text-muted-foreground">Computing…</div>
                      )}
                      {qrFor === account.id ? (
                        <div className="mt-3 flex flex-col items-center gap-2">
                          {qrUrl ? <img src={qrUrl} alt={`Provisioning QR for ${account.label}`} width={180} height={180} /> : <div className="text-[13px] text-muted-foreground">Rendering…</div>}
                          <CopyButton value={uri} label="Copy otpauth URI" />
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </Pane>
        </ToolPanes>
      )}
      <StatusStrip note={note} tone="pass" />
    </ToolCard>
  );
}
