import { loginAttempt } from "@/lib/admin/http";

async function passwordFrom(request: Request): Promise<string | null> {
  const type = request.headers.get("content-type") ?? "";
  if (type.includes("application/json")) {
    const body: unknown = await request.json().catch(() => null);
    if (!body || typeof body !== "object") return null;
    const password = (body as { password?: unknown }).password;
    return typeof password === "string" ? password : null;
  }
  const form = await request.formData().catch(() => null);
  const password = form?.get("password");
  return typeof password === "string" ? password : null;
}

export async function POST(request: Request) {
  const password = await passwordFrom(request);
  if (password === null) return loginAttempt(request, "");
  return loginAttempt(request, password);
}
