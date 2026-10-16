"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { SearchRecord } from "@/registry/schema";

const CommandK = dynamic(() => import("@/components/site/command-k").then((mod) => mod.CommandK), {
  ssr: false,
});

const Toaster = dynamic(() => import("@/components/ui/sonner").then((mod) => mod.Toaster), {
  ssr: false,
});

export function DeferredChrome({ tools }: { tools: SearchRecord[] }) {
  const [palette, setPalette] = useState(false);
  const [toasts, setToasts] = useState(false);

  useEffect(() => {
    const open = () => setPalette(true);
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPalette(true);
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("benchline:command", open);
    let idleHandle = 0;
    const arm = () => {
      const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 2000));
      idleHandle = idle(() => setToasts(true), { timeout: 2500 });
    };
    if (document.readyState === "complete") arm();
    else window.addEventListener("load", arm, { once: true });
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("benchline:command", open);
      window.removeEventListener("load", arm);
      (window.cancelIdleCallback ?? window.clearTimeout)(idleHandle);
    };
  }, []);

  return (
    <>
      {palette ? <CommandK tools={tools} startOpen /> : null}
      {toasts ? <Toaster /> : null}
    </>
  );
}
