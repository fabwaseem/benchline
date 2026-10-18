export type Ymd = { year: number; month: number; day: number };
export type Hms = { hour: number; minute: number; second: number };

export type DateDiff = {
  sign: -1 | 0 | 1;
  elapsedMs: number;
  years: number;
  months: number;
  days: number;
  totalDays: number;
  countedDays: number;
  weeks: number;
  extraDays: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalHours: string;
  businessDays: number;
  weekendDays: number;
  holidayDays: number;
};

export type DiffError = { error: string };

const MAX_DAYS = 366 * 400;

export function difference(input: {
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  includeEnd?: boolean;
  holidays?: string;
}): DateDiff | DiffError {
  const startDate = parseDate(input.startDate);
  if ("error" in startDate) return startDate;
  const endDate = parseDate(input.endDate);
  if ("error" in endDate) return endDate;
  const startTime = parseTime(input.startTime ?? "00:00:00");
  if ("error" in startTime) return startTime;
  const endTime = parseTime(input.endTime ?? "00:00:00");
  if ("error" in endTime) return endTime;
  const holidayList = parseHolidays(input.holidays ?? "");
  if ("error" in holidayList) return holidayList;

  const startMs = Date.UTC(startDate.year, startDate.month - 1, startDate.day, startTime.hour, startTime.minute, startTime.second);
  const endMs = Date.UTC(endDate.year, endDate.month - 1, endDate.day, endTime.hour, endTime.minute, endTime.second);
  const elapsedMs = endMs - startMs;
  const sign: -1 | 0 | 1 = elapsedMs < 0 ? -1 : elapsedMs > 0 ? 1 : 0;
  const earlier = compare(startDate, endDate) <= 0 ? startDate : endDate;
  const later = compare(startDate, endDate) <= 0 ? endDate : startDate;
  const span = calendarBetween(earlier, later);
  const range = enumerate(startDate, endDate, input.includeEnd ?? false);
  if ("error" in range) return range;
  const holidaySet = new Set(holidayList);
  let businessDays = 0;
  let weekendDays = 0;
  let holidayDays = 0;
  for (const day of range) {
    const weekend = isWeekend(day);
    const holiday = holidaySet.has(isoDate(day));
    if (weekend) weekendDays += 1;
    else if (holiday) holidayDays += 1;
    else businessDays += 1;
  }
  const abs = Math.abs(elapsedMs);
  const totalDays = Math.trunc(abs / 86_400_000);
  const hours = Math.trunc((abs % 86_400_000) / 3_600_000);
  const minutes = Math.trunc((abs % 3_600_000) / 60_000);
  const seconds = Math.trunc((abs % 60_000) / 1000);
  return {
    sign,
    elapsedMs,
    years: span.years,
    months: span.months,
    days: span.days,
    totalDays,
    countedDays: range.length,
    weeks: Math.trunc(range.length / 7),
    extraDays: range.length % 7,
    hours,
    minutes,
    seconds,
    totalHours: formatHours(abs / 3_600_000),
    businessDays,
    weekendDays,
    holidayDays,
  };
}

function formatHours(value: number) {
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

export function parseDate(value: string): Ymd | DiffError {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return { error: "Use dates like 2026-01-31." };
  const day: Ymd = { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
  if (day.month < 1 || day.month > 12 || !sameDate(day)) return { error: `${value.trim()} is not a real date.` };
  return day;
}

export function parseTime(value: string): Hms | DiffError {
  const match = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value.trim());
  if (!match) return { error: "Use a time like 09:30 or 09:30:00." };
  const time = { hour: Number(match[1]), minute: Number(match[2]), second: Number(match[3] ?? "0") };
  if (time.hour > 23 || time.minute > 59 || time.second > 59) return { error: "That time is not a real hour, minute, and second." };
  return time;
}

export function parseHolidays(value: string): string[] | DiffError {
  const holidays: string[] = [];
  for (const line of value.split(/\n+/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const parsed = parseDate(trimmed);
    if ("error" in parsed) return { error: `${trimmed} is not a holiday date. Use YYYY-MM-DD.` };
    holidays.push(isoDate(parsed));
  }
  return holidays;
}

function enumerate(start: Ymd, end: Ymd, includeEnd: boolean): Ymd[] | DiffError {
  const forward = compare(start, end) <= 0;
  const from = forward ? start : end;
  const to = forward ? end : start;
  const last = includeEnd ? addDays(to, 1) : to;
  const days: Ymd[] = [];
  let cursor = from;
  while (compare(cursor, last) < 0) {
    days.push(cursor);
    if (days.length > MAX_DAYS) return { error: "That range is longer than 400 years." };
    cursor = addDays(cursor, 1);
  }
  return days;
}

function calendarBetween(start: Ymd, end: Ymd) {
  let cursor = start;
  let years = 0;
  while (compare(addMonths(cursor, 12), end) <= 0) {
    cursor = addMonths(cursor, 12);
    years += 1;
  }
  let months = 0;
  while (compare(addMonths(cursor, 1), end) <= 0) {
    cursor = addMonths(cursor, 1);
    months += 1;
  }
  return { years, months, days: dayNumber(end) - dayNumber(cursor) };
}

function addMonths(day: Ymd, months: number): Ymd {
  const total = day.year * 12 + (day.month - 1) + months;
  const year = Math.floor(total / 12);
  const month = (total % 12 + 12) % 12;
  const length = daysInMonth(year, month + 1);
  return { year, month: month + 1, day: Math.min(day.day, length) };
}

function addDays(day: Ymd, count: number): Ymd {
  const date = new Date(Date.UTC(day.year, day.month - 1, day.day) + count * 86_400_000);
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
}

function dayNumber(day: Ymd) {
  return Math.trunc(Date.UTC(day.year, day.month - 1, day.day) / 86_400_000);
}

function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function compare(left: Ymd, right: Ymd) {
  return dayNumber(left) - dayNumber(right);
}

function isWeekend(day: Ymd) {
  const weekday = new Date(Date.UTC(day.year, day.month - 1, day.day)).getUTCDay();
  return weekday === 0 || weekday === 6;
}

function sameDate(day: Ymd) {
  const probe = new Date(Date.UTC(day.year, day.month - 1, day.day));
  return probe.getUTCFullYear() === day.year && probe.getUTCMonth() === day.month - 1 && probe.getUTCDate() === day.day;
}

function isoDate(day: Ymd) {
  return `${day.year}-${String(day.month).padStart(2, "0")}-${String(day.day).padStart(2, "0")}`;
}
