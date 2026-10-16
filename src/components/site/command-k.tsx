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
import { ToolIcon } from "@/components/site/icons";
import type { SearchRecord } from "@/registry/schema";

export function openCommandK() {
  window.dispatchEvent(new Event("toolsmith:command"));
}

export function CommandK({ tools }: { tools: SearchRecord[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const items = useMemo(() => tools, [tools]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("toolsmith:command", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("toolsmith:command", onOpen);
    };
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen} title="Search tools" description="Jump to an instrument">
      <Command>
        <CommandInput placeholder="Search tools" />
        <CommandList>
          <CommandEmpty>No tool matches.</CommandEmpty>
          <CommandGroup heading="Instruments">
            {items.map((tool) => (
              <CommandItem
                key={tool.slug}
                value={`${tool.name} ${tool.tagline} ${tool.tags.join(" ")} ${tool.keywords.join(" ")}`}
                onSelect={() => {
                  setOpen(false);
                  router.push(`/t/${tool.slug}`);
                }}
              >
                <ToolIcon name={tool.icon} />
                <span className="truncate">{tool.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
