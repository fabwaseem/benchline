/** How many leading tabs fit before the rest belong in a More menu. */
export function fitTabs(widths: number[], available: number, moreWidth: number, gap = 0): number {
  if (widths.length === 0 || available <= 0) return 0;
  const total = widths.reduce((sum, width) => sum + width, 0) + gap * Math.max(0, widths.length - 1);
  if (total <= available) return widths.length;
  let used = 0;
  let count = 0;
  for (const width of widths) {
    const next = used + (count > 0 ? gap : 0) + width;
    if (next + gap + moreWidth > available) break;
    used = next;
    count += 1;
  }
  return count;
}

/**
 * Indexes to render as tabs. When the selection would be hidden, it takes the
 * last visible slot so the current mode stays on the bar.
 */
export function visibleTabIndexes(
  widths: number[],
  available: number,
  moreWidth: number,
  gap: number,
  selectedIndex: number,
): number[] {
  const count = fitTabs(widths, available, moreWidth, gap);
  if (count >= widths.length) return widths.map((_, index) => index);
  const indexes = Array.from({ length: count }, (_, index) => index);
  if (selectedIndex >= count && selectedIndex < widths.length && indexes.length > 0) {
    indexes[indexes.length - 1] = selectedIndex;
  }
  return indexes;
}
