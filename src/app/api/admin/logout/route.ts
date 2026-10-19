import { logoutAttempt } from "@/lib/admin/http";

export async function POST(request: Request) {
  const header = request.headers.get("x-csrf-token");
  if (header) return logoutAttempt(request, header);
  const form = await request.formData().catch(() => null);
  const field = form?.get("csrf");
  return logoutAttempt(request, typeof field === "string" ? field : null);
}
