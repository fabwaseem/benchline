import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className, word = true }: { className?: string; word?: boolean }) {
  const light = word ? "/brand/lockup-light.svg" : "/brand/mark-light.svg";
  const dark = word ? "/brand/lockup-dark.svg" : "/brand/mark-dark.svg";
  const width = word ? 129 : 28;
  return (
    <Link href="/" className={cn("flex items-center", className)} aria-label="Benchline">
      <Image src={light} alt="" width={width} height={28} unoptimized priority className="h-7 w-auto dark:hidden" />
      <Image src={dark} alt="" width={width} height={28} unoptimized className="hidden h-7 w-auto dark:block" />
    </Link>
  );
}
