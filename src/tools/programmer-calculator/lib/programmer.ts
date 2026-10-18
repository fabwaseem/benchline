// Pure programmer-calculator logic over BigInt. All parsing and formatting
// is exact for 64-bit values; no floating point is involved.

export const BIT_WIDTHS = [8, 16, 32, 64] as const;
export type BitWidth = (typeof BIT_WIDTHS)[number];

export const BASES = [
  { base: 2, name: "Binary", prefix: "0b" },
  { base: 8, name: "Octal", prefix: "0o" },
  { base: 10, name: "Decimal", prefix: "" },
  { base: 16, name: "Hexadecimal", prefix: "0x" },
] as const;

export type BitwiseOp = "and" | "or" | "xor" | "not" | "shl" | "shr";

const DIGITS = "0123456789abcdefghijklmnopqrstuvwxyz";

function mask(bits: number): bigint {
  return (BigInt("1") << BigInt(bits)) - BigInt("1");
}

export function parseBigInt(text: string): bigint | { error: string } {
  const clean = text.trim().toLowerCase().replace(/_/g, "");
  if (!clean) return { error: "Enter a number." };
  const negative = clean.startsWith("-");
  const body = negative ? clean.slice(1) : clean;
  let base = 10;
  let digits = body;
  if (body.startsWith("0x")) {
    base = 16;
    digits = body.slice(2);
  } else if (body.startsWith("0b")) {
    base = 2;
    digits = body.slice(2);
  } else if (body.startsWith("0o")) {
    base = 8;
    digits = body.slice(2);
  }
  if (!digits) return { error: "The number has no digits." };
  const alphabet = DIGITS.slice(0, base);
  for (const char of digits) {
    if (!alphabet.includes(char)) return { error: `"${char}" is not a base-${base} digit.` };
  }
  let value = BigInt("0");
  for (const char of digits) value = value * BigInt(base) + BigInt(alphabet.indexOf(char));
  return negative ? -value : value;
}

export function formatBase(value: bigint, base: 2 | 8 | 10 | 16): string {
  if (value === BigInt("0")) return "0";
  const negative = value < BigInt("0");
  const abs = negative ? -value : value;
  const out = abs.toString(base);
  return negative ? `-${out}` : out;
}

/** Groups digits for readability: 4 for binary/hex, 3 for octal. */
export function groupDigits(text: string, base: 2 | 8 | 10 | 16): string {
  const negative = text.startsWith("-");
  const body = negative ? text.slice(1) : text;
  const size = base === 8 ? 3 : 4;
  if (body.length <= size) return text;
  const groups: string[] = [];
  for (let index = body.length; index > 0; index -= size) {
    groups.unshift(body.slice(Math.max(0, index - size), index));
  }
  return `${negative ? "-" : ""}${groups.join(" ")}`;
}

export function toUnsigned(value: bigint, bits: BitWidth): bigint {
  return value & mask(bits);
}

export function toSigned(value: bigint, bits: BitWidth): bigint {
  const unsigned = toUnsigned(value, bits);
  const sign = BigInt("1") << BigInt(bits - 1);
  return unsigned & sign ? unsigned - (BigInt("1") << BigInt(bits)) : unsigned;
}

export function bitAt(value: bigint, index: number): 0 | 1 {
  return ((toUnsigned(value, 64) >> BigInt(index)) & BigInt("1")) === BigInt("1") ? 1 : 0;
}

export function toggleBit(value: bigint, index: number, bits: BitWidth = 64): bigint {
  return toUnsigned(value ^ (BigInt("1") << BigInt(index)), bits);
}

export function asciiOf(value: bigint): string | null {
  if (value < BigInt("0") || value > BigInt("127")) return null;
  const code = Number(value);
  if (code < 32 || code === 127) return null;
  return String.fromCharCode(code);
}

export function applyBitwise(op: BitwiseOp, a: bigint, b: bigint, bits: BitWidth = 64): bigint {
  const m = mask(bits);
  switch (op) {
    case "and":
      return a & b & m;
    case "or":
      return (a | b) & m;
    case "xor":
      return (a ^ b) & m;
    case "not":
      return ~a & m;
    case "shl":
      return (a << b) & m;
    case "shr":
      return (a & m) >> b;
  }
}

type Token =
  | { kind: "num"; value: bigint }
  | { kind: "op"; op: string }
  | { kind: "lparen" }
  | { kind: "rparen" };

const PRECEDENCE: Record<string, number> = {
  "|": 1,
  "^": 2,
  "&": 3,
  "<<": 4,
  ">>": 4,
  "+": 5,
  "-": 5,
  "*": 6,
  "/": 6,
  "%": 6,
};

