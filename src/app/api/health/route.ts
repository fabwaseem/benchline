import { connection } from "next/server";
import { isDraining } from "@/lib/shutdown/state";

export async function GET() {
  await connection();
  const draining = isDraining();
  return Response.json(
    { status: draining ? "draining" : "ok" },
    { status: draining ? 503 : 200, headers: { "cache-control": "no-store" } },
  );
}
