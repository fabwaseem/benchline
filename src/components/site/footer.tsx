import Link from "next/link";
import { Logo } from "@/components/site/logo";
import { GITHUB_URL, MAKER_URL } from "@/lib/site";
import { categories, tools } from "@/registry";

export function Footer() {
  const featured = tools.slice(0, 5);
  return (
    <footer className="relative overflow-hidden border-t border-border">
      <div className="page-x pt-12 pb-7 min-[700px]:pt-[72px] min-[700px]:pb-10">
      <div className="grid gap-8 min-[700px]:grid-cols-[1.6fr_repeat(4,1fr)]">
        <div>
          <Logo />
          <p className="mt-4 max-w-[30ch] text-[13.5px] text-muted-foreground">
            Exact tools for people who ship the web. Free, no signup, nothing hidden.
          </p>
          <div className="mt-5">
            <span className="chip">
              <span className="dot" />
              All tools operational
            </span>
          </div>
        </div>
        <div>
          <b className="mb-3.5 block text-[13px] font-medium">Tools</b>
          <Link href="/explore" className="mt-2 block text-[13.5px] text-muted-foreground">Explore</Link>
          {featured.map((tool) => (
            <Link key={tool.slug} href={`/t/${tool.slug}`} className="mt-2 block text-[13.5px] text-muted-foreground">
              {tool.name}
            </Link>
          ))}
        </div>
        <div>
          <b className="mb-3.5 block text-[13px] font-medium">Categories</b>
          <Link href="/categories" className="mt-2 block text-[13.5px] text-muted-foreground">All categories</Link>
          {categories.slice(0, 5).map((category) => (
            <Link key={category.slug} href={`/${category.slug}`} className="mt-2 block text-[13.5px] text-muted-foreground">
              {category.name}
            </Link>
          ))}
        </div>
        <div>
          <b className="mb-3.5 block text-[13px] font-medium">Resources</b>
          <Link href="/ai" className="mt-2 block text-[13.5px] text-muted-foreground">AI access</Link>
          <Link href="/llms.txt" className="mt-2 block text-[13.5px] text-muted-foreground">llms.txt</Link>
          <Link href="/llms-full.txt" className="mt-2 block text-[13.5px] text-muted-foreground">llms-full.txt</Link>
          <Link href="/openapi.json" className="mt-2 block text-[13.5px] text-muted-foreground">OpenAPI</Link>
          <Link href="/sitemap.xml" className="mt-2 block text-[13.5px] text-muted-foreground">Sitemap</Link>
        </div>
        <div>
          <b className="mb-3.5 block text-[13px] font-medium">Benchline</b>
          <Link href="/about" className="mt-2 block text-[13.5px] text-muted-foreground">About</Link>
          <Link href="/about#data" className="mt-2 block text-[13.5px] text-muted-foreground">Privacy</Link>
          <a href={GITHUB_URL} className="mt-2 block text-[13.5px] text-muted-foreground">GitHub</a>
          <a href={MAKER_URL} className="mt-2 block text-[13.5px] text-muted-foreground">fabwaseem.com</a>
        </div>
      </div>
      <div className="wm" aria-hidden>benchline</div>
      <div className="mt-7 flex flex-col gap-1.5 border-t border-border pt-5 text-[12.5px] text-faint min-[700px]:flex-row min-[700px]:items-center min-[700px]:justify-between">
        <span>© 2026 Benchline · Made by Waseem Anjum</span>
        <span className="font-mono">0 trackers · 0 bytes stored</span>
      </div>
      </div>
    </footer>
  );
}
