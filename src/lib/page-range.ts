/** 1-based page numbers, in the order written, with duplicates removed. An empty string means every page. */
export function parsePageSelection(input: string, pageCount: number): number[] {
  if (pageCount < 1) throw new Error("This PDF has no pages.");
  const text = input.trim();
  if (!text) return Array.from({ length: pageCount }, (_, index) => index + 1);
  const parts = text.split(",").map((part) => part.trim()).filter(Boolean);
  if (parts.length === 0) throw new Error("Name at least one page, such as 1-3,5.");
  const pages: number[] = [];
  const seen = new Set<number>();
  for (const part of parts) {
    const range = /^(\d+)\s*-\s*(\d+)$/.exec(part);
    const single = /^(\d+)$/.exec(part);
    if (range) {
      const start = Number(range[1]);
      const end = Number(range[2]);
      assertPage(start, pageCount);
      assertPage(end, pageCount);
      if (end < start) throw new Error(`Range ${start}-${end} is reversed. Write the lower page first.`);
      for (let page = start; page <= end; page += 1) push(pages, seen, page);
    } else if (single) {
      const page = Number(single[1]);
      assertPage(page, pageCount);
      push(pages, seen, page);
    } else {
      throw new Error(`"${part}" is not a page or a range. Use 1-3,5.`);
    }
  }
  if (pages.length === 0) throw new Error("Pick at least one page.");
  return pages;
}

function assertPage(page: number, pageCount: number) {
  if (page < 1) throw new Error("Pages start at 1.");
  if (page > pageCount) throw new Error(`This PDF has ${pageCount} ${pageCount === 1 ? "page" : "pages"}.`);
}

function push(pages: number[], seen: Set<number>, page: number) {
  if (seen.has(page)) return;
  seen.add(page);
  pages.push(page);
}
