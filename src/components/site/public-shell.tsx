import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/top-bar";
import { AnalyticsListener } from "@/components/site/analytics-listener";
import { DeferredChrome } from "@/components/site/deferred-chrome";
import { Footer } from "@/components/site/footer";
import { JsonLd, websiteNode } from "@/lib/jsonld";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { searchRecords } from "@/registry";

export function PublicShell({ children }: { children: ReactNode }) {
  const records = searchRecords();
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            websiteNode(),
            {
              "@type": "Organization",
              "@id": `${SITE_URL}#organization`,
              name: SITE_NAME,
              url: SITE_URL,
              logo: `${SITE_URL}/app-icon-512.png`,
            },
          ],
        }}
      />
      <AnalyticsListener />
      <AppShell toolCount={records.length}>{children}</AppShell>
      <Footer />
      <DeferredChrome tools={records} />
    </>
  );
}
