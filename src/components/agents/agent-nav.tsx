import Link from "next/link";
import { ArrowUpRight } from "kineticons";
import { cn } from "@/lib/utils";

const pages = [
  { href: "/mcp/guide", label: "Setup", key: "setup" },
  { href: "/ai", label: "Tool reference", key: "reference" },
] as const;

const files = [
  { href: "/llms.txt", label: "llms.txt" },
  { href: "/openapi.json", label: "OpenAPI" },
];

/** The sub-nav shared by every agent page, so Setup and the tool reference always link to each other. */
export function AgentNav({ active }: { active: (typeof pages)[number]["key"] }) {
  return (
    <nav aria-label="Agent docs" className="sticky top-15 z-30 border-b border-border bg-[color-mix(in_srgb,var(--background)_88%,transparent)] backdrop-blur-md">
      <div className="page-x frame flex items-center gap-1 overflow-x-auto py-2">
        {pages.map((page) => {
          const on = page.key === active;
          return (
            <Link
              key={page.key}
              href={page.href}
              aria-current={on ? "page" : undefined}
              className={cn(
                "inline-flex h-control-md shrink-0 items-center rounded-md px-3.5 text-[13.5px] font-medium text-muted-foreground transition-colors hover:bg-sunken hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                on && "bg-brand text-brand-foreground hover:bg-brand hover:text-brand-foreground",
              )}
            >
              {page.label}
            </Link>
          );
        })}
        <span aria-hidden className="mx-2 h-5 w-px shrink-0 bg-border" />
        {files.map((file) => (
          <a
            key={file.href}
            href={file.href}
            className="ki-trigger inline-flex h-control-md shrink-0 items-center gap-1 rounded-md px-3 font-mono text-[12.5px] text-muted-foreground transition-colors hover:bg-sunken hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            {file.label}
            <ArrowUpRight size={13} aria-hidden />
          </a>
        ))}
      </div>
    </nav>
  );
}
