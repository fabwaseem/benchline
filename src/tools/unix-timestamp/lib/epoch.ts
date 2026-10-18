export const timeUnits = ["s", "ms", "us", "ns"] as const;
export type TimeUnit = (typeof timeUnits)[number];
export type UnitChoice = "auto" | TimeUnit;

export const commonTimeZones = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Africa/Cairo",
  "Asia/Dubai",
  "Asia/Karachi",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Pacific/Auckland",
] as const;

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;
const MONTH_INDEX: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};
const RFC_OFFSETS: Record<string, number> = {
  UT: 0, GMT: 0, UTC: 0, EST: -5, EDT: -4, CST: -6, CDT: -5, MST: -7, MDT: -6, PST: -8, PDT: -7,
};

export type WallTime = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
};

export type InstantView = {
  ms: number;
  seconds: string;
  milliseconds: string;
  isoUtc: string;
  isoLocal: string;
  rfc2822: string;
  relative: string;
  weekday: string;
  offset: string;
  timeZone: string;
  unit: TimeUnit | "calendar";
  alternateIsoUtc: string;
};

export type EpochError = { error: string };

export function timeZones(): string[] {
  if (typeof Intl.supportedValuesOf === "function") {
    const zones = Intl.supportedValuesOf("timeZone");
    if (zones.length > 0) return zones;
  }
  return [...commonTimeZones];
}

export function isTimeZone(timeZone: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

export function convertToDate(input: string, timeZone: string, unit: UnitChoice = "auto", now = Date.now()): InstantView | EpochError {
  const parsed = parseInput(input, timeZone, unit);
  if ("error" in parsed) return parsed;
  return viewOf(parsed.ms, timeZone, parsed.unit, now, parsed.alternateMs);
}

export function convertToEpoch(wall: WallTime, timeZone: string, now = Date.now()): InstantView | EpochError {
  const zoned = zonedToEpoch(wall, timeZone);
  if ("error" in zoned) return zoned;
  return viewOf(zoned.ms, timeZone, "calendar", now, zoned.alternateMs);
}

export function zonedToEpoch(wall: WallTime, timeZone: string): { ms: number; alternateMs: number | null } | EpochError {
  if (!isTimeZone(timeZone)) return { error: `Unknown time zone ${timeZone}.` };
  const invalid = invalidWall(wall);
  if (invalid) return { error: invalid };
  const utcGuess = Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute, wall.second);
  const offsets = new Set<number>();
  for (let hour = -16; hour <= 16; hour += 1) offsets.add(timeZoneOffsetMs(utcGuess + hour * 3_600_000, timeZone));
  const matches: number[] = [];
  for (const offset of offsets) {
    const candidate = utcGuess - offset;
    if (sameWall(wallFromUtc(candidate, timeZone), wall)) matches.push(candidate);
  }
  const unique = [...new Set(matches)].sort((a, b) => a - b);
  const first = unique[0];
  if (first === undefined) {
    return { error: "That local time does not exist in this time zone because of a daylight-saving gap." };
  }
  return { ms: first + wall.millisecond, alternateMs: unique[1] === undefined ? null : unique[1] + wall.millisecond };
}

export function wallFromInputs(date: string, time: string): WallTime | EpochError {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim());
  if (!dateMatch) return { error: "Use a date like 2026-01-31." };
  const timeMatch = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(time.trim() || "00:00:00");
  if (!timeMatch) return { error: "Use a time like 09:30:00." };
  const wall: WallTime = {
    year: Number(dateMatch[1]),
    month: Number(dateMatch[2]),
    day: Number(dateMatch[3]),
    hour: Number(timeMatch[1]),
    minute: Number(timeMatch[2]),
    second: Number(timeMatch[3] ?? "0"),
    millisecond: 0,
  };
  const invalid = invalidWall(wall);
  return invalid ? { error: invalid } : wall;
}

export function relativeTime(ms: number, now: number) {
  const delta = ms - now;
  const abs = Math.abs(delta);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31_556_952_000],
    ["month", 2_629_746_000],
    ["week", 604_800_000],
    ["day", 86_400_000],
    ["hour", 3_600_000],
    ["minute", 60_000],
    ["second", 1_000],
  ];
  const format = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  for (const [unit, size] of units) {
    if (abs >= size || unit === "second") return format.format(Math.round(delta / size), unit);
  }
  return "now";
}

function parseInput(input: string, timeZone: string, unit: UnitChoice): { ms: number; unit: TimeUnit | "calendar"; alternateMs: number | null } | EpochError {
  const raw = input.trim();
  if (!raw) return { error: "Enter a timestamp or a date." };
  if (/^now$/i.test(raw)) return { ms: Date.now(), unit: "ms", alternateMs: null };
  if (/^[+-]?\d+(?:\.\d+)?$/.test(raw)) return parseNumeric(raw, unit);
  const iso = parseIso(raw, timeZone);
  if (iso) return iso;
  const rfc = parseRfc2822(raw);
  if (rfc) return rfc;
  return { error: "Use a unix timestamp, an ISO-8601 date, or an RFC 2822 date." };
}

