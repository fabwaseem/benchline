import { z } from "zod";
import {
  applyBitwise,
  BIT_WIDTHS,
  evaluateExpression,
  formatBase,
  parseBigInt,
  toSigned,
  toUnsigned,
  type BitwiseOp,
  type BitWidth,
} from "@/tools/programmer-calculator/lib/programmer";
import type { BenchTool } from "@/lib/mcp/types";

export const inputSchema = z.object({
  expression: z.string().optional().describe("Integer expression, e.g. '0xFF & 0x0F | (1 << 4)'"),
  op: z.enum(["and", "or", "xor", "not", "shl", "shr"]).optional().describe("Bitwise operation (alternative to expression)"),
  a: z.string().optional().describe("First operand, e.g. '0xFF' or '255'"),
  b: z.string().optional().describe("Second operand (not needed for 'not')"),
  bits: z.enum(["8", "16", "32", "64"]).default("64").describe("Bit width for masking and signed interpretation"),
});

export const outputSchema = z.object({
  decimal: z.string(),
  hex: z.string(),
  octal: z.string(),
  binary: z.string(),
  unsigned: z.string(),
  signed: z.string(),
  bits: z.number().int(),
});

function shape(value: bigint, bits: BitWidth) {
  return outputSchema.parse({
    decimal: formatBase(value, 10),
    hex: `0x${formatBase(value < BigInt("0") ? toUnsigned(value, bits) : value, 16)}`,
    octal: `0o${formatBase(value < BigInt("0") ? toUnsigned(value, bits) : value, 8)}`,
    binary: `0b${formatBase(value < BigInt("0") ? toUnsigned(value, bits) : value, 2)}`,
    unsigned: toUnsigned(value, bits).toString(),
    signed: toSigned(value, bits).toString(),
    bits,
  });
}

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  const bits = Number(parsed.bits) as BitWidth;
  if (!BIT_WIDTHS.includes(bits)) throw new Error("bits must be 8, 16, 32, or 64.");
  if (parsed.expression) {
    const value = evaluateExpression(parsed.expression);
    if (typeof value !== "bigint") throw new Error(value.error);
    return shape(value, bits);
  }
  if (!parsed.op || !parsed.a) {
    throw new Error("Provide an expression, or an op with operand a (and b unless op is 'not').");
  }
  const a = parseBigInt(parsed.a);
  if (typeof a !== "bigint") throw new Error(a.error);
  let b = BigInt("0");
  if (parsed.op !== "not") {
    if (!parsed.b) throw new Error(`The '${parsed.op}' operation needs operand b.`);
    const parsedB = parseBigInt(parsed.b);
    if (typeof parsedB !== "bigint") throw new Error(parsedB.error);
    b = parsedB;
  }
  return shape(applyBitwise(parsed.op as BitwiseOp, a, b, bits), bits);
}

export const tool: BenchTool = {
  slug: "programmer-calculator",
  name: "calculate_programmer",
  title: "Evaluate a programmer expression",
  description: "Evaluate integer expressions with C-like precedence (hex/octal/binary literals, bitwise ops, shifts) and report base conversions plus signed/unsigned interpretations.",
  openWorld: false,
  inputSchema,
  outputSchema,
  run,
};
