"use client";

import { useEffect, useState } from "react";
import { ActionButton, ChipButton, TextInput, Slider, OptionRow } from "@/components/kit/controls";
import { Copy, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { CopyButton } from "@/components/kit/copy-button";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { Pane, StatusStrip, ToolCard, ToolPanes, ToolToolbar } from "@/components/kit/shell";
import { useWorkbenchKeys } from "@/components/kit/tool-shell";
import { generatePassphrases, generatePasswords, passphraseStrength, passwordStrength, type PasswordOptions } from "@/tools/password-generator/lib/password";

export default function PasswordGeneratorTool() {
  const [tab, setTab] = useState<"password" | "passphrase">("password");
  const [length, setLength] = useState(20);
  const [lowercase, setLowercase] = useState(true);
  const [uppercase, setUppercase] = useState(true);
  const [digits, setDigits] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(true);
  const [words, setWords] = useState(6);
  const [separator, setSeparator] = useState("-");
  const [capitalize, setCapitalize] = useState(false);
  const [digit, setDigit] = useState(false);
  const [count, setCount] = useState(1);
  const [nonce, setNonce] = useState(0);
  const [values, setValues] = useState<string[]>([]);
  const [error, setError] = useState("");

  const options: PasswordOptions = { length, lowercase, uppercase, digits, symbols, excludeAmbiguous };

  useEffect(() => {
    const kick = window.setTimeout(() => {
      if (tab === "passphrase") {
        const result = generatePassphrases({ words, separator, capitalize, digit }, count);
        if ("error" in result) {
          setError(result.error);
          setValues([]);
          return;
        }
        setError("");
        setValues(result.phrases);
        return;
      }
      const result = generatePasswords({ length, lowercase, uppercase, digits, symbols, excludeAmbiguous }, count);
      if ("error" in result) {
        setError(result.error);
        setValues([]);
        return;
      }
      setError("");
      setValues(result);
    }, 0);
    return () => window.clearTimeout(kick);
  }, [capitalize, count, digit, digits, excludeAmbiguous, length, lowercase, nonce, separator, symbols, tab, uppercase, words]);

  const strength = tab === "passphrase"
    ? passphraseStrength({ words, separator, capitalize, digit })
    : passwordStrength(options);
  const text = values.join("\n");
  const tone = "error" in strength ? "bg-muted" : strength.label === "Weak" ? "bg-destructive" : strength.label === "Fair" ? "bg-amber" : strength.label === "Good" ? "bg-primary" : "bg-success";

  useWorkbenchKeys({
    onCopy: () => {
      if (!text) return;
      void navigator.clipboard.writeText(text).then(() => toast.success("Copied"));
    },
    onEscape: () => setNonce((value) => value + 1),
  });

  const note = error || ("error" in strength ? "" : `${strength.bits} bits · ${strength.label}`);

  return (
    <ToolCard>
      <ToolToolbar
        label="Style"
        options={[{ value: "password", label: "Password" }, { value: "passphrase", label: "Passphrase" }]}
        value={tab}
        onChange={setTab}
        actions={<ActionButton className="btn btn-ink" disabled={!text} onClick={() => void navigator.clipboard.writeText(text).then(() => toast.success("Copied"))}>Copy</ActionButton>}
      />
      <ToolPanes>
        <Pane label="Options">
          {tab === "password" ? (
            <>
              <FieldRow label={`Length ${length}`} htmlFor="pw-length">
                <Slider id="pw-length" value={[length]} min={4} max={128} onValueChange={(value) => setLength(value[0] ?? length)} />
              </FieldRow>
              <OptionRow label="Lowercase" checked={lowercase} onChange={setLowercase} />
              <OptionRow label="Uppercase" checked={uppercase} onChange={setUppercase} />
              <OptionRow label="Digits" checked={digits} onChange={setDigits} />
              <OptionRow label="Symbols" checked={symbols} onChange={setSymbols} />
              <OptionRow label="Exclude ambiguous characters" checked={excludeAmbiguous} onChange={setExcludeAmbiguous} />
            </>
          ) : (
            <>
              <FieldRow label={`Words ${words}`} htmlFor="pw-words" help="EFF short wordlist, 1,296 words.">
                <Slider id="pw-words" value={[words]} min={3} max={12} onValueChange={(value) => setWords(value[0] ?? words)} />
              </FieldRow>
              <FieldRow label="Separator" htmlFor="pw-sep">
                <TextInput id="pw-sep" value={separator} onChange={(event) => setSeparator(event.target.value)} className="font-mono" />
              </FieldRow>
              <OptionRow label="Capitalize words" checked={capitalize} onChange={setCapitalize} />
              <OptionRow label="Add a digit" checked={digit} onChange={setDigit} />
            </>
          )}
          <FieldRow label="How many" htmlFor="pw-count">
            <TextInput id="pw-count" type="number" min={1} max={100} value={count} onChange={(event) => setCount(Number(event.target.value))} />
          </FieldRow>
          <ChipButton onClick={() => setNonce((value) => value + 1)}>Generate again</ChipButton>
        </Pane>
        <Pane label="Generated">
          {"error" in strength ? null : (
            <div>
              <div className="mb-1 flex items-baseline justify-between text-[12px]">
                <span className="whitespace-nowrap">{strength.label}</span>
                <span className="font-mono text-muted-foreground">{strength.bits} bits</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                <div className={`h-full ${tone}`} style={{ width: `${strength.score}%` }} />
              </div>
            </div>
          )}
          {error ? <Notice tone="bad" role="alert" title={error} /> : null}
          {values.length === 0 && !error ? (
            <EmptyState art={<KeyRound size={22} />} title="Generating" hint="A password appears as soon as the options are valid." />
          ) : (
            <ul>
              {values.map((value, index) => (
                <li key={`${index}-${value}`} className="flex items-center gap-2 border-t border-border py-2">
                  <span className="min-w-0 flex-1 truncate font-mono text-[14px]" title={value}>{value}</span>
                  <CopyButton value={value} iconOnly icon={<Copy size={14} />} label="Copy password" />
                </li>
              ))}
            </ul>
          )}
        </Pane>
      </ToolPanes>
      <StatusStrip note={note} tone={error ? "warn" : "pass"} />
    </ToolCard>
  );
}

