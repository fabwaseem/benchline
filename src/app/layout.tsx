import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { CommandK } from "@/components/site/command-k";
import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { JsonLd, websiteNode } from "@/lib/jsonld";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { searchRecords } from "@/registry";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const description =
  "A precise bench of developer tools for AI search, SEO, tokens, and shipping Next.js.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — developer tools`,
    template: `%s · ${SITE_NAME}`,
  },
  description,
  applicationName: SITE_NAME,
  authors: [{ name: "Waseem Anjum", url: "https://www.fabwaseem.com" }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — developer tools`,
    description,
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — developer tools`,
    description,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
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
                  founder: { "@type": "Person", name: "Waseem Anjum", url: "https://www.fabwaseem.com" },
                },
              ],
            }}
          />
          <Header />
          <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
            {children}
          </main>
          <Footer />
          <CommandK tools={searchRecords()} />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
