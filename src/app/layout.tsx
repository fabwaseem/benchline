import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppShell } from "@/components/shell/top-bar";
import { AnalyticsListener } from "@/components/site/analytics-listener";
import { DeferredChrome } from "@/components/site/deferred-chrome";
import { Footer } from "@/components/site/footer";
import { ThemeProvider } from "@/components/theme-provider";
import { JsonLd, websiteNode } from "@/lib/jsonld";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { searchRecords } from "@/registry";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
  adjustFontFallback: true,
});

const description = "Free browser tools for PDF, images, JSON, security, and SEO. Search the directory, run a tool on your device, or call the same tool over MCP.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — free browser tools`,
    template: `%s · ${SITE_NAME}`,
  },
  description,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — free browser tools`,
    description,
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — free browser tools`,
    description,
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F6F4EF" },
    { media: "(prefers-color-scheme: dark)", color: "#141210" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <ThemeProvider>
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
          <AppShell toolCount={searchRecords().length}>{children}</AppShell>
          <Footer />
          <DeferredChrome tools={searchRecords()} />
        </ThemeProvider>
      </body>
    </html>
  );
}