function tokenize(expression: string): Token[] | { error: string } {
  const tokens: Token[] = [];
  let index = 0;
  const text = expression.trim();
  while (index < text.length) {
    const char = text[index] ?? "";
    if (char === " " || char === "\t") {
      index += 1;
      continue;
    }
    if (char === "(") {
      tokens.push({ kind: "lparen" });
      index += 1;
      continue;
    }
    if (char === ")") {
      tokens.push({ kind: "rparen" });
      index += 1;
      continue;
    }
    const two = text.slice(index, index + 2);
    if (two === "<<" || two === ">>") {
      tokens.push({ kind: "op", op: two });
      index += 2;
      continue;
    }
    if ("+-*/%&|^~".includes(char)) {
      tokens.push({ kind: "op", op: char });
      index += 1;
      continue;
    }
    const rest = text.slice(index);
    const match = /^(?:0[xX][0-9a-fA-F_]+|0[bB][01_]+|0[oO][0-7_]+|\d[\d_]*)/.exec(rest);
    if (!match) return { error: `Unexpected character "${char}" at position ${index + 1}.` };
    const parsed = parseBigInt(match[0]);
    if (typeof parsed !== "bigint") return parsed;
    tokens.push({ kind: "num", value: parsed });
    index += match[0].length;
  }
  return tokens;
}

/** Evaluates an integer expression with C-like precedence. Division truncates toward zero. */
export function evaluateExpression(expression: string): bigint | { error: string } {
  const tokens = tokenize(expression);
  if ("error" in tokens) return tokens;
  if (tokens.length === 0) return { error: "Enter an expression." };
  const output: Token[] = [];
  const ops: Token[] = [];
  let expectOperand = true;

  const applyTop = (): { error: string } | null => {
    const top = ops.pop();
    if (!top || top.kind !== "op") return { error: "Mismatched parentheses." };
    output.push(top);
    return null;
  };

  for (const token of tokens) {
    if (token.kind === "num") {
      output.push(token);
      expectOperand = false;
      continue;
    }
    if (token.kind === "lparen") {
      ops.push(token);
      expectOperand = true;
      continue;
    }
    if (token.kind === "rparen") {
      let found = false;
      while (ops.length > 0) {
        const top = ops[ops.length - 1];
        if (top?.kind === "lparen") {
          ops.pop();
          found = true;
          break;
        }
        const failed = applyTop();
        if (failed) return failed;
      }
      if (!found) return { error: "Mismatched parentheses." };
      expectOperand = false;
      continue;
    }
    let op = token.op;
    if (expectOperand && (op === "-" || op === "+" || op === "~")) {
      op = `u${op}`;
      ops.push({ kind: "op", op });
      continue;
    }
    if (expectOperand) return { error: `Unexpected operator "${token.op}".` };
    const precedence = PRECEDENCE[op] ?? 0;
    while (ops.length > 0) {
      const top = ops[ops.length - 1];
      if (top?.kind !== "op") break;
      if (top.op.startsWith("u")) {
        // Unary operators bind tighter than any binary operator.
        const failed = applyTop();
        if (failed) return failed;
        continue;
      }
      if ((PRECEDENCE[top.op] ?? 0) < precedence) break;
      const failed = applyTop();
      if (failed) return failed;
    }
    ops.push(token);
    expectOperand = true;
  }
  while (ops.length > 0) {
    const top = ops[ops.length - 1];
    if (top?.kind === "lparen") return { error: "Mismatched parentheses." };
    const failed = applyTop();
    if (failed) return failed;
  }

  const stack: bigint[] = [];
  for (const token of output) {
    if (token.kind === "num") {
      stack.push(token.value);
      continue;
    }
    if (token.kind !== "op") return { error: "Invalid expression." };
    if (token.op === "u-") {
      const value = stack.pop();
      if (value === undefined) return { error: "Invalid expression." };
      stack.push(-value);
      continue;
    }
    if (token.op === "u+" || token.op === "u~") {
      const value = stack.pop();
      if (value === undefined) return { error: "Invalid expression." };
      stack.push(token.op === "u~" ? ~value : value);
      continue;
    }
    const right = stack.pop();
    const left = stack.pop();
    if (left === undefined || right === undefined) return { error: "Invalid expression." };
    switch (token.op) {
      case "+":
        stack.push(left + right);
        break;
      case "-":
        stack.push(left - right);
        break;
      case "*":
        stack.push(left * right);
        break;
      case "/":
        if (right === BigInt("0")) return { error: "Division by zero." };
        stack.push(left / right);
        break;
      case "%":
        if (right === BigInt("0")) return { error: "Division by zero." };
        stack.push(left % right);
        break;
      case "&":
        stack.push(left & right);
        break;
      case "|":
        stack.push(left | right);
        break;
      case "^":
        stack.push(left ^ right);
        break;
      case "<<":
        if (right < BigInt("0")) return { error: "Negative shift." };
        stack.push(left << right);
        break;
      case ">>":
        if (right < BigInt("0")) return { error: "Negative shift." };
        stack.push(left >> right);
        break;
      default:
        return { error: `Unknown operator "${token.op}".` };
    }
  }
  if (stack.length !== 1 || stack[0] === undefined) return { error: "Invalid expression." };
  return stack[0];
}
