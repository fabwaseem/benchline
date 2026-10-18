"use client";

import { useMemo, useState } from "react";
import { ActionButton, ChipButton, OptionRow } from "@/components/kit/controls";
import { CodeEditor, CodeViewer } from "@/components/kit/code-viewer";
import { Diff } from "lucide-react";
import { toast } from "sonner";
import { CodeOutput } from "@/components/kit/code-output";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { ResultStat } from "@/components/kit/result-stat";
import { Segmented } from "@/components/kit/segmented";
import { Pane, StatusStrip, ToolCard, ToolPanes, ToolToolbar } from "@/components/kit/shell";
import { useWorkbenchKeys } from "@/components/kit/tool-shell";
import { compareText, diffModes, exampleLeft, exampleRight, sidePieces, type DiffMode, type DiffPiece, type DiffRow } from "@/tools/diff-checker/lib/diff";

type View = "side" | "inline";

export default function DiffCheckerTool() {
  const [left, setLeft] = useState(exampleLeft);
  const [right, setRight] = useState(exampleRight);
  const [mode, setMode] = useState<DiffMode>("line");
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
  const [view, setView] = useState<View>("side");
  const result = useMemo(() => compareText(left, right, mode, ignoreWhitespace), [ignoreWhitespace, left, mode, right]);

  useWorkbenchKeys({
    onCopy: () => {
      if (!result.patch) return;
      void navigator.clipboard.writeText(result.patch).then(() => toast.success("Patch copied"));
    },
    onEscape: () => {
      setLeft(exampleLeft);
      setRight(exampleRight);
      setMode("line");
      setIgnoreWhitespace(false);
    },
  });

  function swap() {
    setLeft(right);
    setRight(left);
  }

  const status = !result.ok
    ? result.error
    : result.unchanged
      ? "No differences"
      : `${result.added.toLocaleString("en-US")} added · ${result.removed.toLocaleString("en-US")} removed ${result.unit}`;

  return (
    <ToolCard>
      <ToolToolbar
        label="View"
        options={[{ value: "side", label: "Side by side" }, { value: "inline", label: "Inline" }]}
        value={view}
        onChange={setView}
        actions={
          <>
            <ChipButton className="h-8 max-[699px]:h-11" onClick={swap}>Swap</ChipButton>
            <ActionButton className="btn btn-ink" disabled={!result.patch} onClick={() => void navigator.clipboard.writeText(result.patch).then(() => toast.success("Patch copied"))}>Copy patch</ActionButton>
          </>
        }
      />
      <ToolPanes ratio="40/60">
        <Pane label="Texts">
          <FieldRow label="Original" htmlFor="diff-left">
            <CodeEditor id="diff-left" label="Original" language="plaintext" value={left} onChange={(event) => setLeft(event.target.value)} />
          </FieldRow>
          <FieldRow label="Changed" htmlFor="diff-right">
            <CodeEditor id="diff-right" label="Changed" language="plaintext" value={right} onChange={(event) => setRight(event.target.value)} />
          </FieldRow>
          <Segmented label="Mode" value={mode} onChange={setMode} options={diffModes.map((item) => ({ value: item, label: item }))} />
          <OptionRow label="Ignore whitespace" checked={ignoreWhitespace} onChange={setIgnoreWhitespace} />
        </Pane>
        <Pane label={view === "side" ? "Side by side" : "Inline"}>
          <div aria-live="polite" className="flex min-h-[240px] flex-col gap-3">
            {!result.ok ? (
              <>
                <Notice tone="bad" role="alert" title={result.error} />
                <EmptyState art={<Diff size={22} />} title="JSON did not parse" hint="Both sides need to be JSON in this mode." />
              </>
            ) : (
              <>
                {result.unchanged ? <Notice tone="ok" title="No differences" body={mode === "json" ? "The values match. Object key order is ignored." : "The two texts match under this comparison."} /> : null}
                {view === "inline" ? <Inline pieces={result.pieces} /> : mode === "word" || mode === "char" ? <PieceColumns pieces={result.pieces} /> : <LineRows rows={result.rows} />}
                {result.patch ? <CodeOutput code={result.patch} filename="changes.diff" label="Unified patch" /> : null}
              </>
            )}
          </div>
        </Pane>
      </ToolPanes>
      <StatusStrip note={status} tone={result.ok && result.unchanged ? "pass" : result.ok ? "warn" : "fail"} trailing="⌘⇧C copy patch · esc reset">
        <div className="grid w-full gap-2 min-[700px]:w-auto min-[700px]:grid-cols-2">
          <ResultStat variant="well" label={`Added ${result.unit}`} value={String(result.added)} />
          <ResultStat variant="well" label={`Removed ${result.unit}`} value={String(result.removed)} />
        </div>
      </StatusStrip>
    </ToolCard>
  );
}

function LineRows({ rows }: { rows: DiffRow[] }) {
  if (rows.length === 0) return <EmptyState title="Nothing to compare" hint="Paste text on both sides." />;
  return <CodeViewer label="Side by side" diff={{ view: "split", rows }} wrapDefault />;
}

function Inline({ pieces }: { pieces: DiffPiece[] }) {
  if (pieces.length === 0) return <EmptyState title="Nothing to compare" hint="Paste text on both sides." />;
  return <CodeViewer label="Inline diff" diff={{ view: "inline", pieces }} wrapDefault />;
}

function PieceColumns({ pieces }: { pieces: DiffPiece[] }) {
  return (
    <div className="grid gap-2 min-[700px]:grid-cols-2">
      <PieceList label="Original" pieces={sidePieces(pieces, "left")} />
      <PieceList label="Changed" pieces={sidePieces(pieces, "right")} />
    </div>
  );
}

function PieceList({ label, pieces }: { label: string; pieces: DiffPiece[] }) {
  return <CodeViewer label={label} diff={{ view: "inline", pieces }} wrapDefault />;
}
