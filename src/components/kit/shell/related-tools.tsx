import { ToolCard } from "@/components/shell/tool-card";
import { SectionHeading } from "@/components/site/section-heading";
import type { DirectoryTool } from "@/lib/directory";

/** Four directory cards. The tool page has no side rail. */
export function RelatedTools({ tools }: { tools: DirectoryTool[] }) {
  if (tools.length === 0) return null;
  return (
    <section aria-labelledby="related-title">
      <SectionHeading id="related-title" eyebrow="Next" title="Related tools" />
      <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tools.slice(0, 4).map((tool) => (
          <li key={tool.slug} className="min-w-0">
            <ToolCard tool={tool} />
          </li>
        ))}
      </ul>
    </section>
  );
}
