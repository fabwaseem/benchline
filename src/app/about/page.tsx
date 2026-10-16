import type { Metadata } from "next";
import Link from "next/link";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description: "Toolsmith is a light workbench of developer instruments that run in the browser.",
  alternates: { canonical: "/about" },
  openGraph: { url: absoluteUrl("/about") },
};

export default function AboutPage() {
  return (
    <article className="mx-auto flex max-w-2xl flex-col gap-6">
      <header>
        <p className="text-xs font-medium tracking-[0.16em] text-primary uppercase">About</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">A bench, not a dashboard.</h1>
      </header>
      <p className="text-sm text-muted-foreground sm:text-base">
        Toolsmith is a directory of small instruments for AI search, SEO, auth debugging, and shipping Next.js. Generators stay in the browser. Checkers fetch only the public URL you submit, with a short timeout and a hard stop on private addresses.
      </p>
      <p className="text-sm text-muted-foreground sm:text-base">
        Built by Waseem Anjum. The portfolio lives at{" "}
        <a className="text-foreground underline-offset-4 hover:underline" href="https://www.fabwaseem.com">
          fabwaseem.com
        </a>
        . Source for this bench is on{" "}
        <a className="text-foreground underline-offset-4 hover:underline" href="https://github.com/fabwaseem/fabwaseem-tools">
          GitHub
        </a>
        .
      </p>
      <p className="text-sm">
        <Link href="/" className="text-primary hover:underline">
          Back to the directory
        </Link>
      </p>
    </article>
  );
}
