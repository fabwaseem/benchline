import { fetchExchange } from "@/lib/net/exchange";
import { gradeHeaders } from "@/tools/http-headers-checker/lib/headers";

export async function checkHeaders(input: string) {
  const response = await fetchExchange(input, { readBody: false, accept: "*/*" });
  const graded = gradeHeaders(response.headers, response.url);
  return {
    finalUrl: response.url,
    status: response.status,
    redirects: response.redirects,
    headers: response.headers,
    grade: graded.grade,
    checks: graded.checks,
    elapsedMs: response.elapsedMs,
  };
}
