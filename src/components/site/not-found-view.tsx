import Link from "next/link";
import { ArrowRight } from "kineticons";
import { tools } from "@/registry";

export function NotFoundView() {
  const popular = tools.slice(0, 4);
  return (
    <div className="relative isolate overflow-hidden">
      <div aria-hidden className="ground-grid absolute inset-0 -z-10 [mask-image:radial-gradient(60%_70%_at_50%_40%,#000_10%,transparent_75%)]" />
      <div data-enter className="mx-auto flex min-h-[72vh] w-full max-w-2xl flex-col justify-center px-4 py-20">
        <p className="font-mono text-[13px] font-medium text-brand-text">404</p>
        <h1 className="d2 mt-4">That page is not on the bench.</h1>
        <p className="mt-4 max-w-[48ch] text-[16px] leading-7 text-muted-foreground">
          The address does not match a tool, a category, or a tag. These four are where most people start.
        </p>
        <ul className="mt-8 grid gap-2 sm:grid-cols-2">
          {popular.map((tool) => (
            <li key={tool.slug}>
              <Link
                href={`/t/${tool.slug}`}
                className="ki-trigger lift group flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <span className="text-[14.5px] font-semibold tracking-[-0.01em]">{tool.name}</span>
                <ArrowRight size={15} aria-hidden className="text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-brand-text" />
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/tools" className="btn btn-brand mt-8 self-start">
          Browse all tools
        </Link>
      </div>
    </div>
  );
}
