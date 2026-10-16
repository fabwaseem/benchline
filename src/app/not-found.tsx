import type { Metadata } from "next";
import Link from "next/link";
import { tools } from "@/registry";

export const metadata: Metadata = {
  title: "Not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  const popular = tools.slice(0, 4);
  return (
    <div className="page-x grid min-h-[70vh] place-items-center py-20">
      <div className="w-full max-w-[640px] text-center">
        <div className="mx-auto grid size-16 place-items-center" aria-hidden>
          <svg width="56" height="40" viewBox="0 0 56 40" fill="none">
            <rect x="2" y="22" width="36" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <rect x="28" y="6" width="22" height="14" rx="3" fill="var(--accent-brand)" opacity="0.9" />
          </svg>
        </div>
        <p className="mt-6 font-mono text-[12px] text-faint">404</p>
        <h1 className="d2 mt-2">That tool isn&apos;t on the bench.</h1>
        <p className="mx-auto mt-3 max-w-[46ch] text-[16px] text-muted-foreground">
          The address does not match a tool, a category, or a tag. Search the directory, or start from one of these.
        </p>
        <Link href="/search" className="btn btn-brand btn-lg mt-6">
          Search the bench
        </Link>
        <ul className="mt-8 grid gap-2 text-left sm:grid-cols-2">
          {popular.map((tool) => (
            <li key={tool.slug}>
              <Link href={`/t/${tool.slug}`} className="card block px-4 py-3 hover:border-strong">
                <span className="text-[14.5px] font-medium">{tool.name}</span>
                <span className="mt-0.5 block font-mono text-[11px] text-faint">{tool.category}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
