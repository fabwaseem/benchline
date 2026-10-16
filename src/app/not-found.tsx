import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-3 py-12">
      <p className="text-xs font-medium tracking-[0.16em] text-primary uppercase">404</p>
      <h1 className="text-3xl font-semibold tracking-tight">That instrument is not on the bench.</h1>
      <p className="text-sm text-muted-foreground">The page is missing, or the slug never made it into the registry.</p>
      <Link href="/" className="text-sm text-primary hover:underline">
        Back to the directory
      </Link>
    </div>
  );
}
