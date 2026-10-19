"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/kit/primitives/button";

export function ExportLink({ href }: { href: string }) {
  return (
    <Link href={href} className={buttonVariants({ variant: "outline", size: "sm" })}>
      CSV
    </Link>
  );
}
