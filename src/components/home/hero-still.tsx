const frame = "h-auto w-[320px] opacity-30 min-[700px]:w-[360px]";

export function HeroStill() {
  return (
    <div className="absolute inset-0 grid place-items-center min-[700px]:justify-end min-[700px]:pr-[12%]" aria-hidden>
      {/* Static AVIF so the preload is one URL with fetchpriority, which next/image does not set. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/hero/bench-still.avif"
        alt=""
        width={640}
        height={640}
        fetchPriority="high"
        decoding="async"
        className={`${frame} dark:hidden`}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/hero/bench-still-dark.avif"
        alt=""
        width={640}
        height={640}
        loading="lazy"
        decoding="async"
        className={`${frame} hidden dark:block`}
      />
    </div>
  );
}
