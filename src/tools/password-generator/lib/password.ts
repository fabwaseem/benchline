import { EFF_SHORT_WORDS } from "@/tools/password-generator/lib/words";

export const PASSWORD_MIN = 4;
export const PASSWORD_MAX = 128;
export const PASSWORD_COUNT_MAX = 100;
export const PASSPHRASE_MIN = 3;
export const PASSPHRASE_MAX = 12;

const LOWER = "abcdefghijklmnopqrstuvwxyz";
const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DIGITS = "0123456789";
const SYMBOLS = "!@#$%^&*()-_=+[]{};:,.?/";
const AMBIGUOUS = new Set(["0", "O", "o", "1", "l", "I"]);

export type PasswordOptions = {
  length: number;
  lowercase: boolean;
  uppercase: boolean;
  digits: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean;
};

export type PassphraseOptions = {
  words: number;
  separator: string;
  capitalize: boolean;
  digit: boolean;
};

export type Strength = {
  bits: number;
  label: "Weak" | "Fair" | "Good" | "Strong";
  score: number;
};

export type RandomUint32 = () => number;

export function cryptoUint32(): number {
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  return buffer[0] ?? 0;
}

export function generatePasswords(options: PasswordOptions, count: number, next: RandomUint32 = cryptoUint32): string[] | { error: string } {
  const countError = checkCount(count);
  if (countError) return { error: countError };
  const passwords: string[] = [];
  for (let index = 0; index < count; index += 1) {
    const password = generatePassword(options, next);
    if (typeof password !== "string") return password;
    passwords.push(password);
  }
  return passwords;
}

export function generatePassword(options: PasswordOptions, next: RandomUint32 = cryptoUint32): string | { error: string } {
  if (!Number.isInteger(options.length) || options.length < PASSWORD_MIN || options.length > PASSWORD_MAX) {
    return { error: `Length must be from ${PASSWORD_MIN} to ${PASSWORD_MAX}.` };
  }
  const groups = characterGroups(options);
  if (groups.length === 0) return { error: "Pick at least one character set." };
  if (options.length < groups.length) return { error: "Length is shorter than the number of character sets." };
  const alphabet = groups.join("");
  const chars: string[] = groups.map((group) => group[randomIndex(group.length, next)] ?? "");
  while (chars.length < options.length) chars.push(alphabet[randomIndex(alphabet.length, next)] ?? "");
  for (let index = chars.length - 1; index > 0; index -= 1) {
    const swap = randomIndex(index + 1, next);
    const current = chars[index] ?? "";
    chars[index] = chars[swap] ?? "";
    chars[swap] = current;
  }
  return chars.join("");
}

export function generatePassphrases(options: PassphraseOptions, count: number, next: RandomUint32 = cryptoUint32): { phrases: string[]; strength: Strength } | { error: string } {
  const countError = checkCount(count);
  if (countError) return { error: countError };
  if (!Number.isInteger(options.words) || options.words < PASSPHRASE_MIN || options.words > PASSPHRASE_MAX) {
    return { error: `Use ${PASSPHRASE_MIN} to ${PASSPHRASE_MAX} words.` };
  }
  const phrases: string[] = [];
  for (let index = 0; index < count; index += 1) phrases.push(onePassphrase(options, next));
  return { phrases, strength: passphraseStrength(options) };
}

export function passwordStrength(options: PasswordOptions): Strength | { error: string } {
  const groups = characterGroups(options);
  if (groups.length === 0) return { error: "Pick at least one character set." };
  const size = new Set(groups.join("")).size;
  return strengthFromBits(options.length * Math.log2(size));
}

export function passphraseStrength(options: PassphraseOptions): Strength {
  const wordBits = options.words * Math.log2(EFF_SHORT_WORDS.length);
  const digitBits = options.digit ? Math.log2(10) : 0;
  return strengthFromBits(wordBits + digitBits);
}

export function strengthFromBits(bits: number): Strength {
  const rounded = Math.round(bits * 10) / 10;
  const score = Math.max(0, Math.min(100, Math.round((bits / 80) * 100)));
  const label = bits < 28 ? "Weak" : bits < 45 ? "Fair" : bits < 64 ? "Good" : "Strong";
  return { bits: rounded, label, score };
}

export function characterGroups(options: PasswordOptions) {
  const filter = (chars: string) => (options.excludeAmbiguous ? [...chars].filter((char) => !AMBIGUOUS.has(char)).join("") : chars);
  return [options.lowercase ? filter(LOWER) : "", options.uppercase ? filter(UPPER) : "", options.digits ? filter(DIGITS) : "", options.symbols ? filter(SYMBOLS) : ""].filter((group) => group.length > 0);
}

function onePassphrase(options: PassphraseOptions, next: RandomUint32) {
  const words = Array.from({ length: options.words }, () => {
    const word = EFF_SHORT_WORDS[randomIndex(EFF_SHORT_WORDS.length, next)] ?? "word";
    return options.capitalize ? `${word.slice(0, 1).toUpperCase()}${word.slice(1)}` : word;
  });
  const phrase = words.join(options.separator);
  if (!options.digit) return phrase;
  return `${phrase}${options.separator}${randomIndex(10, next)}`;
}

function randomIndex(size: number, next: RandomUint32) {
  if (size <= 1) return 0;
  const limit = Math.floor(0x1_0000_0000 / size) * size;
  let value = next() >>> 0;
  while (value >= limit) value = next() >>> 0;
  return value % size;
}

function checkCount(count: number) {
  if (!Number.isInteger(count) || count < 1 || count > PASSWORD_COUNT_MAX) return `Count must be from 1 to ${PASSWORD_COUNT_MAX}.`;
  return "";
}
