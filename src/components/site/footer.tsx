import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-semibold tracking-tight text-foreground">Toolsmith</p>
          <p className="mt-1 max-w-md">Precise instruments for AI search, SEO, and shipping Next.js.</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <Link href="/about" className="hover:text-foreground">
            About
          </Link>
          <a href="https://www.fabwaseem.com" className="hover:text-foreground">
            fabwaseem.com
          </a>
          <a href="https://github.com/fabwaseem" className="hover:text-foreground">
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