function parseNumeric(raw: string, unit: UnitChoice): { ms: number; unit: TimeUnit; alternateMs: null } | EpochError {
  const negative = raw.startsWith("-");
  const body = raw.replace(/^[+-]/, "");
  const [whole = "0", frac = ""] = body.split(".");
  const digits = whole.replace(/^0+/, "").length || 1;
  const resolved: TimeUnit = unit === "auto" ? detectUnit(digits) : unit;
  const scale = resolved === "s" ? 3 : resolved === "ms" ? 0 : resolved === "us" ? -3 : -6;
  const combined = `${whole}${frac}`.replace(/^0+(?=\d)/, "");
  const shift = scale - frac.length;
  let msText = "0";
  if (shift >= 0) msText = `${combined}${"0".repeat(shift)}`.replace(/^0+(?=\d)/, "");
  else if (combined.length + shift > 0) msText = combined.slice(0, combined.length + shift).replace(/^0+(?=\d)/, "") || "0";
  if (msText.length > 15) return { error: "That timestamp is outside the range this page can represent exactly." };
  const magnitude = Number(msText);
  if (!Number.isSafeInteger(magnitude)) return { error: "That timestamp is outside the range this page can represent exactly." };
  return { ms: negative ? -magnitude : magnitude, unit: resolved, alternateMs: null };
}

function detectUnit(digits: number): TimeUnit {
  if (digits <= 10) return "s";
  if (digits <= 13) return "ms";
  if (digits <= 16) return "us";
  return "ns";
}

function parseIso(raw: string, timeZone: string): { ms: number; unit: "calendar"; alternateMs: number | null } | EpochError | null {
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (dateOnly) {
    const zoned = zonedToEpoch({
      year: Number(dateOnly[1]),
      month: Number(dateOnly[2]),
      day: Number(dateOnly[3]),
      hour: 0,
      minute: 0,
      second: 0,
      millisecond: 0,
    }, timeZone);
    if ("error" in zoned) return zoned;
    return { ms: zoned.ms, unit: "calendar", alternateMs: zoned.alternateMs };
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(Z|[+-]\d{2}:?\d{2})?$/.exec(raw);
  if (!match) return null;
  const wall: WallTime = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
    second: Number(match[6] ?? "0"),
    millisecond: Number((match[7] ?? "").padEnd(3, "0") || "0"),
  };
  const zone = match[8];
  if (!zone) {
    const zoned = zonedToEpoch(wall, timeZone);
    if ("error" in zoned) return zoned;
    return { ms: zoned.ms, unit: "calendar", alternateMs: zoned.alternateMs };
  }
  const invalid = invalidWall(wall);
  if (invalid) return { error: invalid };
  const offset = zone === "Z" ? 0 : offsetFromText(zone);
  const ms = Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute, wall.second, wall.millisecond) - offset;
  return { ms, unit: "calendar", alternateMs: null };
}

function parseRfc2822(raw: string): { ms: number; unit: "calendar"; alternateMs: null } | EpochError | null {
  const match = /^(?:[A-Za-z]{3},\s+)?(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})\s+(\d{2}):(\d{2})(?::(\d{2}))?\s+([A-Za-z]{1,5}|[+-]\d{4})$/.exec(raw);
  if (!match) return null;
  const month = MONTH_INDEX[match[2]?.toLowerCase() ?? ""];
  if (!month) return { error: "That month is not an English abbreviation." };
  const wall: WallTime = {
    year: Number(match[3]),
    month,
    day: Number(match[1]),
    hour: Number(match[4]),
    minute: Number(match[5]),
    second: Number(match[6] ?? "0"),
    millisecond: 0,
  };
  const invalid = invalidWall(wall);
  if (invalid) return { error: invalid };
  const zone = match[7] ?? "GMT";
  const offset = zone.startsWith("+") || zone.startsWith("-") ? offsetFromText(zone) : RFC_OFFSETS[zone.toUpperCase()];
  if (offset === undefined) return { error: `Unknown RFC 2822 zone ${zone}. Use a numeric offset such as +0530.` };
  return {
    ms: Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute, wall.second) - offset,
    unit: "calendar",
    alternateMs: null,
  };
}

function offsetFromText(zone: string) {
  const match = /^([+-])(\d{2}):?(\d{2})$/.exec(zone);
  if (!match) return 0;
  const sign = match[1] === "-" ? -1 : 1;
  return sign * (Number(match[2]) * 3_600_000 + Number(match[3]) * 60_000);
}

