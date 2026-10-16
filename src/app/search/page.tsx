import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchView } from "@/components/site/search-view";

export const metadata: Metadata = {
  title: "Search",
  robots: { index: false, follow: true },
  alternates: { canonical: "/search" },
};

export default function SearchPage() {
  return (
    <Suspense>
      <SearchView />
    </Suspense>
  );
}
