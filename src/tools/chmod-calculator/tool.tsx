"use client";

import { Fragment, useState } from "react";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { CodeOutput } from "@/components/kit/code-output";
import { FieldRow } from "@/components/kit/field-row";
import { InkButton, Panel, ToolShell, useWorkbenchKeys } from "@/components/kit/tool-shell";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { blankMode, formatMode, parseMode, type Mode, type Triad } from "@/tools/chmod-calculator/lib/chmod";

const rows = ["owner", "group", "other"] as const;
const bits = ["read", "write", "execute"] as const;

export default function ChmodCalculatorTool() {
  const [mode, setMode] = useState<Mode>(blankMode());
  const [draft, setDraft] = useState<string | null>(null);
  const [path, setPath] = useState("file");
  const view = formatMode(mode, path);
  const shown = draft ?? view.octal;
  const parsed = parseMode(shown, path);
  const error = draft !== null && "error" in parsed ? parsed.error : "";

  useWorkbenchKeys({
    onCopy: () => {
      void navigator.clipboard.writeText(view.command).then(() => toast.success("Command copied"));
    },
  });

  function toggle(who: (typeof rows)[number], bit: keyof Triad, value: boolean) {
    setDraft(null);
    setMode({ ...mode, [who]: { ...mode[who], [bit]: value } });
  }

  return (
    <ToolShell
      runsLocally
      layout="split"
      actions={<InkButton icon={<Copy size={15} />} onClick={() => void navigator.clipboard.writeText(view.command).then(() => toast.success("Command copied"))}>Copy command</InkButton>}
      status={
        <>
          <span className={error ? "dot dot-warn" : "dot"} />
          <span>{error || `${view.octal} · ${view.symbolic}`}</span>
        </>
      }
      input={
        <Panel title="Permissions">
          <div className="grid grid-cols-[5.5rem_repeat(3,minmax(0,1fr))] items-center gap-2 text-[12px]">
            <span />
            {bits.map((bit) => <span key={bit} className="text-center text-muted-foreground uppercase">{bit}</span>)}
            {rows.map((who) => (
              <Fragment key={who}>
                <span className="text-sm capitalize">{who}</span>
                {bits.map((bit) => (
                  <span key={`${who}-${bit}`} className="flex justify-center">
                    <Switch checked={mode[who][bit]} aria-label={`${who} ${bit}`} onCheckedChange={(value) => toggle(who, bit, value)} />
                  </span>
                ))}
              </Fragment>
            ))}
          </div>
          <Toggle label="Setuid" checked={mode.setuid} onChange={(value) => { setDraft(null); setMode({ ...mode, setuid: value }); }} />
          <Toggle label="Setgid" checked={mode.setgid} onChange={(value) => { setDraft(null); setMode({ ...mode, setgid: value }); }} />
          <Toggle label="Sticky" checked={mode.sticky} onChange={(value) => { setDraft(null); setMode({ ...mode, sticky: value }); }} />
          <FieldRow label="Octal or symbolic" htmlFor="chmod-mode" error={error || undefined} help="755 or rwxr-xr-x.">
            <Input
              id="chmod-mode"
              value={shown}
              onChange={(event) => {
                const value = event.target.value;
                setDraft(value);
                const next = parseMode(value, path);
                if (!("error" in next)) setMode(next.mode);
              }}
              className="font-mono"
              aria-invalid={Boolean(error)}
            />
          </FieldRow>
          <FieldRow label="Path" htmlFor="chmod-path">
            <Input id="chmod-path" value={path} onChange={(event) => setPath(event.target.value)} className="font-mono" />
          </FieldRow>
        </Panel>
      }
      output={
        <Panel title="Command">
          <p className="font-mono text-[28px] tracking-[-0.04em]">{view.symbolic}</p>
          <p className="text-sm text-muted-foreground">Octal {view.octal}</p>
          <CodeOutput code={view.command} label="chmod" />
        </Panel>
      }
    />
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex min-h-11 items-center justify-between gap-3 text-sm">
      {label}
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}
