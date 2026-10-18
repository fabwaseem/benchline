"use client";

import { Fragment, useState } from "react";
import { ActionButton, TextInput, Toggle, OptionRow } from "@/components/kit/controls";
import { toast } from "sonner";
import { CodeOutput } from "@/components/kit/code-output";
import { FieldRow } from "@/components/kit/field-row";
import { Pane, StatusStrip, ToolCard, ToolPanes, ToolToolbar } from "@/components/kit/shell";
import { useWorkbenchKeys } from "@/components/kit/tool-shell";
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
    <ToolCard>
      <ToolToolbar
        actions={<ActionButton className="btn btn-ink" onClick={() => void navigator.clipboard.writeText(view.command).then(() => toast.success("Command copied"))}>Copy command</ActionButton>}
      />
      <ToolPanes>
        <Pane label="Permissions">
          <div className="grid grid-cols-[5.5rem_repeat(3,minmax(0,1fr))] items-center gap-2 text-[12px]">
            <span />
            {bits.map((bit) => <span key={bit} className="text-center text-muted-foreground uppercase">{bit}</span>)}
            {rows.map((who) => (
              <Fragment key={who}>
                <span className="text-sm capitalize">{who}</span>
                {bits.map((bit) => (
                  <span key={`${who}-${bit}`} className="flex justify-center">
                    <Toggle checked={mode[who][bit]} aria-label={`${who} ${bit}`} onCheckedChange={(value) => toggle(who, bit, value)} />
                  </span>
                ))}
              </Fragment>
            ))}
          </div>
          <OptionRow label="Setuid" checked={mode.setuid} onChange={(value) => { setDraft(null); setMode({ ...mode, setuid: value }); }} />
          <OptionRow label="Setgid" checked={mode.setgid} onChange={(value) => { setDraft(null); setMode({ ...mode, setgid: value }); }} />
          <OptionRow label="Sticky" checked={mode.sticky} onChange={(value) => { setDraft(null); setMode({ ...mode, sticky: value }); }} />
          <FieldRow label="Octal or symbolic" htmlFor="chmod-mode" error={error || undefined} help="755 or rwxr-xr-x.">
            <TextInput
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
            <TextInput id="chmod-path" value={path} onChange={(event) => setPath(event.target.value)} className="font-mono" />
          </FieldRow>
        </Pane>
        <Pane label="Command">
          <p className="truncate font-mono text-[28px] tracking-[-0.04em]" title={view.symbolic}>{view.symbolic}</p>
          <p className="text-sm text-muted-foreground">Octal {view.octal}</p>
          <CodeOutput code={view.command} label="chmod" fill />
        </Pane>
      </ToolPanes>
      <StatusStrip note={error || `${view.octal} · ${view.symbolic}`} tone={error ? "warn" : "pass"} />
    </ToolCard>
  );
}

