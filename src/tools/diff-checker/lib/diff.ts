import { createTwoFilesPatch, diffChars, diffLines, diffWords, diffWordsWithSpace, type Change } from "diff";
import { parse, printParseErrorCode, type ParseError, type ParseErrorCode } from "jsonc-parser";

export const diffModes = ["line", "word", "char", "json"] as const;

export type DiffMode = (typeof diffModes)[number];

export type DiffPiece = {
  type: "same" | "add" | "remove";
  value: string;
};

export type DiffRow = {
  kind: "same" | "add" | "remove" | "change";
  left: string;
  right: string;
  leftNumber: number | null;
  rightNumber: number | null;
};

export type TextDiff = {
  ok: boolean;
  error: string;
  pieces: DiffPiece[];
  rows: DiffRow[];
  patch: string;
  added: number;
  removed: number;
  unit: "lines" | "characters";
  unchanged: boolean;
};

export const exampleLeft = `const name = "Ada";
const year = 1843;
`;

export const exampleRight = `const name = "Ada Lovelace";
const year = 1843;
const field = "math";
`;

const empty: TextDiff = {
  ok: true,
  error: "",
  pieces: [],
  rows: [],
  patch: "",
  added: 0,
  removed: 0,
  unit: "lines",
  unchanged: true,
};

export function compareText(left: string, right: string, mode: DiffMode, ignoreWhitespace: boolean): TextDiff {
  if (mode === "json") return compareJson(left, right);
  const changes = changesFor(left, right, mode, ignoreWhitespace);
  const pieces = changes.map(pieceOf);
  const lineMode = mode === "line";
  const rows = lineMode ? rowsFrom(changes) : [];
  const added = lineMode ? countLines(changes, "add") : countChars(changes, "add");
  const removed = lineMode ? countLines(changes, "remove") : countChars(changes, "remove");
  return {
    ok: true,
    error: "",
    pieces,
    rows,
    patch: createTwoFilesPatch("original", "changed", left, right, undefined, undefined, {
      context: 3,
      ignoreWhitespace: lineMode ? ignoreWhitespace : false,
    }),
    added,
    removed,
    unit: lineMode ? "lines" : "characters",
    unchanged: added === 0 && removed === 0,
  };
}

export function sidePieces(pieces: DiffPiece[], side: "left" | "right"): DiffPiece[] {
  return pieces.filter((piece) => piece.type === "same" || (side === "left" ? piece.type === "remove" : piece.type === "add"));
}

function compareJson(left: string, right: string): TextDiff {
  const parsedLeft = readJson(left, "Left");
  if (!parsedLeft.ok) return { ...empty, ok: false, error: parsedLeft.error };
  const parsedRight = readJson(right, "Right");
  if (!parsedRight.ok) return { ...empty, ok: false, error: parsedRight.error };
  const canonicalLeft = canonicalJson(parsedLeft.value);
  const canonicalRight = canonicalJson(parsedRight.value);
  const changes = diffLines(canonicalLeft, canonicalRight);
  const added = countLines(changes, "add");
  const removed = countLines(changes, "remove");
  return {
    ok: true,
    error: "",
    pieces: changes.map(pieceOf),
    rows: rowsFrom(changes),
    patch: createTwoFilesPatch("original.json", "changed.json", canonicalLeft, canonicalRight),
    added,
    removed,
    unit: "lines",
    unchanged: added === 0 && removed === 0,
  };
}

function changesFor(left: string, right: string, mode: DiffMode, ignoreWhitespace: boolean): Change[] {
  if (mode === "line") return diffLines(left, right, { ignoreWhitespace });
  if (mode === "word") return ignoreWhitespace ? diffWords(left, right) : diffWordsWithSpace(left, right);
  const sourceLeft = ignoreWhitespace ? left.replace(/\s+/g, "") : left;
  const sourceRight = ignoreWhitespace ? right.replace(/\s+/g, "") : right;
  return diffChars(sourceLeft, sourceRight);
}

function pieceOf(change: Change): DiffPiece {
  if (change.added) return { type: "add", value: change.value };
  if (change.removed) return { type: "remove", value: change.value };
  return { type: "same", value: change.value };
}

function rowsFrom(changes: Change[]): DiffRow[] {
  const rows: DiffRow[] = [];
  let leftNumber = 1;
  let rightNumber = 1;
  let index = 0;
  while (index < changes.length) {
    const change = changes[index];
    if (!change) break;
    if (!change.added && !change.removed) {
      for (const line of splitLines(change.value)) {
        rows.push({ kind: "same", left: line, right: line, leftNumber, rightNumber });
        leftNumber += 1;
        rightNumber += 1;
      }
      index += 1;
      continue;
    }
    const removed = change.removed ? splitLines(change.value) : [];
    let added: string[] = [];
    if (change.removed && changes[index + 1]?.added) {
      added = splitLines(changes[index + 1]?.value ?? "");
      index += 2;
    } else if (change.added) {
      added = splitLines(change.value);
      index += 1;
    } else {
      index += 1;
    }
    const count = Math.max(removed.length, added.length);
    for (let row = 0; row < count; row += 1) {
      const leftLine = removed[row];
      const rightLine = added[row];
      const kind = leftLine !== undefined && rightLine !== undefined ? "change" : leftLine !== undefined ? "remove" : "add";
      rows.push({
        kind,
        left: leftLine ?? "",
        right: rightLine ?? "",
        leftNumber: leftLine !== undefined ? leftNumber : null,
        rightNumber: rightLine !== undefined ? rightNumber : null,
      });
      if (leftLine !== undefined) leftNumber += 1;
      if (rightLine !== undefined) rightNumber += 1;
    }
  }
  return rows;
}

function splitLines(value: string): string[] {
  if (value === "") return [];
  const parts = value.split("\n");
  if (parts.at(-1) === "") parts.pop();
  return parts;
}

function countLines(changes: Change[], type: "add" | "remove"): number {
  return changes.filter((change) => (type === "add" ? change.added : change.removed)).reduce((sum, change) => sum + splitLines(change.value).length, 0);
}

function countChars(changes: Change[], type: "add" | "remove"): number {
  return changes.filter((change) => (type === "add" ? change.added : change.removed)).reduce((sum, change) => sum + change.value.length, 0);
}

function canonicalJson(value: unknown): string {
  return `${JSON.stringify(sortKeys(value), null, 2)}\n`;
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === "object") {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))) {
      sorted[key] = sortKeys((value as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  return value;
}

function readJson(text: string, side: string): { ok: true; value: unknown } | { ok: false; error: string } {
  const found: ParseError[] = [];
  parse(text, found, { disallowComments: true, allowTrailingComma: false });
  const error = found[0];
  if (error) {
    const position = positionAt(text, error.offset);
    return { ok: false, error: `${side} side is not valid JSON: ${messageFor(error.error)} at line ${position.line}, column ${position.column}.` };
  }
  try {
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Invalid JSON";
    return { ok: false, error: `${side} side is not valid JSON: ${message}` };
  }
}

function messageFor(code: ParseErrorCode): string {
  switch (printParseErrorCode(code)) {
    case "PropertyNameExpected":
      return "expected a property name";
    case "ValueExpected":
      return "expected a value";
    default:
      return "invalid JSON";
  }
}

function positionAt(text: string, offset: number): { line: number; column: number } {
  const end = Math.max(0, Math.min(offset, text.length));
  let line = 1;
  let column = 1;
  for (let index = 0; index < end; index += 1) {
    if (text.charCodeAt(index) === 10) {
      line += 1;
      column = 1;
    } else {
      column += 1;
    }
  }
  return { line, column };
}
