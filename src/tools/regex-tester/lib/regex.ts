import regexpTree from "regexp-tree";

export const flagList = ["g", "i", "m", "s", "u", "v", "d"] as const;
export type Flag = (typeof flagList)[number];

const allowed = new Set<string>(flagList);

export type RegexGroup = {
  name: string;
  value: string;
};

export type RegexMatch = {
  index: number;
  length: number;
  value: string;
  groups: RegexGroup[];
};

export type RegexSpan = {
  text: string;
  match: boolean;
};

export type RegexResult = {
  valid: true;
  matches: RegexMatch[];
  truncated: boolean;
  explanation: string[];
  replacement: string | null;
  replaceError: string;
};

export type RegexFailure = {
  valid: false;
  error: string;
};

const maxPattern = 1000;
const maxText = 50_000;
const maxMatches = 500;

type Ast = {
  type: string;
  value?: string;
  kind?: string;
  greedy?: boolean;
  negative?: boolean;
  capturing?: boolean;
  name?: string;
  number?: number;
  from?: number;
  to?: number;
  expression?: Ast;
  expressions?: Ast[];
  left?: Ast;
  right?: Ast;
  quantifier?: Ast;
  assertion?: Ast;
  body?: Ast;
};

export function testRegex(pattern: string, flags: string, text: string, replacement?: string): RegexResult | RegexFailure {
  if (pattern.length === 0) return { valid: false, error: "Enter a pattern." };
  if (pattern.length > maxPattern) return { valid: false, error: `Use a pattern of ${maxPattern} characters or fewer.` };
  if (text.length > maxText) return { valid: false, error: `Use a sample of ${maxText.toLocaleString("en-US")} characters or fewer.` };
  const flagError = checkFlags(flags);
  if (flagError) return { valid: false, error: flagError };
  let expression: RegExp;
  try {
    expression = new RegExp(pattern, flags);
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : "That pattern is not valid." };
  }
  const found = findAll(pattern, flags, text);
  let next: string | null = null;
  let replaceError = "";
  if (replacement !== undefined) {
    try {
      const replaceFlags = flags.includes("g") ? flags : `${flags}g`;
      next = text.replace(new RegExp(pattern, replaceFlags), replacement);
    } catch (error) {
      replaceError = error instanceof Error ? error.message : "The replacement failed.";
    }
  }
  return {
    valid: true,
    matches: found.matches,
    truncated: found.truncated,
    explanation: explainPattern(expression),
    replacement: next,
    replaceError,
  };
}

export function highlightSpans(text: string, matches: RegexMatch[]): RegexSpan[] {
  const spans: RegexSpan[] = [];
  let cursor = 0;
  for (const match of matches) {
    if (match.index < cursor) continue;
    if (match.index > cursor) spans.push({ text: text.slice(cursor, match.index), match: false });
    spans.push({ text: text.slice(match.index, match.index + match.length), match: true });
    cursor = match.index + match.length;
  }
  if (cursor < text.length) spans.push({ text: text.slice(cursor), match: false });
  if (spans.length === 0) spans.push({ text, match: false });
  return spans;
}

function checkFlags(flags: string) {
  const seen = new Set<string>();
  for (const flag of flags) {
    if (!allowed.has(flag)) return `Unknown flag ${flag}. Use g, i, m, s, u, v, or d.`;
    if (seen.has(flag)) return `Flag ${flag} is repeated.`;
    seen.add(flag);
  }
  if (seen.has("u") && seen.has("v")) return "Use either the u flag or the v flag.";
  return "";
}

function findAll(pattern: string, flags: string, text: string) {
  const search = new Set(flags);
  search.add("d");
  search.add("g");
  search.delete("y");
  const expression = new RegExp(pattern, [...search].join(""));
  const matches: RegexMatch[] = [];
  let truncated = false;
  let guard = 0;
  while (guard < maxMatches + 1) {
    const match = expression.exec(text);
    if (!match) break;
    if (matches.length === maxMatches) {
      truncated = true;
      break;
    }
    const groups: RegexGroup[] = [];
    for (let index = 1; index < match.length; index += 1) {
      groups.push({ name: String(index), value: match[index] ?? "" });
    }
    if (match.groups) {
      for (const [name, value] of Object.entries(match.groups)) groups.push({ name, value: value ?? "" });
    }
    matches.push({ index: match.index, length: match[0].length, value: match[0], groups });
    if (match[0].length === 0) expression.lastIndex += 1;
    guard += 1;
  }
  return { matches, truncated };
}

