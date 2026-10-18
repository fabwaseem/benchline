"use client";

import { useState } from "react";
import { Binary } from "lucide-react";
import { ActionButton, ChipButton, Select, TextInput } from "@/components/kit/controls";
import { CopyButton } from "@/components/kit/copy-button";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { KvList } from "@/components/kit/kv-list";
import { Notice } from "@/components/kit/notice";
import { Segmented } from "@/components/kit/segmented";
import { Pane, StatusStrip, ToolCard, ToolPanes } from "@/components/kit/shell";
import { useWorkbenchKeys } from "@/components/kit/tool-shell";
import {
  applyBitwise,
  asciiOf,
  bitAt,
  BIT_WIDTHS,
  evaluateExpression,
  formatBase,
  groupDigits,
  parseBigInt,
  toggleBit,
  toSigned,
  toUnsigned,
  type BitWidth,
  type BitwiseOp,
} from "@/tools/programmer-calculator/lib/programmer";

const OPS: Array<{ value: BitwiseOp; label: string }> = [
  { value: "and", label: "AND" },
  { value: "or", label: "OR" },
  { value: "xor", label: "XOR" },
  { value: "not", label: "NOT" },
  { value: "shl", label: "<< shift" },
  { value: "shr", label: ">> shift" },
];

function useSyncedField(base: 2 | 8 | 10 | 16, value: bigint, bits: BitWidth, setValue: (value: bigint) => void) {
  const [draft, setDraft] = useState<string | null>(null);
  const shown = value < BigInt("0") && base !== 10 ? toUnsigned(value, bits) : value;
  const text = draft ?? groupDigits(formatBase(shown, base), base);
  return {
    text,
    onChange: (next: string) => {
      setDraft(next);
      const parsed = parseBigInt(next.replace(/ /g, ""));
      if (typeof parsed === "bigint") setValue(parsed);
    },
    onBlur: () => setDraft(null),
  };
}

