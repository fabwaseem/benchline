import type { Metadata } from "next";
import { NotFoundView } from "@/components/site/not-found-view";
import { PublicShell } from "@/components/site/public-shell";

export const metadata: Metadata = {
  title: "Not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <PublicShell>
      <NotFoundView />
    </PublicShell>
  );
}
