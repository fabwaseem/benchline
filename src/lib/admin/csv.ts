import { unparse } from "papaparse";

export function toCsv(rows: Record<string, string | number | null>[]): string {
  return unparse(rows);
}

export function csvResponse(filename: string, rows: Record<string, string | number | null>[]): Response {
  return new Response(toCsv(rows), {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "private, no-store",
      "x-robots-tag": "noindex, nofollow",
    },
  });
}
