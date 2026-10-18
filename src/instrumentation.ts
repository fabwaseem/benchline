export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") return;
  const { startAnalytics } = await import("./lib/analytics/startup");
  await startAnalytics();
}
