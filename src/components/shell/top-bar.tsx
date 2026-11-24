"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Menu, Search, GithubLogo } from "kineticons";
import { Button } from "@/components/kit/primitives/button";
import { IconButton } from "@/components/kit/primitives/icon-button";
import { Kbd } from "@/components/kit/kbd";
import { Logo } from "@/components/site/logo";
import { openCommandK } from "@/components/site/open-command";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { GITHUB_URL } from "@/lib/site";
import { cn } from "@/lib/utils";
import { categories, parents } from "@/registry/categories";

const categoryPaths = new Set([...categories, ...parents].map((item) => `/${item.slug}`));

const links = [
  { href: "/tools", label: "Tools", match: (path: string) => path === "/tools" || path === "/categories" || categoryPaths.has(path) || path.startsWith("/t/") || path.startsWith("/tags/") || path === "/search" || path === "/explore" },
  { href: "/mcp/guide", label: "MCP", match: (path: string) => path.startsWith("/mcp") || path === "/ai" },
  { href: "/about", label: "About", match: (path: string) => path === "/about" },
];

export function TopBar({ toolCount }: { toolCount: number }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header sticky top-0 z-40 border-b border-border">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-brand focus:px-3 focus:py-2 focus:text-[13px] focus:font-semibold focus:text-brand-foreground"
      >
        Skip to content
      </a>
      <div className="page-x frame flex h-15 items-center gap-6">
        <Logo />
        <nav className="hidden items-center gap-0.5 md:flex" aria-label="Primary">
          {links.map((link) => {
            const on = link.match(path);
            return (
              <Link
                key={link.label}
                href={link.href}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "relative inline-flex h-9 items-center rounded-md px-3 text-[13.5px] font-medium text-muted-foreground transition-colors duration-150 hover:bg-sunken hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                  on && "text-foreground after:absolute after:inset-x-3 after:-bottom-[13px] after:h-0.5 after:rounded-full after:bg-brand-text",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-1.5">
          <Button
            type="button"
            variant="ghost"
            onClick={() => openCommandK()}
            className="hidden h-control-md w-[264px] justify-start font-normal hover:bg-sunken items-center gap-2 rounded-md bg-sunken px-3 text-[13px] text-faint shadow-[inset_0_0_0_1px_var(--border)] transition-[box-shadow,color] duration-150 hover:text-muted-foreground hover:shadow-[inset_0_0_0_1px_var(--border-strong)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none lg:inline-flex"
          >
            <Search size={15} strokeWidth={2} aria-hidden />
            <span className="truncate">Search {toolCount} tools</span>
            <span className="ml-auto flex gap-1" aria-hidden>
              <Kbd>⌘</Kbd>
              <Kbd>K</Kbd>
            </span>
          </Button>
          <IconButton label="Search tools" size="lg" variant="ghost" className="lg:hidden" onClick={() => openCommandK()}>
            <Search size={17} strokeWidth={1.9} />
          </IconButton>
          <a
            href={GITHUB_URL}
            aria-label="Benchline on GitHub"
            className="ki-trigger hidden size-10 place-items-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-sunken hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:grid"
          >
            <GithubLogo size={18} />
          </a>
          <ThemeToggle />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              className="grid size-10 place-items-center rounded-md text-foreground hover:bg-sunken focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none md:hidden"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
            >
              <Menu size={19} strokeWidth={1.9} />
            </SheetTrigger>
            <SheetContent side="right" className="w-full bg-background p-5 data-[side=right]:w-full data-[side=right]:sm:max-w-sm">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <Logo />
              <nav className="mt-6 flex flex-col" aria-label="Mobile">
                {links.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    aria-current={link.match(path) ? "page" : undefined}
                    className="flex h-14 items-center border-b border-border text-[22px] font-semibold tracking-[-0.03em] aria-[current=page]:text-brand-text"
                  >
                    {link.label}
                  </Link>
                ))}
                <a href={GITHUB_URL} className="flex h-14 items-center justify-between border-b border-border text-[22px] font-semibold tracking-[-0.03em]">
                  GitHub
                  <ArrowUpRight size={20} aria-hidden />
                </a>
              </nav>
              <Button
                type="button"
                variant="primary"
                onClick={() => {
                  setOpen(false);
                  openCommandK();
                }}
                className="mt-auto inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-brand text-[15px] font-semibold text-brand-foreground"
              >
                <Search size={17} aria-hidden />
                Search {toolCount} tools
              </Button>
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
