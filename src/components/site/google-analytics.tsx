import Script from "next/script";
import { gaBootstrap, gaId, gaScriptSrc } from "@/lib/analytics/ga";

/**
 * GA4 for public pages. The dataLayer queue is set up inline so early events
 * are kept; gtag.js itself loads after the window load event, out of the way
 * of LCP. Renders nothing when NEXT_PUBLIC_GA_ID is unset.
 */
export function GoogleAnalytics() {
  const id = gaId();
  if (!id) return null;
  return (
    <>
      <script id="google-analytics" dangerouslySetInnerHTML={{ __html: gaBootstrap(id) }} />
      <Script src={gaScriptSrc(id)} strategy="lazyOnload" />
    </>
  );
}
