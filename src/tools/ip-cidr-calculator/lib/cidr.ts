import { Address4, Address6 } from "ip-address";

export type IpVersion = 4 | 6;

export type NetworkSummary = {
  version: IpVersion;
  input: string;
  network: string;
  prefix: number;
  netmask: string;
  wildcard: string;
  broadcast: string | null;
  firstHost: string;
  lastHost: string;
  addressCount: string;
  usableHosts: string;
};

export type CidrResult = {
  summary: NetworkSummary;
  contains: boolean | null;
  containsDetail: string;
  split: string[];
  splitCount: string;
  merged: string[];
};

type Parsed = {
  version: IpVersion;
  start: bigint;
  end: bigint;
  prefix: number;
  bits: number;
  network: string;
};

const MAX_SPLIT = 256;

export function calculateCidr(input: {
  cidr: string;
  contains?: string;
  splitPrefix?: number;
  merge?: string[];
}): CidrResult | { error: string } {
  const parsed = parseNetwork(input.cidr);
  if ("error" in parsed) return parsed;
  const summary = toSummary(parsed, input.cidr.trim());

  let contains: boolean | null = null;
  let containsDetail = "";
  if (input.contains?.trim()) {
    const check = containsHost(parsed, input.contains);
    if ("error" in check) return check;
    contains = check.contains;
    containsDetail = check.detail;
  }

  let split: string[] = [];
  let splitCount = "0";
  if (input.splitPrefix !== undefined && !Number.isNaN(input.splitPrefix)) {
    const parts = splitNetwork(parsed, input.splitPrefix);
    if ("error" in parts) return parts;
    split = parts.networks;
    splitCount = parts.count;
  }

  let merged: string[] = [];
  if (input.merge && input.merge.some((item) => item.trim())) {
    const result = mergeNetworks([input.cidr, ...input.merge]);
    if ("error" in result) return result;
    merged = result;
  }

  return { summary, contains, containsDetail, split, splitCount, merged };
}

export function parseNetwork(input: string): Parsed | { error: string } {
  const trimmed = input.trim();
  if (!trimmed) return { error: "Enter a CIDR, such as 192.168.1.0/24." };
  const pieces = trimmed.split(/\s+/);
  try {
    if (pieces.length === 2 && pieces[0] && pieces[1]?.includes(".")) {
      const address = Address4.fromAddressAndMask(pieces[0], pieces[1]);
      return fromV4(address);
    }
    if (trimmed.includes(":")) {
      const withPrefix = trimmed.includes("/") ? trimmed : `${trimmed}/128`;
      if (!Address6.isValid(withPrefix)) return { error: "That is not an IPv6 CIDR." };
      return fromV6(new Address6(withPrefix));
    }
    const withPrefix = trimmed.includes("/") ? trimmed : `${trimmed}/32`;
    if (!Address4.isValid(withPrefix)) return { error: "That is not an IPv4 or IPv6 CIDR." };
    return fromV4(new Address4(withPrefix));
  } catch {
    return { error: "That is not an IPv4 or IPv6 CIDR." };
  }
}

function fromV4(address: Address4): Parsed {
  const start = address.startAddress();
  return {
    version: 4,
    start: start.bigInt(),
    end: address.endAddress().bigInt(),
    prefix: address.subnetMask,
    bits: 32,
    network: `${start.correctForm()}/${address.subnetMask}`,
  };
}

function fromV6(address: Address6): Parsed {
  const start = address.startAddress();
  return {
    version: 6,
    start: start.bigInt(),
    end: address.endAddress().bigInt(),
    prefix: address.subnetMask,
    bits: 128,
    network: `${start.correctForm()}/${address.subnetMask}`,
  };
}

function toSummary(parsed: Parsed, input: string): NetworkSummary {
  const count = parsed.end - parsed.start + BigInt(1);
  const reserve = parsed.version === 4 && parsed.prefix <= 30;
  const usable = reserve ? count - BigInt(2) : count;
  const first = reserve ? parsed.start + BigInt(1) : parsed.start;
  const last = reserve ? parsed.end - BigInt(1) : parsed.end;
  return {
    version: parsed.version,
    input,
    network: parsed.network,
    prefix: parsed.prefix,
    netmask: parsed.version === 4 ? v4Mask(parsed.prefix, false) : v6Mask(parsed.prefix, false),
    wildcard: parsed.version === 4 ? v4Mask(parsed.prefix, true) : v6Mask(parsed.prefix, true),
    broadcast: parsed.version === 4 ? formatAddress(4, parsed.end) : null,
    firstHost: formatAddress(parsed.version, first),
    lastHost: formatAddress(parsed.version, last),
    addressCount: count.toString(),
    usableHosts: usable.toString(),
  };
}

