/**
 * Google Analytics 4. Off unless NEXT_PUBLIC_GA_ID is set at build time, so
 * local dev and forks send nothing.
 */

const MEASUREMENT_ID = /^G-[A-Z0-9]{4,16}$/;

export function parseGaId(value: string | null | undefined): string | null {
  if (!value) return null;
  const id = value.trim().toUpperCase();
  return MEASUREMENT_ID.test(id) ? id : null;
}

export function gaId(): string | null {
  return parseGaId(process.env.NEXT_PUBLIC_GA_ID);
}

/** Inline queue: events sent before gtag.js loads are kept in dataLayer. */
export function gaBootstrap(id: string): string {
  return `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config',${JSON.stringify(id)});`;
}

export function gaScriptSrc(id: string): string {
  return `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
}

type Gtag = (command: "event", name: string, params: Record<string, string | number>) => void;

/** Send one GA4 event. A no-op when the tag is not on the page; never throws. */
export function gaEvent(name: string, params: Record<string, string | number> = {}) {
  if (typeof window === "undefined") return;
  const gtag = (window as unknown as { gtag?: Gtag }).gtag;
  if (typeof gtag !== "function") return;
  try {
    gtag("event", name, params);
  } catch {
    /* analytics must not break the tool */
  }
}