function explainPattern(expression: RegExp) {
  try {
    const ast = regexpTree.parse(expression) as Ast;
    const lines = explainNode(ast.body ?? ast);
    return lines.length > 0 ? lines : ["Empty pattern."];
  } catch {
    return ["This pattern is valid JavaScript. The explainer does not cover every flag or escape."];
  }
}

function explainNode(node: Ast | undefined): string[] {
  if (!node) return [];
  switch (node.type) {
    case "RegExp":
      return explainNode(node.body);
    case "Alternative":
      return (node.expressions ?? []).flatMap((item) => explainNode(item));
    case "Disjunction":
      return ["Either of", ...indent(explainNode(node.left)), "or", ...indent(explainNode(node.right))];
    case "Repetition":
      return [`${quantifierLabel(node.quantifier)}:`, ...indent(explainNode(node.expression))];
    case "Group": {
      const title = node.capturing === false
        ? "Non-capturing group"
        : node.name
          ? `Named group ${node.name}`
          : `Capture group ${node.number ?? ""}`.trim();
      return [title, ...indent(explainNode(node.expression))];
    }
    case "CharacterClass":
      return [`${node.negative ? "Any character outside" : "Any character in"} a set`];
    case "ClassRange":
      return ["A range inside a set"];
    case "Assertion":
      return [assertionLabel(node)];
    case "Backreference":
      return [`Backreference to group ${node.name ?? node.number ?? node.value ?? ""}`.trim()];
    case "UnicodeProperty":
      return [`Unicode property ${node.value ?? node.name ?? ""}`.trim()];
    case "Char":
      return [charLabel(node)];
    default:
      return [node.type];
  }
}

function quantifierLabel(node: Ast | undefined) {
  if (!node) return "Repeated";
  const lazy = node.greedy === false ? ", lazy" : "";
  if (node.kind === "*") return `Zero or more${lazy}`;
  if (node.kind === "+") return `One or more${lazy}`;
  if (node.kind === "?") return `Optional${lazy}`;
  if (node.kind === "Range") {
    const from = node.from ?? 0;
    const to = node.to;
    if (to === undefined) return `${from} or more${lazy}`;
    if (from === to) return `Exactly ${from}${lazy}`;
    return `Between ${from} and ${to}${lazy}`;
  }
  return `Repeated${lazy}`;
}

function assertionLabel(node: Ast) {
  if (node.kind === "^") return "Start of the string, or of a line when m is set";
  if (node.kind === "$") return "End of the string, or of a line when m is set";
  if (node.kind === "\\b") return "Word boundary";
  if (node.kind === "\\B") return "Not a word boundary";
  if (node.kind === "Lookahead") return `Lookahead: ${explainNode(node.assertion).join(" ")}`;
  if (node.kind === "Lookbehind") return `Lookbehind: ${explainNode(node.assertion).join(" ")}`;
  return "Assertion";
}

function charLabel(node: Ast) {
  const value = node.value ?? "";
  if (node.kind === "meta") {
    const names: Record<string, string> = {
      ".": "Any character except a line break, unless s is set",
      "\\d": "A digit",
      "\\D": "Not a digit",
      "\\w": "A word character",
      "\\W": "Not a word character",
      "\\s": "Whitespace",
      "\\S": "Not whitespace",
      "\\n": "A line break",
      "\\t": "A tab",
    };
    return names[value] ?? `Metacharacter ${value}`;
  }
  if (value === " ") return "A space";
  return `The character ${JSON.stringify(value)}`;
}

function indent(lines: string[]) {
  return lines.map((line) => `  ${line}`);
}

export const examplePattern = String.raw`(?<word>[A-Za-z]+)\s+(\d+)`;
export const exampleText = "Order A12\nOrder Beta 7 and Gamma 42";
