import {
  camelCase,
  capitalCase,
  constantCase,
  dotCase,
  kebabCase,
  pascalCase,
  pathCase,
  sentenceCase,
  snakeCase,
  trainCase,
} from "change-case";

export const caseStyles = [
  "lower",
  "upper",
  "sentence",
  "capital",
  "title-ap",
  "title-chicago",
  "camel",
  "pascal",
  "snake",
  "constant",
  "kebab",
  "dot",
  "path",
  "train",
  "alternating",
  "inverse",
] as const;

export type CaseStyle = (typeof caseStyles)[number];

export const caseLabels: Record<CaseStyle, string> = {
  lower: "lower case",
  upper: "UPPER CASE",
  sentence: "Sentence case",
  capital: "Capital Case",
  "title-ap": "Title case (AP)",
  "title-chicago": "Title case (Chicago)",
  camel: "camelCase",
  pascal: "PascalCase",
  snake: "snake_case",
  constant: "CONSTANT_CASE",
  kebab: "kebab-case",
  dot: "dot.case",
  path: "path/case",
  train: "Train-Case",
  alternating: "aLtErNaTiNg",
  inverse: "iNVERSE",
};

const apSmall = new Set(["a", "an", "the", "and", "but", "or", "nor", "for", "so", "yet", "as", "at", "by", "in", "of", "off", "on", "per", "to", "up", "via", "vs"]);

const chicagoSmall = new Set([
  ...apSmall,
  "from",
  "into",
  "onto",
  "over",
  "upon",
  "with",
  "down",
  "near",
  "past",
  "than",
  "out",
]);

export function convertCase(text: string, style: CaseStyle): string {
  if (style === "lower") return text.toLocaleLowerCase("en-US");
  if (style === "upper") return text.toLocaleUpperCase("en-US");
  if (style === "inverse") return inverse(text);
  if (style === "alternating") return alternating(text);
  if (style === "title-ap") return titleCase(text, apSmall);
  if (style === "title-chicago") return titleCase(text, chicagoSmall);
  const transform = transforms[style];
  return mapLines(text, (line) => transform(line));
}

export function convertAllCases(text: string): { style: CaseStyle; label: string; text: string }[] {
  return caseStyles.map((style) => ({ style, label: caseLabels[style], text: convertCase(text, style) }));
}

const transforms: Record<Exclude<CaseStyle, "lower" | "upper" | "inverse" | "alternating" | "title-ap" | "title-chicago">, (value: string) => string> = {
  sentence: (value) => sentenceCase(value),
  capital: (value) => capitalCase(value),
  camel: (value) => camelCase(value),
  pascal: (value) => pascalCase(value),
  snake: (value) => snakeCase(value),
  constant: (value) => constantCase(value),
  kebab: (value) => kebabCase(value),
  dot: (value) => dotCase(value),
  path: (value) => pathCase(value),
  train: (value) => trainCase(value),
};

function mapLines(text: string, transform: (line: string) => string) {
  return text.split("\n").map((line) => (line.trim() === "" ? line : transform(line))).join("\n");
}

function titleCase(text: string, small: Set<string>) {
  return text.split("\n").map((line) => titleLine(line, small)).join("\n");
}

function titleLine(line: string, small: Set<string>) {
  const parts = line.split(/(\s+)/);
  const content = parts.map((part, index) => (/\S/.test(part) ? index : -1)).filter((index) => index >= 0);
  return parts.map((part, index) => {
    if (!/\S/.test(part)) return part;
    const edge = index === content[0] || index === content[content.length - 1];
    return styleToken(part, small, edge);
  }).join("");
}

function styleToken(token: string, small: Set<string>, edge: boolean) {
  const match = /^([^A-Za-z0-9]*)(.*?)([^A-Za-z0-9]*)$/u.exec(token);
  if (!match) return token;
  const lead = match[1] ?? "";
  const core = match[2] ?? "";
  const tail = match[3] ?? "";
  if (!core) return token;
  const pieces = core.split("-");
  const styled = pieces.map((piece, index) => {
    const lower = piece.toLocaleLowerCase("en-US");
    const force = edge && index === 0;
    if (!force && small.has(lower)) return lower;
    return capitalize(lower);
  }).join("-");
  return `${lead}${styled}${tail}`;
}

function capitalize(word: string) {
  if (!word) return word;
  return word.charAt(0).toLocaleUpperCase("en-US") + word.slice(1);
}

function alternating(text: string) {
  let letters = 0;
  return Array.from(text).map((character) => {
    if (!/\p{L}/u.test(character)) return character;
    const next = letters % 2 === 0 ? character.toLocaleUpperCase("en-US") : character.toLocaleLowerCase("en-US");
    letters += 1;
    return next;
  }).join("");
}

function inverse(text: string) {
  return Array.from(text).map((character) => {
    const upper = character.toLocaleUpperCase("en-US");
    const lower = character.toLocaleLowerCase("en-US");
    if (character === lower && character !== upper) return upper;
    if (character === upper && character !== lower) return lower;
    return character;
  }).join("");
}

export const exampleText = "the old man and the sea";
