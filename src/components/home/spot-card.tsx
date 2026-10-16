"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export function SpotCard({
  href,
  className,
  children,
  tilt = false,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
  tilt?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn("card spot flex min-w-0 flex-col overflow-hidden p-[22px]", className)}
      onPointerMove={(event) => {
        const element = event.currentTarget;
        const rect = element.getBoundingClientRect();
        element.style.setProperty("--mx", `${event.clientX - rect.left}px`);
        element.style.setProperty("--my", `${event.clientY - rect.top}px`);
        if (!tilt || rect.width < 360 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const px = (event.clientX - rect.left) / rect.width - 0.5;
        const py = (event.clientY - rect.top) / rect.height - 0.5;
        element.style.transform = `perspective(900px) rotateX(${(-py * 3).toFixed(2)}deg) rotateY(${(px * 3).toFixed(2)}deg)`;
      }}
      onPointerLeave={(event) => {
        event.currentTarget.style.transform = "";
      }}
    >
      {children}
    </Link>
  );
}
