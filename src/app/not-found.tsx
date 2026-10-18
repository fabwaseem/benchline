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
    <div className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col justify-center px-4 py-16">
      <p className="font-mono text-[12px] tracking-[0.08em] text-faint uppercase">404</p>
      <h1 className="mt-2 text-[32px] font-semibold tracking-[-0.045em]">That page is not in the directory.</h1>
      <p className="mt-3 text-[15px] leading-6 text-muted-foreground">
        The address does not match a tool, a category, or a tag.
      </p>
      <Link href="/" className="btn btn-accent mt-6 self-start">
        Browse tools
      </Link>
      <ul className="mt-8 grid gap-2 sm:grid-cols-2">
        {popular.map((tool) => (
          <li key={tool.slug}>
            <Link href={`/t/${tool.slug}`} className="block rounded-xl border border-border bg-surface px-4 py-3 transition-colors duration-150 hover:border-border-strong">
              <span className="text-[14.5px] font-medium">{tool.name}</span>
              <span className="mt-0.5 block font-mono text-[11px] text-faint">{tool.category}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
