import type { ReactNode } from "react";
import { PublicShell } from "@/components/site/public-shell";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return <PublicShell>{children}</PublicShell>;
}
