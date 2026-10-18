import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "ip-cidr-calculator",
  name: "CIDR calculator",
  tagline: "Network, broadcast, host range, and membership for IPv4 and IPv6.",
  description:
    "Free subnet calculator. Enter an IPv4 or IPv6 CIDR and see the network, mask, broadcast, first and last host, and the address count. Test whether an address is inside, split the block, or merge adjacent networks.",
  category: "ip",
  tags: ["ip", "cidr", "subnet"],
  keywords: ["subnet calculator", "cidr calculator", "ip calculator"],
  status: "new",
  createdAt: "2026-10-18",
  updatedAt: "2026-10-18",
  icon: "Network",
  related: ["dns-lookup", "http-headers-checker", "url-codec", "chmod-calculator"],
  faqs: [
    { q: "How are usable hosts counted?", a: "For IPv4 prefixes of /30 and shorter, the network and broadcast addresses are subtracted. /31 and /32 keep every address. IPv6 reports the full address count." },
    { q: "Can I paste a dotted mask?", a: "Yes. 192.168.1.10 255.255.255.0 is the same block as 192.168.1.10/24." },
    { q: "Why is a split limited?", a: "A split that would emit more than 256 networks is refused so the page stays readable. Pick a prefix closer to the original." },
  ],
  seo: {
    title: "CIDR and subnet calculator",
    description: "Calculate IPv4 and IPv6 subnets: network, broadcast, host range, split, and merge.",
  },
  howTo: [
    { name: "Enter a CIDR", text: "192.168.1.0/24 or 2001:db8::/32. Host bits are masked off in the network address." },
    { name: "Test, split, or merge", text: "Optional: an address to test, a longer prefix, or more CIDRs to aggregate." },
    { name: "Read the range", text: "The network, mask, broadcast, and host count update as you type." },
  ],
  inputs: "An IPv4 or IPv6 CIDR, an optional address, a split prefix, and CIDRs to merge.",
  outputs: "Network, mask, host range, membership, split list, and merged CIDRs.",
  runsLocally: true,
  badges: ["IPv4 · IPv6"],
} satisfies ToolMeta;
