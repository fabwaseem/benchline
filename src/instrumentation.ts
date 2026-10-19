export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") return;
  const { startAnalytics } = await import("./lib/analytics/startup");
  const { installGracefulShutdown } = await import("./lib/shutdown/install");
  await startAnalytics();
  installGracefulShutdown();
}
