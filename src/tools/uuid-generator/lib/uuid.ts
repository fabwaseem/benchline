export const uuidVersions = ["v4", "v7"] as const;
export type UuidVersion = (typeof uuidVersions)[number];

export const UUID_MAX = 10_000;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type UuidInfo = {
  uuid: string;
  version: number;
  variant: string;
  timestamp: string;
};

export type UuidError = { error: string };

export type RandomBytes = (size: number) => Uint8Array;

export function randomBytes(size: number) {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return bytes;
}

export function generateUuids(version: UuidVersion, count: number, now: () => number = Date.now, random: RandomBytes = randomBytes): string[] | UuidError {
  if (!Number.isInteger(count) || count < 1 || count > UUID_MAX) return { error: `Count must be from 1 to ${UUID_MAX}.` };
  const ids: string[] = [];
  const clock = now();
  for (let index = 0; index < count; index += 1) {
    ids.push(version === "v4" ? uuidV4(random) : uuidV7(clock + index, random));
  }
  return ids;
}

export function uuidV4(random: RandomBytes = randomBytes) {
  const bytes = random(16);
  const byte6 = bytes[6] ?? 0;
  const byte8 = bytes[8] ?? 0;
  bytes[6] = (byte6 & 0x0f) | 0x40;
  bytes[8] = (byte8 & 0x3f) | 0x80;
  return formatUuid(bytes);
}

export function uuidV7(timestamp: number, random: RandomBytes = randomBytes) {
  if (!Number.isFinite(timestamp) || timestamp < 0 || timestamp > 0xffffffffffff) {
    throw new Error("UUID v7 timestamp must fit in 48 bits.");
  }
  const bytes = random(16);
  const ms = Math.trunc(timestamp);
  bytes[0] = (ms / 2 ** 40) & 0xff;
  bytes[1] = (ms / 2 ** 32) & 0xff;
  bytes[2] = (ms / 2 ** 24) & 0xff;
  bytes[3] = (ms / 2 ** 16) & 0xff;
  bytes[4] = (ms / 2 ** 8) & 0xff;
  bytes[5] = ms & 0xff;
  const byte6 = bytes[6] ?? 0;
  const byte8 = bytes[8] ?? 0;
  bytes[6] = (byte6 & 0x0f) | 0x70;
  bytes[8] = (byte8 & 0x3f) | 0x80;
  return formatUuid(bytes);
}

export function inspectUuid(value: string): UuidInfo | UuidError {
  const uuid = value.trim();
  if (!UUID_RE.test(uuid)) return { error: "That is not a UUID. Use 8-4-4-4-12 hexadecimal characters." };
  const bytes = hexToBytes(uuid.replace(/-/g, ""));
  const version = ((bytes[6] ?? 0) & 0xf0) >> 4;
  const variantBits = ((bytes[8] ?? 0) & 0xc0) >> 6;
  const variant = variantBits === 2 ? "RFC 4122" : variantBits === 0 ? "NCS" : variantBits === 3 ? "Microsoft" : "Reserved";
  let timestamp = "";
  if (version === 7) {
    const ms = bytes.slice(0, 6).reduce((total, byte) => total * 256 + byte, 0);
    timestamp = new Date(ms).toISOString();
  }
  return { uuid: uuid.toLowerCase(), version, variant, timestamp };
}

function formatUuid(bytes: Uint8Array) {
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function hexToBytes(hex: string) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i += 1) bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}
