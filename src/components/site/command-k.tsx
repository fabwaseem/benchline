"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Cover } from "@/components/site/cover";
import { classifyPaste, stagePaste, type PasteKind } from "@/lib/paste";
import type { SearchRecord } from "@/registry/schema";
import { categories } from "@/registry/categories";

const hueFor = new Map<string, number>(categories.map((category) => [category.slug, category.hue]));
const nameFor = new Map<string, string>(categories.map((category) => [category.slug, category.name]));

export function CommandK({ tools, startOpen = false }: { tools: SearchRecord[]; startOpen?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(startOpen);
  const [query, setQuery] = useState("");
  const paste = useMemo(() => classifyPaste(query), [query]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("benchline:command", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("benchline:command", onOpen);
    };
  }, []);

  useEffect(() => {
    document.body.dataset.palette = open ? "open" : "";
    return () => {
      document.body.dataset.palette = "";
    };
  }, [open]);

  function go(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  function openPaste(kind: PasteKind) {
    stagePaste(kind, query.trim());
    if (kind === "jwt") go("/t/jwt-decoder");
    else if (kind === "cron") go("/t/cron-expression-builder");
    else if (kind === "url") go("/t/meta-tags-inspector");
    else go("/t/schema-generator");
  }

  const tags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const tool of tools) {
      for (const tag of tool.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
    return [...counts.keys()].sort();
  }, [tools]);

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Search tools"
      description="Search tools, categories, and tags"
      className="top-[12vh] w-[min(680px,calc(100%-1.5rem))] translate-y-0 border-0 bg-[var(--glass)] p-0 shadow-[var(--in-hi),0_0_0_1px_var(--glass-border),var(--shadow-3)] backdrop-blur-[20px] sm:max-w-[680px]"
    >
      <Command className="bg-transparent" shouldFilter>
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder="Search tools, or paste a JWT, cron, URL, or JSON"
          className="h-12 text-[15px]"
        />
        <CommandList className="max-h-[360px]">
          <CommandEmpty>No match on the bench.</CommandEmpty>
          {paste ? (
            <CommandGroup heading="Paste" className="**:[[cmdk-group-heading]]:font-mono **:[[cmdk-group-heading]]:text-[11px] **:[[cmdk-group-heading]]:tracking-[0.08em] **:[[cmdk-group-heading]]:uppercase">
              <CommandItem value={`paste ${paste} ${query}`} onSelect={() => openPaste(paste)}>
                <span className="font-medium">Open this {paste === "jwt" ? "token" : paste} in the matching tool</span>
              </CommandItem>
            </CommandGroup>
          ) : null}
          <CommandGroup heading="Tools" className="**:[[cmdk-group-heading]]:font-mono **:[[cmdk-group-heading]]:text-[11px] **:[[cmdk-group-heading]]:tracking-[0.08em] **:[[cmdk-group-heading]]:uppercase">
            {tools.map((tool) => (
              <CommandItem
                key={tool.slug}
                value={`${tool.name} ${tool.tagline} ${tool.tags.join(" ")} ${tool.keywords.join(" ")}`}
                onSelect={() => go(`/t/${tool.slug}`)}
              >
                <Cover hue={hueFor.get(tool.category) ?? 200} icon={tool.icon} size={24} />
                <span className="min-w-0 flex-1 truncate font-medium">{tool.name}</span>
                <span className="hidden font-mono text-[11.5px] text-faint sm:inline">{nameFor.get(tool.category)}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Categories" className="**:[[cmdk-group-heading]]:font-mono **:[[cmdk-group-heading]]:text-[11px] **:[[cmdk-group-heading]]:tracking-[0.08em] **:[[cmdk-group-heading]]:uppercase">
            {categories.map((category) => (
              <CommandItem key={category.slug} value={`category ${category.name} ${category.description}`} onSelect={() => go(`/${category.slug}`)}>
                <Cover hue={category.hue} icon={category.icon} size={24} />
                <span className="font-medium">{category.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Tags" className="**:[[cmdk-group-heading]]:font-mono **:[[cmdk-group-heading]]:text-[11px] **:[[cmdk-group-heading]]:tracking-[0.08em] **:[[cmdk-group-heading]]:uppercase">
            {tags.map((tag) => (
              <CommandItem key={tag} value={`tag ${tag}`} onSelect={() => go(`/tags/${tag}`)}>
                <span className="font-mono text-[12px] text-faint">#</span>
                <span>{tag}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
        <div className="flex gap-3 border-t border-border px-3 py-2 font-mono text-[11px] text-faint">
          <span className="keycap">↑</span>
          <span className="keycap">↓</span>
          <span>move</span>
          <span className="keycap">↵</span>
          <span>open</span>
          <span className="ml-auto keycap">esc</span>
        </div>
      </Command>
    </CommandDialog>
  );
}
