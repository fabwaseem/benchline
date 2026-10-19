"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/kit/primitives/button";
import { Input } from "@/components/kit/primitives/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/kit/primitives/table";
import { EmptyState } from "@/components/kit/empty-state";
import { formatMs, formatWhen } from "@/lib/admin/format";
import type { LiveEvent } from "@/lib/admin/types";
import { cn } from "@/lib/utils";

const sources = ["", "web", "mcp", "api"] as const;
const outcomes = ["", "ok", "error", "rejected"] as const;

export function LiveBoard({ events }: { events: LiveEvent[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [paused, setPaused] = useState(false);
  const [tool, setTool] = useState(params.get("slug") ?? "");

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => router.refresh(), 5000);
    return () => window.clearInterval(id);
  }, [paused, router]);

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    const query = next.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="flex flex-wrap gap-1" role="group" aria-label="Source">
          {sources.map((source) => {
            const on = (params.get("source") ?? "") === source;
            return (
              <Button key={source || "all"} type="button" size="sm" variant={on ? "primary" : "outline"} onClick={() => setParam("source", source)}>
                {source || "All sources"}
              </Button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-1" role="group" aria-label="Outcome">
          {outcomes.map((outcome) => {
            const on = (params.get("outcome") ?? "") === outcome;
            return (
              <Button key={outcome || "any"} type="button" size="sm" variant={on ? "primary" : "outline"} onClick={() => setParam("outcome", outcome)}>
                {outcome || "Any outcome"}
              </Button>
            );
          })}
        </div>
        <form
          className="flex min-w-0 flex-1 gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            setParam("slug", tool.trim());
          }}
        >
          <Input value={tool} onChange={(event) => setTool(event.target.value)} placeholder="Tool slug" aria-label="Tool slug" />
          <Button type="submit" variant="outline" size="sm">
            Filter
          </Button>
        </form>
        <Button type="button" variant="ghost" size="sm" aria-pressed={paused} onClick={() => setPaused((value) => !value)}>
          {paused ? "Resume" : "Pause"}
        </Button>
      </div>
      {events.length === 0 ? (
        <EmptyState title="No events in the last 24 hours" hint="Runs show up here a few seconds after they finish." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Tool</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Outcome</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Client</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event.id || `${event.ts}-${event.slug}`}>
                <TableCell className="font-mono text-[12px] whitespace-nowrap text-muted-foreground">{formatWhen(event.ts)} UTC</TableCell>
                <TableCell className="font-medium">{event.slug}</TableCell>
                <TableCell className="font-mono text-[12px]">{event.source}</TableCell>
                <TableCell className={cn("font-mono text-[12px]", event.outcome === "error" && "text-status-bad", event.outcome === "ok" && "text-status-ok")}>
                  {event.outcome}
                  {event.errorCode ? ` · ${event.errorCode}` : ""}
                </TableCell>
                <TableCell className="font-mono tabular-nums">{formatMs(event.durationMs)}</TableCell>
                <TableCell className="font-mono text-[12px]">{event.country ?? "—"}</TableCell>
                <TableCell className="text-[12px] text-muted-foreground">
                  {event.client ? `${event.client}${event.version ? ` ${event.version}` : ""}` : "—"}
                  {event.host ? <span className="block font-mono text-[11px] text-faint">{event.host}</span> : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
