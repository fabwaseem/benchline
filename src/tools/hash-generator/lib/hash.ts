export const hashAlgorithms = ["MD5", "SHA-1", "SHA-256", "SHA-512"] as const;
export type HashAlgorithm = (typeof hashAlgorithms)[number];

export type HashRow = {
  algorithm: HashAlgorithm;
  hex: string;
  base64: string;
};

const SHIFT = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
  5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
  4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
  6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
] as const;

const K = new Uint32Array([
  0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee, 0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501,
  0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be, 0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821,
  0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa, 0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
  0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed, 0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a,
  0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c, 0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70,
  0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05, 0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
  0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039, 0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1,
  0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1, 0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391,
]);

const SUBTLE: Record<Exclude<HashAlgorithm, "MD5">, string> = {
  "SHA-1": "SHA-1",
  "SHA-256": "SHA-256",
  "SHA-512": "SHA-512",
};

export function encodeText(value: string) {
  return new TextEncoder().encode(value);
}

export async function hashAll(data: Uint8Array, key?: Uint8Array): Promise<HashRow[]> {
  const rows: HashRow[] = [];
  for (const algorithm of hashAlgorithms) {
    const bytes = key ? await hmac(data, key, algorithm) : await digest(data, algorithm);
    rows.push({ algorithm, hex: bytesToHex(bytes), base64: bytesToBase64(bytes) });
  }
  return rows;
}

export async function digest(data: Uint8Array, algorithm: HashAlgorithm): Promise<Uint8Array> {
  if (algorithm === "MD5") return md5(data);
  const subtle = await crypto.subtle.digest(SUBTLE[algorithm], copyBytes(data));
  return new Uint8Array(subtle);
}

export async function hmac(data: Uint8Array, key: Uint8Array, algorithm: HashAlgorithm): Promise<Uint8Array> {
  const block = algorithm === "SHA-512" ? 128 : 64;
  let padded = key.length > block ? await digest(key, algorithm) : key;
  if (padded.length < block) {
    const next = new Uint8Array(block);
    next.set(padded);
    padded = next;
  }
  const inner = new Uint8Array(block + data.length);
  const outerKey = new Uint8Array(block);
  for (let i = 0; i < block; i += 1) {
    inner[i] = (padded[i] ?? 0) ^ 0x36;
    outerKey[i] = (padded[i] ?? 0) ^ 0x5c;
  }
  inner.set(data, block);
  const innerHash = await digest(inner, algorithm);
  const outer = new Uint8Array(block + innerHash.length);
  outer.set(outerKey);
  outer.set(innerHash, block);
  return digest(outer, algorithm);
}

export function bytesToHex(bytes: Uint8Array) {
  let hex = "";
  for (const byte of bytes) hex += byte.toString(16).padStart(2, "0");
  return hex;
}

export function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export function hashesEqual(actual: string, expected: string) {
  const left = normalize(actual);
  const right = normalize(expected);
  if (!left || !right || left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i += 1) diff |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return diff === 0;
}

export function matchingAlgorithms(rows: HashRow[], expected: string) {
  const needle = expected.trim();
  if (!needle) return [];
  return rows.filter((row) => hashesEqual(row.hex, needle) || hashesEqual(row.base64, needle)).map((row) => row.algorithm);
}

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/[\s:]/g, "");
}

export function md5(message: Uint8Array) {
  const zeros = (56 - ((message.length + 1) % 64) + 64) % 64;
  const padded = new Uint8Array(message.length + 1 + zeros + 8);
  padded.set(message);
  padded[message.length] = 0x80;
  const view = new DataView(padded.buffer);
  const bits = message.length * 8;
  view.setUint32(padded.length - 8, bits >>> 0, true);
  view.setUint32(padded.length - 4, Math.floor(bits / 4294967296), true);

  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;
  for (let offset = 0; offset < padded.length; offset += 64) {
    const words = new Uint32Array(16);
    for (let i = 0; i < 16; i += 1) words[i] = view.getUint32(offset + i * 4, true);
    let a = a0;
    let b = b0;
    let c = c0;
    let d = d0;
    for (let i = 0; i < 64; i += 1) {
      let f = 0;
      let g = 0;
      if (i < 16) {
        f = (b & c) | (~b & d);
        g = i;
      } else if (i < 32) {
        f = (d & b) | (~d & c);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        f = b ^ c ^ d;
        g = (3 * i + 5) % 16;
      } else {
        f = c ^ (b | ~d);
        g = (7 * i) % 16;
      }
      const next = (a + f + (K[i] ?? 0) + (words[g] ?? 0)) >>> 0;
      a = d;
      d = c;
      c = b;
      b = (b + rotateLeft(next, SHIFT[i] ?? 0)) >>> 0;
    }
    a0 = (a0 + a) >>> 0;
    b0 = (b0 + b) >>> 0;
    c0 = (c0 + c) >>> 0;
    d0 = (d0 + d) >>> 0;
  }
  const out = new Uint8Array(16);
  const outView = new DataView(out.buffer);
  outView.setUint32(0, a0, true);
  outView.setUint32(4, b0, true);
  outView.setUint32(8, c0, true);
  outView.setUint32(12, d0, true);
  return out;
}

function rotateLeft(value: number, shift: number) {
  return ((value << shift) | (value >>> (32 - shift))) >>> 0;
}

function copyBytes(bytes: Uint8Array) {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy;
}
