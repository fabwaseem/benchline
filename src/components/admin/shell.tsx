"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/site/logo";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { LogoutButton } from "@/components/admin/logout-button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Overview", match: (path: string) => path === "/admin" },
  { href: "/admin/tools", label: "Tools", match: (path: string) => path.startsWith("/admin/tools") },
  { href: "/admin/live", label: "Live", match: (path: string) => path.startsWith("/admin/live") },
  { href: "/admin/mcp", label: "MCP", match: (path: string) => path.startsWith("/admin/mcp") },
  { href: "/admin/errors", label: "Errors", match: (path: string) => path.startsWith("/admin/errors") },
];

export function AdminShell({ csrf, children }: { csrf: string; children: ReactNode }) {
  const path = usePathname();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-[var(--glass)] backdrop-blur-[16px]">
        <div className="page-x flex h-14 items-center gap-3">
          <Logo />
          <span className="hidden font-mono text-[11px] tracking-[0.08em] text-faint uppercase sm:inline">Admin</span>
          <nav className="flex min-w-0 items-center gap-0.5 overflow-x-auto" aria-label="Admin">
            {links.map((link) => {
              const on = link.match(path);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={on ? "page" : undefined}
                  className={cn(
                    "rounded-lg px-2.5 py-1.5 text-[13px] whitespace-nowrap text-muted-foreground transition-colors duration-150 hover:text-foreground",
                    on && "bg-sunken text-foreground",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <LogoutButton csrf={csrf} />
          </div>
        </div>
      </header>
      <main className="page-x py-6 pb-16">{children}</main>
    </div>
  );
}
