import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "websocket-tester",
  name: "WebSocket Tester",
  tagline: "Connect to any ws/wss endpoint and inspect live frames.",
  description:
    "Free WebSocket testing tool. Connect to ws:// or wss:// endpoints, send text messages, and watch a live timestamped log of incoming, outgoing, and system frames. Close codes are decoded, and an optional heartbeat keeps idle connections alive.",
  category: "http",
  tags: ["websocket", "network", "realtime"],
  keywords: ["websocket tester online", "test websocket", "wss client", "websocket debugger"],
  status: "new",
  createdAt: "2026-10-18",
  updatedAt: "2026-10-18",
  icon: "Network",
  related: ["graphql-client", "curl-converter", "http-headers-checker", "dns-lookup"],
  faqs: [
    { q: "Can I set custom headers or subprotocols?", a: "Browsers do not let JavaScript set custom headers on the WebSocket handshake, and this tool does not negotiate subprotocols. For full handshake control use curl or a native client." },
    { q: "Why won't my local server connect?", a: "Use ws:// for plain local servers. Browsers block mixed content: an https page cannot open a ws:// connection, so serve the page over http or use wss://." },
    { q: "What does the heartbeat do?", a: "Browsers cannot send protocol ping frames, so the heartbeat sends a small text message on an interval you choose — enough to keep most idle connections and proxies from timing out." },
    { q: "Is my traffic sent anywhere else?", a: "No. Frames travel straight from your browser to the endpoint you entered." },
  ],
  seo: {
    title: "WebSocket Tester",
    description: "Free online WebSocket client: connect to ws/wss endpoints, send messages, and inspect live frames with close codes.",
  },
  howTo: [
    { name: "Enter the endpoint", text: "Type a ws:// or wss:// URL, including any path or query token." },
    { name: "Connect and send", text: "Open the connection, type a message, and send it. Incoming frames appear instantly." },
    { name: "Read the log", text: "Each frame is timestamped and marked in, out, or system. Closing shows the decoded close code." },
  ],
  inputs: "A ws/wss URL, outgoing messages, and heartbeat settings.",
  outputs: "A live timestamped frame log with decoded close codes.",
  runsLocally: false,
  badges: ["Live frames · Close codes"],
} satisfies ToolMeta;
