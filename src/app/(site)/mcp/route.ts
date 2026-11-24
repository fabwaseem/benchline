import { handleMcpRequest } from "@/lib/mcp/handler";
import { mcpMethodNotAllowed } from "@/lib/mcp/method";

export function POST(request: Request) {
  return handleMcpRequest(request);
}

export function GET() {
  return mcpMethodNotAllowed();
}

export function DELETE() {
  return mcpMethodNotAllowed();
}
