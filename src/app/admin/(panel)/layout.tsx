import { redirect } from "next/navigation";
import { connection } from "next/server";
import { AdminShell } from "@/components/admin/shell";
import { currentAdminSession } from "@/lib/admin/current";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  await connection();
  const session = await currentAdminSession();
  if (!session) redirect("/admin/login");
  return <AdminShell csrf={session.csrf}>{children}</AdminShell>;
}
