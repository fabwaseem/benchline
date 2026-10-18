"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { activeToolSlug, deviceClass, sendTrack, toolSlugFromLocation } from "@/lib/analytics/browser";

function actionOf(element: Element): "copy" | "download" | null {
  const control = element.closest("button, a, [role='button']");
  if (!control) return null;
  const label = `${control.getAttribute("aria-label") ?? ""} ${control.textContent ?? ""}`.replace(/\s+/g, " ").toLowerCase();
  if (control.hasAttribute("download") || /\bdownload\b/.test(label)) return "download";
  if (/\bcopy\b/.test(label)) return "copy";
  return null;
}

export function AnalyticsListener() {
  const pathname = usePathname();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    sendTrack({
      type: "page",
      path: pathname,
      referrer: document.referrer,
      utmSource: params.get("utm_source"),
      utmMedium: params.get("utm_medium"),
      utmCampaign: params.get("utm_campaign"),
      utmTerm: params.get("utm_term"),
      utmContent: params.get("utm_content"),
      deviceClass: deviceClass(),
    });
  }, [pathname]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const action = actionOf(target);
      if (!action) return;
      const slug = activeToolSlug() ?? toolSlugFromLocation(window.location.pathname);
      sendTrack({ type: "action", action, slug });
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