function containsHost(network: Parsed, input: string): { contains: boolean; detail: string } | { error: string } {
  const host = parseNetwork(input.includes("/") ? input.split("/")[0] ?? input : input);
  if ("error" in host) return host;
  if (host.version !== network.version) {
    return { contains: false, detail: "That address is a different IP version." };
  }
  const hostText = formatAddress(host.version, host.start);
  const probe = host.version === 4 ? new Address4(hostText) : new Address6(hostText);
  const block = host.version === 4 ? new Address4(network.network) : new Address6(network.network);
  const contains = probe.isHostInSubnet(block);
  return {
    contains,
    detail: contains ? `${hostText} is inside ${network.network}.` : `${hostText} is outside ${network.network}.`,
  };
}

function splitNetwork(network: Parsed, prefix: number): { networks: string[]; count: string } | { error: string } {
  if (!Number.isInteger(prefix)) return { error: "The new prefix has to be a whole number." };
  if (prefix <= network.prefix || prefix > network.bits) {
    return { error: `The new prefix has to be longer than /${network.prefix} and no longer than /${network.bits}.` };
  }
  const count = BigInt(1) << BigInt(prefix - network.prefix);
  if (count > BigInt(MAX_SPLIT)) {
    return { error: `Splitting /${network.prefix} into /${prefix} creates ${count.toString()} networks. The limit here is ${MAX_SPLIT}.` };
  }
  const size = BigInt(1) << BigInt(network.bits - prefix);
  const networks: string[] = [];
  for (let index = BigInt(0); index < count; index += BigInt(1)) {
    networks.push(`${formatAddress(network.version, network.start + index * size)}/${prefix}`);
  }
  return { networks, count: count.toString() };
}

export function mergeNetworks(inputs: string[]): string[] | { error: string } {
  const parsed: Parsed[] = [];
  for (const input of inputs) {
    if (!input.trim()) continue;
    const network = parseNetwork(input);
    if ("error" in network) return network;
    parsed.push(network);
  }
  if (parsed.length === 0) return { error: "Enter at least one CIDR to merge." };
  const version = parsed[0]?.version;
  if (parsed.some((network) => network.version !== version)) return { error: "Every network has to be the same IP version." };
  const bits = version === 4 ? 32 : 128;
  const ranges = parsed
    .map((network) => ({ start: network.start, end: network.end }))
    .sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0));
  const merged: { start: bigint; end: bigint }[] = [];
  for (const range of ranges) {
    const last = merged[merged.length - 1];
    if (last && range.start <= last.end + BigInt(1)) {
      if (range.end > last.end) last.end = range.end;
    } else {
      merged.push({ ...range });
    }
  }
  const cidrs: string[] = [];
  for (const range of merged) cidrs.push(...rangeToCidrs(range.start, range.end, bits, version ?? 4));
  return cidrs;
}

function rangeToCidrs(start: bigint, end: bigint, bits: number, version: IpVersion) {
  const cidrs: string[] = [];
  let current = start;
  while (current <= end) {
    let size = BigInt(1);
    let prefix = bits;
    while (prefix > 0) {
      const next = size << BigInt(1);
      if (current % next !== BigInt(0)) break;
      if (current + next - BigInt(1) > end) break;
      size = next;
      prefix -= 1;
    }
    cidrs.push(`${formatAddress(version, current)}/${prefix}`);
    current += size;
  }
  return cidrs;
}

function formatAddress(version: IpVersion, value: bigint) {
  return version === 4 ? Address4.fromBigInt(value).correctForm() : Address6.fromBigInt(value).correctForm();
}

function v4Mask(prefix: number, invert: boolean) {
  if (prefix <= 0) return invert ? "255.255.255.255" : "0.0.0.0";
  if (prefix >= 32) return invert ? "0.0.0.0" : "255.255.255.255";
  const bits = (0xffffffff << (32 - prefix)) >>> 0;
  const value = invert ? ~bits >>> 0 : bits;
  return [24, 16, 8, 0].map((shift) => (value >>> shift) & 255).join(".");
}

function v6Mask(prefix: number, invert: boolean) {
  const all = (BigInt(1) << BigInt(128)) - BigInt(1);
  const mask = prefix <= 0 ? BigInt(0) : prefix >= 128 ? all : (all << BigInt(128 - prefix)) & all;
  return Address6.fromBigInt(invert ? all ^ mask : mask).correctForm();
}
