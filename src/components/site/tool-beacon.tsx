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
import { isViewOnlyControl, stateFingerprint, usesRunHeuristic } from "@/lib/analytics/run-heuristic";

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

/** What the user has entered and chosen, as text parts. Hashed locally to tell whether anything changed; never sent. */
function stateParts(root: HTMLElement): string[] {
  const parts: string[] = [];
  for (const field of root.querySelectorAll("input, textarea, select")) {
    if (field instanceof HTMLInputElement) {
      if (field.type === "file") {
        for (const file of field.files ?? []) parts.push(`f:${file.name}:${file.size}`);
      } else if (field.type === "checkbox" || field.type === "radio") {
        parts.push(`c:${field.name}:${field.checked}`);
      } else {
        parts.push(`i:${field.value}`);
      }
    } else if (field instanceof HTMLTextAreaElement || field instanceof HTMLSelectElement) {
      parts.push(`t:${field.value}`);
    }
  }
  for (const control of root.querySelectorAll("[aria-pressed], [aria-checked], [data-pressed]")) {
    if (isViewOnlyControl(label(control), control.getAttribute("role"))) continue;
    const pressed = control.getAttribute("aria-pressed") ?? control.getAttribute("aria-checked") ?? (control.hasAttribute("data-pressed") ? "true" : "");
    parts.push(`p:${label(control)}:${pressed}`);
  }
  return parts;
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
    // Tools that report their own runs (postTool) are counted exactly; guessing on top of them double counts.
    const root = usesRunHeuristic(slug) ? rootRef.current : null;
    let timer = 0;
    let started = 0;
    // The last action button pressed is part of the state, so "Minify" after "Format" counts once and a repeat does not.
    let lastAction = "";
    const fingerprintNow = (element: HTMLElement) => stateFingerprint([...stateParts(element), `a:${lastAction}`]);
    let lastCounted = root ? fingerprintNow(root) : "";
    function arm(event: Event) {
      if (!root || heuristicSuppressed()) return;
      const target = event.target;
      if (!(target instanceof Element) || !root.contains(target)) return;
      const control = target.closest("button, a, [role='button'], [role='tab']");
      if (control && isViewOnlyControl(label(control), control.getAttribute("role"))) return;
      if (control && event.type === "click") lastAction = label(control);
      if (!started) started = performance.now();
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        // Count a run only when what the user entered or chose changed since the last counted run.
        const fingerprint = fingerprintNow(root);
        if (fingerprint === lastCounted) {
          started = 0;
          return;
        }
        lastCounted = fingerprint;
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
