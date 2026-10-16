import { benchLlmsFull } from "@/lib/mcp/llms-doc";

export function GET() {
  return new Response(benchLlmsFull(), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
