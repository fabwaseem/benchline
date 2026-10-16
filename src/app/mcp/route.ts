import { handleMcpRequest } from "@/lib/mcp/handler";

export function POST(request: Request) {
  return handleMcpRequest(request);
}

export function GET() {
  return new Response("Method not allowed", {
    status: 405,
    headers: { allow: "POST", "cache-control": "no-store" },
  });
}

export function DELETE() {
  return new Response("Method not allowed", {
    status: 405,
    headers: { allow: "POST", "cache-control": "no-store" },
  });
}
