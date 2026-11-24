import Link from "next/link";
import { Logo } from "@/components/site/logo";
import { FOUNDER } from "@/lib/founder";
import { GITHUB_URL } from "@/lib/site";
import { navEntries } from "@/lib/taxonomy";
import { tools } from "@/registry";

const linkClass = "u-draw mt-2.5 block w-fit text-[14px] text-muted-foreground transition-colors duration-150 hover:text-foreground focus-visible:text-foreground focus-visible:outline-none";

function Column({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-mono text-[11px] font-medium tracking-[0.1em] text-faint uppercase">{title}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export function Footer() {
  const featured = tools.filter((tool) => tool.status !== "new").slice(0, 5);
  const local = tools.filter((tool) => tool.runsLocally).length;
  return (
    <footer className="relative overflow-hidden border-t border-border bg-well">
      <div className="page-x frame relative pt-16 pb-8 md:pt-20">
        <div className="grid grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-4 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <Logo />
            <p className="mt-5 max-w-[32ch] text-[14.5px] leading-6 text-muted-foreground">
              {tools.length} tools for people who ship the web. {local} run entirely in your browser. No account, no upload.
            </p>
            <p className="mt-6 inline-flex items-center gap-2 font-mono text-[12px] text-faint">
              <span className="dot" aria-hidden />
              All tools operational
            </p>
          </div>
          <Column title="Tools">
            <Link href="/tools" className={linkClass}>All tools</Link>
            {featured.map((tool) => (
              <Link key={tool.slug} href={`/t/${tool.slug}`} className={linkClass}>
                {tool.name}
              </Link>
            ))}
          </Column>
          <Column title="Categories">
            <Link href="/categories" className={linkClass}>All categories</Link>
            {navEntries().slice(0, 5).map((category) => (
              <Link key={category.slug} href={`/${category.slug}`} className={linkClass}>
                {category.name}
              </Link>
            ))}
          </Column>
          <Column title="For agents">
            <Link href="/mcp/guide" className={linkClass}>MCP setup</Link>
            <Link href="/ai" className={linkClass}>AI access</Link>
            <Link href="/llms.txt" className={linkClass}>llms.txt</Link>
            <Link href="/llms-full.txt" className={linkClass}>llms-full.txt</Link>
            <Link href="/openapi.json" className={linkClass}>OpenAPI</Link>
          </Column>
          <Column title="Benchline">
            <Link href="/about" className={linkClass}>About</Link>
            <Link href="/about#founder" className={linkClass}>Founder</Link>
            <Link href="/about#data" className={linkClass}>Privacy</Link>
            <a href={GITHUB_URL} className={linkClass}>GitHub</a>
            <Link href="/sitemap.xml" className={linkClass}>Sitemap</Link>
          </Column>
        </div>
        <p
          aria-hidden
          className="pointer-events-none mt-16 select-none text-center text-[22vw] leading-[0.78] font-semibold tracking-[-0.07em] text-transparent [-webkit-text-stroke:1px_var(--border-strong)] min-[1440px]:text-[310px]"
        >
          benchline
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6 text-[12.5px] text-faint">
          <span>
            © 2026 Benchline. Built by{" "}
            <a href={FOUNDER.url} rel="author" className="u-draw text-muted-foreground hover:text-foreground focus-visible:outline-none">
              {FOUNDER.name}
            </a>
            . MIT licensed.
          </span>
          <span className="font-mono">Built for the browser, callable over MCP.</span>
        </div>
      </div>
    </footer>
  );
}
