import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { adminConfigured } from "@/lib/admin/config";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin · Benchline" },
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await connection();
  if (!adminConfigured()) notFound();
  return children;
}
