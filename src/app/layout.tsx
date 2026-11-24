import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Urbanist } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { FOUNDER } from "@/lib/founder";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

const urbanist = Urbanist({
  variable: "--font-urbanist",
  subsets: ["latin"],
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
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
  authors: [{ name: FOUNDER.name, url: FOUNDER.url }],
  creator: FOUNDER.name,
  publisher: SITE_NAME,
  keywords: ["free online tools", "browser tools", "developer tools", "PDF tools", "image tools", "JSON tools", "SEO tools", "MCP server", "AI agent tools"],
  category: "technology",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
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
    creator: FOUNDER.twitter,
    title: `${SITE_NAME} — free browser tools`,
    description,
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F2F4ED" },
    { media: "(prefers-color-scheme: dark)", color: "#0A0A0A" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${urbanist.variable} ${jetbrains.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
