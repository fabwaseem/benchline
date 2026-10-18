"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

function subscribe() {
  return () => {};
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const dark = mounted && resolvedTheme === "dark";
  return (
    <button
      type="button"
      className="btn-ghost btn size-9 px-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      aria-label={dark ? "Switch to light" : "Switch to dark"}
      onClick={() => {
        const next = dark ? "light" : "dark";
        const apply = () => setTheme(next);
        if (typeof document !== "undefined" && "startViewTransition" in document && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          document.startViewTransition(apply);
          return;
        }
        apply();
      }}
    >
      {dark ? <Sun size={16} strokeWidth={1.75} /> : <Moon size={16} strokeWidth={1.75} />}
    </button>
  );
}