export default function ProgrammerCalculatorTool() {
  const [value, setValue] = useState(BigInt("0"));
  const [bits, setBits] = useState<BitWidth>(32);
  const [expression, setExpression] = useState("");
  const [exprError, setExprError] = useState("");
  const [opA, setOpA] = useState("0xFF");
  const [op, setOp] = useState<BitwiseOp>("and");
  const [opB, setOpB] = useState("0x0F");
  const [opResult, setOpResult] = useState<bigint | null>(null);
  const [opError, setOpError] = useState("");

  const bin = useSyncedField(2, value, bits, setValue);
  const oct = useSyncedField(8, value, bits, setValue);
  const dec = useSyncedField(10, value, bits, setValue);
  const hex = useSyncedField(16, value, bits, setValue);
  const fields = [
    { label: "Binary", ...bin },
    { label: "Octal", ...oct },
    { label: "Decimal", ...dec },
    { label: "Hexadecimal", ...hex },
  ];

  useWorkbenchKeys({
    onCopy: () => {
      void navigator.clipboard.writeText(formatBase(value, 10));
    },
  });

  function runExpression() {
    const result = evaluateExpression(expression);
    if (typeof result !== "bigint") {
      setExprError(result.error);
      return;
    }
    setExprError("");
    setValue(result);
  }

  function runBitwise() {
    const a = parseBigInt(opA);
    if (typeof a !== "bigint") {
      setOpError(a.error);
      return;
    }
    let b = BigInt("0");
    if (op !== "not") {
      const parsed = parseBigInt(opB);
      if (typeof parsed !== "bigint") {
        setOpError(parsed.error);
        return;
      }
      b = parsed;
    }
    setOpError("");
    setOpResult(applyBitwise(op, a, b, bits));
  }

  const ascii = asciiOf(toUnsigned(value, 8));
  const readings = BIT_WIDTHS.map((width) => ({
    name: `${width}-bit`,
    value: toSigned(value, width).toString(),
    hint: `u: ${toUnsigned(value, width).toString()}`,
  }));

  return (
    <ToolCard>
      <ToolPanes>
        <Pane label="Value">
          <FieldRow label="Expression" htmlFor="pc-expr" help="C-like precedence, 0x/0b/0o literals, %, ~, <<, >>.">
            <div className="flex gap-2">
              <TextInput
                id="pc-expr"
                value={expression}
                onChange={(event) => setExpression(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") runExpression();
                }}
                placeholder="0xFF & 0x0F | (1 << 4)"
                spellCheck={false}
                className="font-mono"
              />
              <ActionButton className="btn btn-ink shrink-0" onClick={runExpression}>=</ActionButton>
            </div>
          </FieldRow>
          {exprError ? <Notice tone="bad" role="alert" title={exprError} /> : null}
          {fields.map((field) => (
            <FieldRow key={field.label} label={field.label} htmlFor={`pc-${field.label}`}>
              <div className="flex gap-2">
                <TextInput
                  id={`pc-${field.label}`}
                  value={field.text}
                  onChange={(event) => field.onChange(event.target.value)}
                  onBlur={field.onBlur}
                  spellCheck={false}
                  className="font-mono"
                />
                <CopyButton value={field.text.replace(/ /g, "")} iconOnly label={`Copy ${field.label}`} />
              </div>
            </FieldRow>
          ))}
          <FieldRow label="Bit width">
            <Segmented
              value={String(bits)}
              onChange={(next) => setBits(Number(next) as BitWidth)}
              options={BIT_WIDTHS.map((width) => ({ value: String(width), label: `${width}-bit` }))}
              label="Bit width"
            />
          </FieldRow>
          <FieldRow label="ASCII" help="Shown when the low byte is printable.">
            <div className="font-mono text-[14px]">{ascii ?? "—"}</div>
          </FieldRow>
        </Pane>
        <Pane label="Bits & bitwise">
          <div>
            <div className="mb-1 font-mono text-[11px] tracking-[0.08em] text-faint uppercase">Signed / unsigned per width</div>
            <KvList items={readings} />
          </div>
          <FieldRow label="Bit grid" help={`Click a bit to flip it (${bits}-bit view).`}>
            <div className="flex flex-wrap gap-1">
              {Array.from({ length: bits }, (_, position) => bits - 1 - position).map((index) => {
                const on = bitAt(value, index) === 1;
                return (
                  <ChipButton
                    key={index}
                    pressed={on}
                    onClick={() => setValue(toggleBit(value, index, bits))}
                    aria-label={`Bit ${index} ${on ? "on" : "off"}`}
                    title={`Bit ${index}`}
                    className={`h-7 w-7 p-0 font-mono text-[11px]${index % 8 === 0 && index !== 0 ? " ml-2" : ""}`}
                  >
                    {on ? "1" : "0"}
                  </ChipButton>
                );
              })}
            </div>
          </FieldRow>
          <FieldRow label="Bitwise operation">
            <div className="flex flex-wrap items-center gap-2">
              <TextInput value={opA} onChange={(event) => setOpA(event.target.value)} spellCheck={false} className="w-28 font-mono" aria-label="Operand A" />
              <Select value={op} onChange={(event) => setOp(event.target.value as BitwiseOp)} aria-label="Operation" className="w-28">
                {OPS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </Select>
              {op === "not" ? null : (
                <TextInput value={opB} onChange={(event) => setOpB(event.target.value)} spellCheck={false} className="w-28 font-mono" aria-label="Operand B" />
              )}
              <ActionButton className="btn btn-ink" onClick={runBitwise}>=</ActionButton>
            </div>
          </FieldRow>
          {opError ? <Notice tone="bad" role="alert" title={opError} /> : null}
          {opResult === null && !opError ? (
            <EmptyState art={<Binary size={22} />} title="No operation yet" hint="Enter two operands and pick an operation." />
          ) : opResult !== null ? (
            <Notice
              tone="ok"
              title={`0x${formatBase(opResult, 16)}`}
              body={`${formatBase(opResult, 10)} · 0b${formatBase(opResult, 2)} · 0o${formatBase(opResult, 8)}`}
            />
          ) : null}
          {opResult !== null ? (
            <ChipButton onClick={() => setValue(opResult)}>Use as value</ChipButton>
          ) : null}
        </Pane>
      </ToolPanes>
      <StatusStrip note={`Decimal ${formatBase(value, 10)} · ${bits}-bit`} tone="pass" />
    </ToolCard>
  );
}
