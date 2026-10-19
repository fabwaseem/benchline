import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { KitShowcase } from "@/app/(site)/kit/showcase";

export const metadata: Metadata = {
  title: "Kit",
  robots: { index: false, follow: false },
};

export default function KitPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <KitShowcase />;
}
