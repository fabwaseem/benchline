export type Triad = { read: boolean; write: boolean; execute: boolean };

export type Mode = {
  owner: Triad;
  group: Triad;
  other: Triad;
  setuid: boolean;
  setgid: boolean;
  sticky: boolean;
};

export type ModeView = {
  octal: string;
  symbolic: string;
  command: string;
  mode: Mode;
};

export type ChmodError = { error: string };

export function blankMode(): Mode {
  return {
    owner: { read: true, write: true, execute: true },
    group: { read: true, write: false, execute: true },
    other: { read: true, write: false, execute: true },
    setuid: false,
    setgid: false,
    sticky: false,
  };
}

export function formatMode(mode: Mode, path = "file"): ModeView {
  const special = (mode.setuid ? 4 : 0) + (mode.setgid ? 2 : 0) + (mode.sticky ? 1 : 0);
  const octal = `${special || ""}${triadValue(mode.owner)}${triadValue(mode.group)}${triadValue(mode.other)}`;
  const safePath = path.trim() || "file";
  return { octal, symbolic: symbolic(mode), command: `chmod ${octal} ${safePath}`, mode };
}

export function parseMode(input: string, path = "file"): ModeView | ChmodError {
  const raw = input.trim();
  if (!raw) return { error: "Enter an octal mode such as 755, or a symbolic mode such as rwxr-xr-x." };
  if (/^[0-9]+$/.test(raw)) {
    if (!/^[0-7]{3,4}$/.test(raw)) return { error: "Octal mode is 3 or 4 digits from 0 to 7." };
    return formatMode(modeFromOctal(raw), path);
  }
  const symbolicMode = modeFromSymbolic(raw);
  if ("error" in symbolicMode) return symbolicMode;
  return formatMode(symbolicMode, path);
}

export function modeFromOctal(raw: string): Mode {
  const digits = raw.padStart(4, "0");
  const special = Number(digits[0]);
  return {
    owner: triadFrom(Number(digits[1])),
    group: triadFrom(Number(digits[2])),
    other: triadFrom(Number(digits[3])),
    setuid: (special & 4) !== 0,
    setgid: (special & 2) !== 0,
    sticky: (special & 1) !== 0,
  };
}

function modeFromSymbolic(raw: string): Mode | ChmodError {
  const match = /^([r-])([w-])([xsS-])([r-])([w-])([xsS-])([r-])([w-])([xtT-])$/.exec(raw);
  if (!match) return { error: "Symbolic mode looks like rwxr-xr-x." };
  const ownerExec = match[3] ?? "-";
  const groupExec = match[6] ?? "-";
  const otherExec = match[9] ?? "-";
  return {
    owner: { read: match[1] === "r", write: match[2] === "w", execute: ownerExec === "x" || ownerExec === "s" },
    group: { read: match[4] === "r", write: match[5] === "w", execute: groupExec === "x" || groupExec === "s" },
    other: { read: match[7] === "r", write: match[8] === "w", execute: otherExec === "x" || otherExec === "t" },
    setuid: ownerExec === "s" || ownerExec === "S",
    setgid: groupExec === "s" || groupExec === "S",
    sticky: otherExec === "t" || otherExec === "T",
  };
}

function symbolic(mode: Mode) {
  return [
    flag(mode.owner.read, "r"),
    flag(mode.owner.write, "w"),
    specialFlag(mode.owner.execute, mode.setuid, "s"),
    flag(mode.group.read, "r"),
    flag(mode.group.write, "w"),
    specialFlag(mode.group.execute, mode.setgid, "s"),
    flag(mode.other.read, "r"),
    flag(mode.other.write, "w"),
    specialFlag(mode.other.execute, mode.sticky, "t"),
  ].join("");
}

function triadValue(triad: Triad) {
  return (triad.read ? 4 : 0) + (triad.write ? 2 : 0) + (triad.execute ? 1 : 0);
}

function triadFrom(value: number): Triad {
  return { read: (value & 4) !== 0, write: (value & 2) !== 0, execute: (value & 1) !== 0 };
}

function flag(on: boolean, char: string) {
  return on ? char : "-";
}

function specialFlag(execute: boolean, special: boolean, char: string) {
  if (!special) return execute ? "x" : "-";
  return execute ? char : char.toUpperCase();
}
