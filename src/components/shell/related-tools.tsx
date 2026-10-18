import Link from "next/link";
import { Cover } from "@/components/site/cover";
import type { ToolMeta } from "@/registry/schema";

export function RelatedTools({
  tools,
  hues,
}: {
  tools: ToolMeta[];
  hues: Record<string, number>;
}) {
  if (tools.length === 0) return null;
  return (
    <section>
      <h2 className="font-mono text-[11px] tracking-[0.08em] text-faint uppercase">Related tools</h2>
      <ul className="mt-2 overflow-hidden rounded-xl border border-border bg-surface">
        {tools.map((tool) => (
          <li key={tool.slug} className="border-b border-border last:border-b-0">
            <Link href={`/t/${tool.slug}`} className="flex items-center gap-2.5 px-3 py-2.5 text-[13.5px] transition-colors duration-150 hover:bg-sunken focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
              <Cover hue={hues[tool.category] ?? 30} icon={tool.icon} size={28} />
              <span className="min-w-0 truncate">{tool.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
