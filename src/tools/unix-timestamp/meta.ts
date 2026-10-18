import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "unix-timestamp",
  name: "Unix timestamp converter",
  tagline: "Turn epoch seconds or milliseconds into a date, and a date in any time zone back into epoch time.",
  description:
    "Free epoch converter for unix timestamps. Switch between seconds, milliseconds, microseconds, and nanoseconds, read ISO-8601 and RFC 2822 dates, and convert both ways across IANA time zones. Runs in the browser.",
  category: "time",
  tags: ["time", "epoch", "timezone"],
  keywords: ["epoch converter", "unix timestamp", "epoch to date", "unix time converter"],
  status: "new",
  createdAt: "2026-10-18",
  updatedAt: "2026-10-18",
  icon: "Clock",
  related: ["date-difference", "cron-expression-builder", "jwt-decoder", "hash-generator"],
  faqs: [
    { q: "Is 10 digits seconds or milliseconds?", a: "Ten digits is seconds. Thirteen digits is milliseconds. Sixteen is microseconds and nineteen is nanoseconds. The Auto unit uses that length, and you can override it." },
    { q: "Which time zone is the timestamp itself in?", a: "A unix timestamp is always UTC. The time zone only changes how the calendar date is written, or which local time you mean when you convert a date back to epoch." },
    { q: "What happens during daylight-saving time?", a: "A skipped hour, such as 02:30 on the spring-forward day in America/New_York, is reported as a gap. A repeated hour lists both UTC instants and uses the earlier one." },
    { q: "Does this page upload the timestamp?", a: "No. Parsing and time-zone math stay in the browser." },
  ],
  seo: {
    title: "Unix timestamp converter",
    description: "Convert epoch seconds or milliseconds to a date and back, in any IANA time zone. Seconds, milliseconds, ISO-8601, and RFC 2822.",
  },
  howTo: [
    { name: "Paste a timestamp or a date", text: "A number is read as epoch time. An ISO-8601 or RFC 2822 date is read as a calendar time." },
    { name: "Pick the unit and time zone", text: "Auto detects seconds, milliseconds, microseconds, or nanoseconds from the length. The zone formats the local time." },
    { name: "Copy seconds, milliseconds, or ISO-8601", text: "Date to epoch uses the date and time you enter as wall time in the selected zone." },
  ],
  inputs: "A unix timestamp, ISO-8601 date, or RFC 2822 date, plus a unit and an IANA time zone.",
  outputs: "Epoch seconds, epoch milliseconds, ISO-8601 in UTC and locally, RFC 2822, and a relative phrase.",
  runsLocally: true,
  badges: ["Seconds · Milliseconds · Time zones"],
} satisfies ToolMeta;
