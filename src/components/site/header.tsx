"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search } from "lucide-react";
import { Button } from "@/components/kit/primitives/button";
import { IconButton } from "@/components/kit/primitives/icon-button";
import { Kbd } from "@/components/kit/kbd";
import { GithubMark } from "@/components/site/github-mark";
import { Logo } from "@/components/site/logo";
import { openCommandK } from "@/components/site/open-command";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { GITHUB_URL } from "@/lib/site";
import { categories } from "@/registry/categories";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Tools", match: (path: string) => path === "/" },
  { href: "/explore", label: "Explore", match: (path: string) => path === "/explore" },
  { href: "/categories", label: "Categories", match: (path: string) => path === "/categories" || categories.some((item) => path === `/${item.slug}`) },
];

export function Header() {
  const path = usePathname();
  return (
    <header className="site-header sticky top-0 z-40 border-b border-border glass">
      <div className="page-x flex h-[60px] items-center gap-3 min-[700px]:gap-7">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-surface focus:px-2 focus:py-1">
        Skip to content
      </a>
      <Logo />
      <nav className="hidden items-center gap-1 min-[700px]:flex">
        {links.map((link) => {
          const on = link.match(path);
          return (
            <Link
              key={link.label}
              href={link.href}
              className={cn("rounded-[7px] px-[11px] py-1.5 text-[13.5px] text-muted-foreground", on && "text-foreground")}
            >
              <span className={cn(on && "border-b-[1.5px] border-foreground pb-0.5")}>{link.label}</span>
            </Link>
          );
        })}
      </nav>
      <Button type="button" variant="secondary" className="ml-auto hidden h-control-md w-[300px] justify-start gap-2 px-3 font-normal text-faint min-[700px]:inline-flex" onClick={() => openCommandK()}>
        <Search size={14} strokeWidth={1.75} aria-hidden />
        <span>Search tools</span>
        <span className="ml-auto flex gap-0.5">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </span>
      </Button>
      <ThemeToggle />
      <a className="btn hidden h-[34px] min-[700px]:inline-flex" href={GITHUB_URL}>
        <GithubMark size={15} />
        GitHub
      </a>
      <IconButton label="Search" size="lg" variant="outline" className="min-[700px]:hidden" onClick={() => openCommandK()}>
        <Search size={16} strokeWidth={1.75} />
      </IconButton>
      <Sheet>
        <SheetTrigger className="btn size-9 px-0 min-[700px]:hidden" aria-label="Menu">
          <Menu size={16} strokeWidth={1.75} />
        </SheetTrigger>
        <SheetContent>
          <SheetTitle className="font-semibold tracking-tight">Benchline</SheetTitle>
          <nav className="mt-4 flex flex-col gap-1">
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
    </header>
  );
}
