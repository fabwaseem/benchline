import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/top-bar";
import { AnalyticsListener } from "@/components/site/analytics-listener";
import { DeferredChrome } from "@/components/site/deferred-chrome";
import { Footer } from "@/components/site/footer";
import { GoogleAnalytics } from "@/components/site/google-analytics";
import { JsonLd, founderNode, organizationNode, websiteNode } from "@/lib/jsonld";
import { searchRecords } from "@/registry";

export function PublicShell({ children }: { children: ReactNode }) {
  const records = searchRecords();
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [websiteNode(), organizationNode(), founderNode()],
        }}
      />
      <GoogleAnalytics />
      <AnalyticsListener />
      <AppShell toolCount={records.length}>{children}</AppShell>
      <Footer />
      <DeferredChrome tools={records} />
    </>
  );
}
