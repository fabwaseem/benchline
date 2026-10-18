"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search } from "lucide-react";
import { Kbd } from "@/components/kit/kbd";
import { GithubMark } from "@/components/site/github-mark";
import { Logo } from "@/components/site/logo";
import { openCommandK } from "@/components/site/open-command";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { GITHUB_URL } from "@/lib/site";
import { categories, parents } from "@/registry/categories";

const categoryPaths = new Set([...categories, ...parents].map((item) => `/${item.slug}`));
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Tools", match: (path: string) => path === "/" || path.startsWith("/t/") || path.startsWith("/tags/") || path === "/search" },
  { href: "/categories", label: "Categories", match: (path: string) => path === "/categories" || categoryPaths.has(path) },
  { href: "/mcp/guide", label: "MCP", match: (path: string) => path.startsWith("/mcp") || path === "/ai" },
];

export function TopBar({ toolCount }: { toolCount: number }) {
  const path = usePathname();
  return (
    <header className="site-header sticky top-0 z-40 border-b border-border">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-surface focus:px-2 focus:py-1">
        Skip to content
      </a>
      <div className="grid h-14 grid-cols-[auto_1fr_auto] items-center gap-3 px-3 sm:px-4">
        <Logo />
        <div className="flex justify-center px-2">
          <button
            type="button"
            className="hidden h-9 w-full max-w-[440px] items-center gap-2 rounded-lg border border-border bg-surface px-3 text-[13px] text-muted-foreground transition-colors duration-150 hover:border-border-strong focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none md:flex"
            onClick={() => openCommandK()}
          >
            <Search size={14} strokeWidth={1.75} aria-hidden />
            <span className="truncate">Search {toolCount} tools…</span>
            <span className="ml-auto flex gap-1">
              <Kbd>⌘</Kbd>
              <Kbd>K</Kbd>
            </span>
          </button>
        </div>
        <div className="flex items-center gap-1">
          <nav className="hidden items-center lg:flex" aria-label="Primary">
            {links.map((link) => {
              const on = link.match(path);
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  aria-current={on ? "page" : undefined}
                  className={cn(
                    "rounded-lg px-2.5 py-1.5 text-[13.5px] text-muted-foreground transition-colors duration-150 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                    on && "text-foreground",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <a
            href={GITHUB_URL}
            aria-label="GitHub"
            className="grid size-9 place-items-center rounded-lg text-muted-foreground transition-colors duration-150 hover:bg-sunken hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <GithubMark size={16} />
          </a>
          <ThemeToggle />
          <button
            type="button"
            className="grid size-9 place-items-center rounded-lg text-muted-foreground md:hidden"
            aria-label="Search"
            onClick={() => openCommandK()}
          >
            <Search size={16} strokeWidth={1.75} />
          </button>
          <Sheet>
            <SheetTrigger className="grid size-9 place-items-center rounded-lg text-muted-foreground lg:hidden" aria-label="Menu">
              <Menu size={16} strokeWidth={1.75} />
            </SheetTrigger>
            <SheetContent>
              <SheetTitle className="font-semibold tracking-tight">Benchline</SheetTitle>
              <nav className="mt-4 flex flex-col gap-1" aria-label="Mobile">
                {links.map((link) => (
                  <Link key={link.label} href={link.href} className="rounded-lg px-2 py-2 text-sm">
                    {link.label}
                  </Link>
                ))}
                <a href={GITHUB_URL} className="rounded-lg px-2 py-2 text-sm">
                  GitHub
                </a>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

export function AppShell({ toolCount, children }: { toolCount: number; children: ReactNode }) {
  return (
    <>
      <TopBar toolCount={toolCount} />
      <main id="main" className="flex-1">
        {children}
      </main>
    </>
  );
}
