const BOT =
  /bot\b|crawler|spider|slurp|facebookexternalhit|embedly|quora link preview|pinterest|whatsapp|telegrambot|slackbot|headlesschrome|lighthouse|pagespeed|pingdom|uptimerobot|semrush|ahrefs|petalbot|bytespider|gptbot|claudebot|amazonbot|bingpreview|duckduckbot|baiduspider|yandex|sogou|ia_archiver|applebot/i;

export function isBotUserAgent(userAgent: string | null | undefined): boolean {
  if (!userAgent) return false;
  return BOT.test(userAgent);
}

export function isPrefetch(headers: { get(name: string): string | null }): boolean {
  const purpose = `${headers.get("purpose") ?? ""} ${headers.get("sec-purpose") ?? ""} ${headers.get("x-purpose") ?? ""} ${headers.get("x-moz") ?? ""}`;
  return /prefetch|preview/i.test(purpose);
}
