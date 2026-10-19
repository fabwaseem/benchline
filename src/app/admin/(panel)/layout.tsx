import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/shell";
import { currentAdminSession } from "@/lib/admin/current";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await currentAdminSession();
  if (!session) redirect("/admin/login");
  return <AdminShell csrf={session.csrf}>{children}</AdminShell>;
}
