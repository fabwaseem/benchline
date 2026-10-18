"use client";

import { useEffect, useRef, type ReactNode } from "react";
import {
  activeToolSlug,
  bindRunListener,
  deviceClass,
  heuristicSuppressed,
  markToolSlug,
  sendTrack,
  type ClientRun,
} from "@/lib/analytics/browser";

const SKIP = /\b(copy|download|clear|sample|cancel|close|reset)\b/;

function label(element: Element): string {
  return `${element.getAttribute("aria-label") ?? ""} ${element.textContent ?? ""}`.replace(/\s+/g, " ").trim().toLowerCase();
}

function inputBytes(root: HTMLElement): number {
  let total = 0;
  for (const field of root.querySelectorAll("input, textarea")) {
    if (field instanceof HTMLInputElement && field.type === "file" && field.files) {
      for (const file of field.files) total += file.size;
      continue;
    }
    if (field instanceof HTMLInputElement && (field.type === "password" || field.type === "hidden")) continue;
    if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
      total += new TextEncoder().encode(field.value).length;
    }
    if (total > 100_000_000) return 100_000_000;
  }
  return total;
}

export function ToolBeacon({ slug, children }: { slug: string; children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    markToolSlug(slug);
    sendTrack({
      type: "tool_open",
      slug,
      referrer: document.referrer,
      deviceClass: deviceClass(),
    });
    const stopRuns = bindRunListener((event: ClientRun) => {
      sendTrack({
        type: "run",
        slug: event.slug ?? slug,
        outcome: event.outcome,
        errorCode: event.errorCode ?? null,
        durationMs: event.durationMs ?? null,
        inputBytes: event.inputBytes ?? null,
        outputBytes: event.outputBytes ?? null,
      });
    });
    const root = rootRef.current;
    let timer = 0;
    let started = 0;
    function arm(event: Event) {
      if (!root || heuristicSuppressed()) return;
      const target = event.target;
      if (!(target instanceof Element) || !root.contains(target)) return;
      const control = target.closest("button, a, [role='button']");
      if (control && SKIP.test(label(control))) return;
      if (!started) started = performance.now();
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const failed = Boolean(root.querySelector("[role='alert']"));
        sendTrack({
          type: "run",
          slug,
          outcome: failed ? "error" : "ok",
          errorCode: failed ? "ui" : null,
          durationMs: Math.max(0, Math.round(performance.now() - started)),
          inputBytes: inputBytes(root),
        });
        started = 0;
      }, 900);
    }
    const types = ["input", "change", "drop", "click"] as const;
    if (root) {
      for (const type of types) root.addEventListener(type, arm);
    }
    return () => {
      stopRuns();
      if (root) {
        for (const type of types) root.removeEventListener(type, arm);
      }
      window.clearTimeout(timer);
      if (activeToolSlug() === slug) markToolSlug(null);
    };
  }, [slug]);

  return (
    <div ref={rootRef} className="contents">
      {children}
    </div>
  );
}
