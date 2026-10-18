import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "programmer-calculator",
  name: "Programmer calculator",
  tagline: "Base conversions, bitwise ops, and a clickable bit grid.",
  description:
    "Free programmer calculator. Convert between binary, octal, decimal, and hexadecimal with live sync, evaluate expressions with C-like precedence, run bitwise AND, OR, XOR, NOT and shifts, toggle individual bits, and read signed and unsigned 8/16/32/64-bit interpretations plus the ASCII character.",
  category: "encoding",
  tags: ["calculator", "binary", "hex", "bitwise"],
  keywords: ["programmer calculator", "hex to decimal", "binary calculator", "bitwise calculator", "base converter"],
  status: "new",
  createdAt: "2026-10-18",
  updatedAt: "2026-10-18",
  icon: "Calculator",
  related: ["base64-codec", "unit-converter", "chmod-calculator", "hash-generator"],
  faqs: [
    { q: "Which number formats can I type?", a: "0x for hexadecimal, 0b for binary, 0o for octal, and plain decimal. Underscores are allowed as separators, like 0xFF_FF." },
    { q: "How do expressions work?", a: "Type something like 0xFF & 0x0F | (1 << 4). Operators follow C precedence: shifts, then &, then ^, then |. ~, unary minus, parentheses, and % all work. Division truncates toward zero." },
    { q: "What does the bit width change?", a: "NOT, shifts, and the signed/unsigned readings are masked to the selected width, so 8-bit ~0 is 255 and reads as -1 signed." },
    { q: "Is the math exact?", a: "Yes. Everything is BigInt, so all 64 bits are exact. There is no floating point anywhere." },
  ],
  seo: {
    title: "Programmer calculator",
    description: "Convert bin/oct/dec/hex, evaluate bitwise expressions, toggle bits, and read signed/unsigned values. Exact 64-bit math in the browser.",
  },
  howTo: [
    { name: "Enter a value", text: "Type an expression or edit any base field; the other three bases update instantly." },
    { name: "Pick a width", text: "Choose 8, 16, 32, or 64 bits to see the signed and unsigned interpretations." },
    { name: "Toggle bits", text: "Click bits in the grid to flip them, or run a bitwise operation on two operands." },
  ],
  inputs: "An integer expression or a base-prefixed literal, a bit width, and optional bitwise operands.",
  outputs: "Binary, octal, decimal, and hex forms, signed/unsigned readings per width, ASCII, and the bit grid.",
  runsLocally: true,
  badges: ["BigInt · exact"],
} satisfies ToolMeta;
