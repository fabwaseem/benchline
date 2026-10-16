import Link from "next/link";
import { OpenSearch } from "@/components/site/open-search";
import { ThemeToggle } from "@/components/site/theme-toggle";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-card focus:px-2 focus:py-1">
        Skip to content
      </a>
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="relative size-4 rounded-[3px] bg-primary" aria-hidden>
            <span className="absolute top-0 right-0 size-1.5 bg-background" />
          </span>
          Toolsmith
        </Link>
        <nav className="ml-4 hidden items-center gap-4 text-sm text-muted-foreground sm:flex">
          <Link href="/" className="hover:text-foreground">
            Directory
          </Link>
          <Link href="/ai-search" className="hover:text-foreground">
            AI search
          </Link>
          <Link href="/about" className="hover:text-foreground">
            About
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <OpenSearch />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
