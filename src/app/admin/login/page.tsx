import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/login-form";
import { currentAdminSession } from "@/lib/admin/current";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  if (await currentAdminSession()) redirect("/admin");
  return (
    <div className="grid min-h-screen place-items-center bg-background px-4 py-10">
      <LoginForm />
    </div>
  );
}