function viewOf(ms: number, timeZone: string, unit: TimeUnit | "calendar", now: number, alternateMs: number | null): InstantView | EpochError {
  if (!Number.isFinite(ms) || !Number.isSafeInteger(Math.trunc(ms))) return { error: "That timestamp is outside the range this page can represent exactly." };
  if (!isTimeZone(timeZone)) return { error: `Unknown time zone ${timeZone}.` };
  const wall = wallFromUtc(ms, timeZone);
  const offsetMs = timeZoneOffsetMs(ms, timeZone);
  const offset = formatOffset(offsetMs);
  return {
    ms,
    seconds: secondsString(ms),
    milliseconds: String(Math.trunc(ms)),
    isoUtc: new Date(ms).toISOString(),
    isoLocal: formatIsoLocal(wall, offset),
    rfc2822: formatRfc(wall, offsetMs),
    relative: relativeTime(ms, now),
    weekday: WEEKDAYS[weekdayIndex(ms, timeZone)] ?? "",
    offset,
    timeZone,
    unit,
    alternateIsoUtc: alternateMs === null ? "" : new Date(alternateMs).toISOString(),
  };
}

function wallFromUtc(ms: number, timeZone: string): WallTime {
  const bag = parts(ms, timeZone);
  return {
    year: Number(bag.year),
    month: Number(bag.month),
    day: Number(bag.day),
    hour: Number(bag.hour),
    minute: Number(bag.minute),
    second: Number(bag.second),
    millisecond: ((ms % 1000) + 1000) % 1000,
  };
}

function weekdayIndex(ms: number, timeZone: string) {
  const name = parts(ms, timeZone, true).weekday;
  return WEEKDAYS.indexOf(name as (typeof WEEKDAYS)[number]);
}

function parts(ms: number, timeZone: string, weekday = false) {
  const format = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    weekday: weekday ? "long" : undefined,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const bag: Record<string, string> = {};
  for (const part of format.formatToParts(new Date(ms))) {
    if (part.type !== "literal") bag[part.type] = part.value;
  }
  if (bag.hour === "24") {
    bag.hour = "00";
    const rolled = new Date(Date.UTC(Number(bag.year), Number(bag.month) - 1, Number(bag.day) + 1));
    bag.year = String(rolled.getUTCFullYear());
    bag.month = String(rolled.getUTCMonth() + 1).padStart(2, "0");
    bag.day = String(rolled.getUTCDate()).padStart(2, "0");
  }
  return bag;
}

function timeZoneOffsetMs(utcMs: number, timeZone: string) {
  const whole = Math.trunc(utcMs / 1000) * 1000;
  const bag = parts(whole, timeZone);
  const asUtc = Date.UTC(Number(bag.year), Number(bag.month) - 1, Number(bag.day), Number(bag.hour), Number(bag.minute), Number(bag.second));
  return asUtc - whole;
}

function sameWall(left: WallTime, right: WallTime) {
  return left.year === right.year && left.month === right.month && left.day === right.day && left.hour === right.hour && left.minute === right.minute && left.second === right.second;
}

function invalidWall(wall: WallTime) {
  if (wall.month < 1 || wall.month > 12) return "Month must be from 1 to 12.";
  if (wall.hour < 0 || wall.hour > 23 || wall.minute < 0 || wall.minute > 59 || wall.second < 0 || wall.second > 59) return "Time must be a real hour, minute, and second.";
  if (wall.millisecond < 0 || wall.millisecond > 999) return "Milliseconds must be from 0 to 999.";
  const probe = new Date(Date.UTC(wall.year, wall.month - 1, wall.day));
  if (probe.getUTCFullYear() !== wall.year || probe.getUTCMonth() !== wall.month - 1 || probe.getUTCDate() !== wall.day) return "That date does not exist.";
  return "";
}

function formatOffset(offsetMs: number) {
  if (offsetMs === 0) return "Z";
  const sign = offsetMs > 0 ? "+" : "-";
  const abs = Math.abs(offsetMs);
  const hours = Math.floor(abs / 3_600_000);
  const minutes = Math.floor((abs % 3_600_000) / 60_000);
  const seconds = Math.floor((abs % 60_000) / 1000);
  const base = `${sign}${pad(hours)}:${pad(minutes)}`;
  return seconds === 0 ? base : `${base}:${pad(seconds)}`;
}

function formatIsoLocal(wall: WallTime, offset: string) {
  const fraction = wall.millisecond === 0 ? "" : `.${String(wall.millisecond).padStart(3, "0")}`;
  return `${wall.year}-${pad(wall.month)}-${pad(wall.day)}T${pad(wall.hour)}:${pad(wall.minute)}:${pad(wall.second)}${fraction}${offset}`;
}

function formatRfc(wall: WallTime, offsetMs: number) {
  const day = new Date(Date.UTC(wall.year, wall.month - 1, wall.day)).getUTCDay();
  const short = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][day];
  const numeric = formatOffset(offsetMs) === "Z" ? "+0000" : formatOffset(offsetMs).replace(":", "");
  return `${short}, ${pad(wall.day)} ${MONTHS[wall.month - 1]} ${wall.year} ${pad(wall.hour)}:${pad(wall.minute)}:${pad(wall.second)} ${numeric}`;
}

function secondsString(ms: number) {
  const sign = ms < 0 ? "-" : "";
  const abs = Math.abs(Math.trunc(ms));
  const whole = Math.floor(abs / 1000);
  const frac = abs % 1000;
  if (frac === 0) return `${sign}${whole}`;
  return `${sign}${whole}.${String(frac).padStart(3, "0").replace(/0+$/, "")}`;
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}
