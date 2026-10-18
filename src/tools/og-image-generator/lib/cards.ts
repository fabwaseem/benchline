import { desk, mountains, mountainsWarm, portrait, shoe, waves } from "@/tools/og-image-generator/lib/art";
import { flex, linesOf, photo, px, text } from "@/tools/og-image-generator/lib/elements";
import { layoutTitle } from "@/tools/og-image-generator/lib/fit";
import type { CSSProperties } from "react";
import type { OgColors, OgImages, TemplateRenderInput } from "@/tools/og-image-generator/lib/types";

type Card = TemplateRenderInput;

function u(card: Card, value: number) {
  return px(card.width, value);
}

function headline(card: Card, spec: { base: number; min: number; width: number; maxLines: number }, value: string, style: CSSProperties) {
  const fit = layoutTitle(value, spec, card.width);
  return text(value, {
    fontSize: fit.fontSize,
    lineHeight: 1.02,
    width: fit.maxWidth,
    ...style,
  });
}

function initial(value: string) {
  const letter = value.trim().charAt(0).toUpperCase();
  return letter || "B";
}

function mark(card: Card, colors: OgColors, letter: string, images: OgImages) {
  const size = u(card, 64);
  if (images.logo) return photo(images.logo, { width: size, height: size, borderRadius: u(card, 12) });
  return flex({
    width: size,
    height: size,
    borderRadius: u(card, 14),
    background: colors.foreground,
    color: colors.background,
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Geist",
    fontWeight: 700,
    fontSize: u(card, 28),
  }, letter);
}

function windowDots(card: Card) {
  const size = u(card, 12);
  return flex({ gap: u(card, 8) },
    flex({ width: size, height: size, borderRadius: size, background: "#ff5f57" }),
    flex({ width: size, height: size, borderRadius: size, background: "#febc2e" }),
    flex({ width: size, height: size, borderRadius: size, background: "#28c840" }),
  );
}

function bars(card: Card, color: string) {
  const heights = [18, 34, 26, 52, 40, 64, 28, 48, 22, 58, 36, 46, 20, 54, 32, 60, 24, 42, 30, 50];
  return flex({ alignItems: "center", gap: u(card, 5), height: u(card, 78) }, ...heights.map((height) =>
    flex({ width: u(card, 7), height: u(card, height), borderRadius: u(card, 4), background: color }),
  ));
}

export function renderEditorial(card: Card) {
  const fit = card;
  return flex({
    width: card.width,
    height: card.height,
    background: card.colors.background,
    color: card.colors.foreground,
    fontFamily: "Instrument Serif",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: u(card, 64),
  },
    headline(fit, { base: 84, min: 42, width: 1000, maxLines: 3 }, card.fields.title, { fontFamily: "Instrument Serif", letterSpacing: -1.5 }),
    flex({ flexDirection: "column", gap: u(card, 22) },
      flex({ width: u(card, 280), height: 1, background: card.colors.foreground, opacity: 0.35 }),
      flex({ width: "100%", justifyContent: "space-between", alignItems: "flex-end" },
        text(`${card.fields.author}  ·  ${card.fields.readTime}`, { fontFamily: "Geist", fontSize: u(card, 24), opacity: 0.82 }),
        flex({ alignItems: "center", gap: u(card, 12) },
          mark(card, card.colors, initial(card.fields.brand), card.images),
          text(card.fields.brand.toUpperCase(), { fontFamily: "Geist", fontSize: u(card, 18), letterSpacing: 3, fontWeight: 600 }),
        ),
      ),
    ),
  );
}

export function renderAurora(card: Card) {
  const waveHeight = Math.round(card.height * 0.3);
  return flex({
    width: card.width,
    height: card.height,
    backgroundColor: card.colors.background,
    backgroundImage: `radial-gradient(ellipse 75% 60% at 12% 115%, ${card.colors.accent} 0%, transparent 58%), radial-gradient(ellipse 60% 50% at 88% 0%, #7c3aed 0%, transparent 55%), radial-gradient(ellipse 50% 42% at 72% 100%, #f97316 0%, transparent 52%)`,
    color: card.colors.foreground,
    fontFamily: "Geist",
    flexDirection: "column",
    justifyContent: "flex-start",
    paddingTop: u(card, 56),
    paddingLeft: u(card, 64),
    paddingRight: u(card, 64),
    paddingBottom: waveHeight + u(card, 24),
    position: "relative",
    overflow: "hidden",
  },
    photo(waves, {
      position: "absolute",
      left: 0,
      top: card.height - waveHeight,
      width: card.width,
      height: waveHeight,
      opacity: 0.38,
      objectFit: "fill",
    }),
    text(card.fields.brand.toUpperCase(), { fontSize: u(card, 18), letterSpacing: 4, fontWeight: 600, color: card.colors.muted }),
    flex({ flexDirection: "column", gap: u(card, 28), marginTop: u(card, 36) },
      headline(card, { base: 78, min: 40, width: 980, maxLines: 3 }, card.fields.title, { fontWeight: 650, letterSpacing: -2 }),
      flex({
        alignSelf: "flex-start",
        borderRadius: 999,
        borderWidth: 1,
        borderStyle: "solid",
        borderColor: "rgba(255,255,255,0.35)",
        paddingLeft: u(card, 18),
        paddingRight: u(card, 18),
        paddingTop: u(card, 8),
        paddingBottom: u(card, 8),
        fontSize: u(card, 20),
        color: card.colors.foreground,
      }, card.fields.url),
    ),
  );
}

export function renderBlueprint(card: Card) {
  const len = u(card, 42);
  const thick = Math.max(2, u(card, 3));
  const inset = u(card, 28);
  const corner = (style: CSSProperties) => flex({
    position: "absolute",
    width: len,
    height: len,
    borderStyle: "solid",
    borderColor: card.colors.accent,
    borderTopWidth: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    ...style,
  });
  return flex({
    width: card.width,
    height: card.height,
    backgroundColor: card.colors.background,
    backgroundImage: `linear-gradient(${card.colors.muted} 1px, transparent 1px), linear-gradient(90deg, ${card.colors.muted} 1px, transparent 1px)`,
    backgroundSize: `${u(card, 48)}px ${u(card, 48)}px`,
    color: card.colors.foreground,
    fontFamily: "Geist",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: u(card, 72),
    position: "relative",
  },
    corner({ top: inset, left: inset, borderTopWidth: thick, borderLeftWidth: thick }),
    corner({ top: inset, right: inset, borderTopWidth: thick, borderRightWidth: thick }),
    corner({ bottom: inset, left: inset, borderBottomWidth: thick, borderLeftWidth: thick }),
    corner({ bottom: inset, right: inset, borderBottomWidth: thick, borderRightWidth: thick }),
    text(card.fields.eyebrow, { fontSize: u(card, 22), letterSpacing: 3, color: card.colors.accent, fontWeight: 600 }),
    headline(card, { base: 78, min: 40, width: 980, maxLines: 3 }, card.fields.title, { fontWeight: 600, letterSpacing: -1.5 }),
  );
}

export function renderTerminal(card: Card) {
  const wide = card.width / card.height > 1.15;
  const rows = linesOf(card.fields.command, 6);
  return flex({
    width: card.width,
    height: card.height,
    background: card.colors.background,
    color: card.colors.foreground,
    fontFamily: "Geist",
    flexDirection: wide ? "row" : "column",
    alignItems: "center",
    padding: u(card, 48),
    gap: u(card, 36),
  },
    flex({
      flexDirection: "column",
      background: "#101114",
      borderRadius: u(card, 18),
      padding: u(card, 26),
      width: wide ? u(card, 680) : card.width - u(card, 96),
      borderWidth: 1,
      borderStyle: "solid",
      borderColor: "rgba(255,255,255,0.08)",
    },
      flex({ marginBottom: u(card, 18) }, windowDots(card)),
      ...rows.map((line) => terminalLine(card, line)),
      flex({ width: u(card, 12), height: u(card, 22), background: card.colors.accent, marginTop: u(card, 10) }),
    ),
    headline(card, { base: 64, min: 32, width: wide ? 380 : 900, maxLines: 4 }, card.fields.title, { fontWeight: 650, letterSpacing: -1.5 }),
  );
}

function terminalLine(card: Card, line: string) {
  const prompt = line.startsWith("$");
  const done = /done|ready/i.test(line);
  const color = done ? card.colors.accent : prompt ? card.colors.foreground : card.colors.muted;
  return text(line, {
    fontFamily: "Geist Mono",
    fontSize: u(card, 22),
    lineHeight: 1.55,
    color,
    fontWeight: prompt ? 500 : 400,
  });
}

export function renderSplit(card: Card) {
  const wide = card.width / card.height > 1.05;
  return flex({
    width: card.width,
    height: card.height,
    background: card.colors.background,
    color: card.colors.foreground,
    fontFamily: "Geist",
    flexDirection: wide ? "row" : "column",
  },
    flex({
      width: wide ? "50%" : "100%",
      height: wide ? "100%" : "58%",
      flexDirection: "column",
      justifyContent: "center",
      padding: u(card, 56),
      gap: u(card, 18),
    },
      text(card.fields.eyebrow, { color: card.colors.accent, fontSize: u(card, 20), letterSpacing: 3, fontWeight: 700 }),
      headline(card, { base: 64, min: 34, width: 500, maxLines: 4 }, card.fields.title, { fontWeight: 650, letterSpacing: -1.5 }),
      flex({ width: u(card, 72), height: u(card, 6), background: card.colors.accent, borderRadius: 99 }),
    ),
    card.images.hero
      ? photo(card.images.hero, { width: wide ? "50%" : "100%", height: wide ? "100%" : "42%" })
      : photo(desk, { width: wide ? "50%" : "100%", height: wide ? "100%" : "42%" }),
  );
}

export function renderBrutalist(card: Card) {
  const inset = u(card, 18);
  const ink = card.colors.foreground;
  const paper = card.colors.background;
  const bar = u(card, 16);
  return flex({
    width: card.width,
    height: card.height,
    background: paper,
    padding: inset,
    fontFamily: "Geist",
  },
    flex({
      width: "100%",
      height: "100%",
      borderWidth: u(card, 10),
      borderStyle: "solid",
      borderColor: ink,
      flexDirection: "column",
      justifyContent: "space-between",
      padding: u(card, 28),
    },
      flex({ justifyContent: "space-between", alignItems: "center" },
        flex({
          background: ink,
          color: paper,
          paddingLeft: u(card, 14),
          paddingRight: u(card, 14),
          paddingTop: u(card, 8),
          paddingBottom: u(card, 8),
        }, text(card.fields.eyebrow.toUpperCase(), { fontWeight: 700, fontSize: u(card, 18), letterSpacing: 2 })),
        flex({ gap: u(card, 8) },
          flex({ width: u(card, 26), height: u(card, 26), background: ink }),
          flex({ width: u(card, 26), height: u(card, 26), background: ink }),
        ),
      ),
      flex({ width: "100%", height: bar, background: ink }),
      headline(card, { base: 92, min: 42, width: 980, maxLines: 2 }, card.fields.title.toUpperCase(), {
        fontFamily: "Geist",
        fontWeight: 700,
        letterSpacing: -2,
        color: ink,
      }),
      flex({ width: "46%", height: bar, background: ink }),
      text(card.fields.subtitle, { fontSize: u(card, 28), fontWeight: 600, color: ink }),
      flex({ gap: u(card, 10), alignItems: "center" },
        flex({ width: u(card, 140), height: bar, background: ink }),
        flex({ width: u(card, 48), height: bar, background: ink }),
        flex({ width: bar, height: bar, background: ink }),
      ),
      flex({
        width: "100%",
        background: ink,
        color: paper,
        justifyContent: "space-between",
        alignItems: "center",
        paddingLeft: u(card, 16),
        paddingRight: u(card, 16),
        paddingTop: u(card, 12),
        paddingBottom: u(card, 12),
      },
        text(card.fields.brand.toUpperCase(), { fontWeight: 700, fontSize: u(card, 20), letterSpacing: 3 }),
        flex({ width: u(card, 16), height: u(card, 16), background: paper }),
      ),
    ),
  );
}

export function renderLaunch(card: Card) {
  const steps = linesOf(card.fields.steps, 4);
  const wide = card.width / card.height > 1.15;
  return flex({
    width: card.width,
    height: card.height,
    background: card.colors.background,
    color: card.colors.foreground,
    fontFamily: "Geist",
    flexDirection: wide ? "row" : "column",
    alignItems: wide ? "center" : "flex-start",
    justifyContent: wide ? "space-between" : "center",
    padding: u(card, 64),
    gap: u(card, 32),
    position: "relative",
    overflow: "hidden",
  },
    flex({ position: "absolute", right: u(card, -40), top: u(card, -60), width: u(card, 280), height: u(card, 280), borderRadius: 999, background: card.colors.accent, opacity: 0.18 }),
    flex({ flexDirection: "column", gap: u(card, 18), width: wide ? u(card, 620) : "100%" },
      flex({
        alignSelf: "flex-start",
        background: card.colors.foreground,
        color: card.colors.background,
        borderRadius: 999,
        paddingLeft: u(card, 14),
        paddingRight: u(card, 14),
        paddingTop: u(card, 6),
        paddingBottom: u(card, 6),
        fontSize: u(card, 16),
        fontWeight: 600,
        letterSpacing: 1,
      }, card.fields.badge),
      headline(card, { base: 68, min: 36, width: 600, maxLines: 3 }, card.fields.title, { fontWeight: 650, letterSpacing: -1.8 }),
    ),
    flex({
      flexDirection: "column",
      background: "#ffffff",
      color: "#1c1530",
      borderRadius: u(card, 22),
      padding: u(card, 22),
      width: wide ? u(card, 340) : u(card, 520),
      gap: u(card, 12),
      borderWidth: 1,
      borderStyle: "solid",
      borderColor: "rgba(40,20,70,0.08)",
    },
      flex({ justifyContent: "space-between", alignItems: "center", marginBottom: u(card, 6) },
        text("Agent Mode", { fontWeight: 650, fontSize: u(card, 20) }),
        text("Enabled", { fontSize: u(card, 14), color: card.colors.accent, fontWeight: 600 }),
      ),
      ...steps.map((step) => flex({ alignItems: "center", gap: u(card, 10) },
        flex({ width: u(card, 18), height: u(card, 18), borderRadius: 99, background: card.colors.accent, alignItems: "center", justifyContent: "center", color: "#fff", fontSize: u(card, 12) }, "✓"),
        text(step, { fontSize: u(card, 18) }),
      )),
    ),
  );
}

export function renderProfile(card: Card) {
  const chips = linesOf(card.fields.meta, 4);
  const pad = u(card, 56);
  const gap = u(card, 40);
  const tall = card.height > card.width * 0.95;
  const avatar = tall ? Math.round(card.width * 0.36) : u(card, 220);
  const textWidth = Math.max(u(card, 280), card.width - pad * 2 - avatar - gap);
  return flex({
    width: card.width,
    height: card.height,
    background: card.colors.background,
    color: card.colors.foreground,
    fontFamily: "Geist",
    flexDirection: "row",
    alignItems: "center",
    padding: pad,
    gap,
  },
    card.images.avatar
      ? photo(card.images.avatar, { width: avatar, height: avatar, borderRadius: avatar })
      : photo(portrait, { width: avatar, height: avatar, borderRadius: avatar }),
    flex({ flexDirection: "column", gap: u(card, 14), width: textWidth },
      headline(card, { base: 72, min: 40, width: Math.round(textWidth / (card.width / 1200)), maxLines: 2 }, card.fields.title, { fontWeight: 650, letterSpacing: -1.5 }),
      text(card.fields.role, { fontSize: u(card, 28), color: card.colors.muted }),
      flex({ gap: u(card, 10), flexWrap: "wrap", marginTop: u(card, 12) }, ...chips.map((chip) =>
        flex({
          borderWidth: 1,
          borderStyle: "solid",
          borderColor: "rgba(20,16,12,0.12)",
          borderRadius: 999,
          paddingLeft: u(card, 14),
          paddingRight: u(card, 14),
          paddingTop: u(card, 8),
          paddingBottom: u(card, 8),
          fontSize: u(card, 18),
          color: card.colors.muted,
        }, chip),
      )),
    ),
  );
}

function sparkline(card: Card, color: string) {
  const heights = [22, 18, 30, 26, 38, 34, 48, 42, 58, 52, 68, 62, 78, 86];
  return flex({ alignItems: "flex-end", gap: u(card, 6), height: u(card, 92) }, ...heights.map((height, index) =>
    flex({
      width: u(card, 12),
      height: u(card, height),
      borderRadius: u(card, 3),
      background: color,
      opacity: index > heights.length - 4 ? 1 : 0.55,
    }),
  ));
}

export function renderStat(card: Card) {
  return flex({
    width: card.width,
    height: card.height,
    background: card.colors.background,
    color: card.colors.foreground,
    fontFamily: "Geist",
    flexDirection: "column",
    justifyContent: "center",
    gap: u(card, 40),
    padding: u(card, 56),
  },
    flex({ width: "100%", justifyContent: "space-between", alignItems: "flex-start", gap: u(card, 24) },
      headline(card, { base: 148, min: 64, width: 760, maxLines: 1 }, card.fields.stat, { fontWeight: 700, letterSpacing: -4, color: card.colors.accent, lineHeight: 1 }),
      flex({ alignItems: "center", gap: u(card, 12), flexShrink: 0 },
        mark(card, { ...card.colors, foreground: card.colors.accent, background: card.colors.background }, initial(card.fields.author), card.images),
        text(card.fields.author.toUpperCase(), { letterSpacing: 3, fontSize: u(card, 18), fontWeight: 600 }),
      ),
    ),
    flex({ width: "100%", alignItems: "flex-end", justifyContent: "space-between", gap: u(card, 28) },
      flex({ flexDirection: "column", gap: u(card, 16), width: u(card, 720) },
        text(card.fields.statLabel, { fontSize: u(card, 30), width: u(card, 680), lineHeight: 1.15, fontWeight: 500 }),
        sparkline(card, card.colors.accent),
      ),
      flex({
        flexDirection: "column",
        alignItems: "flex-end",
        gap: u(card, 6),
        borderWidth: 1,
        borderStyle: "solid",
        borderColor: card.colors.muted,
        borderRadius: u(card, 16),
        paddingTop: u(card, 14),
        paddingBottom: u(card, 14),
        paddingLeft: u(card, 18),
        paddingRight: u(card, 18),
      },
        text("+18%", { fontSize: u(card, 36), fontWeight: 700, color: card.colors.accent, lineHeight: 1 }),
        text("vs last quarter", { fontSize: u(card, 16), color: card.colors.muted, letterSpacing: 0.4 }),
      ),
    ),
  );
}

export function renderQuote(card: Card) {
  const avatar = u(card, 64);
  return flex({
    width: card.width,
    height: card.height,
    background: card.colors.background,
    color: card.colors.foreground,
    fontFamily: "Instrument Serif",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: u(card, 64),
  },
    flex({ flexDirection: "column", gap: u(card, 8) },
      text("“", { fontSize: u(card, 92), color: card.colors.accent, lineHeight: 0.7, fontFamily: "Instrument Serif" }),
      headline(card, { base: 54, min: 30, width: 1040, maxLines: 4 }, card.fields.quote, { fontStyle: "italic", letterSpacing: -0.5 }),
    ),
    flex({ alignItems: "center", gap: u(card, 16) },
      card.images.avatar
        ? photo(card.images.avatar, { width: avatar, height: avatar, borderRadius: avatar })
        : photo(portrait, { width: avatar, height: avatar, borderRadius: avatar }),
      flex({ flexDirection: "column" },
        text(card.fields.author, { fontFamily: "Geist", fontSize: u(card, 22), fontWeight: 650 }),
        text(card.fields.role, { fontFamily: "Geist", fontSize: u(card, 18), color: card.colors.muted }),
      ),
    ),
  );
}

export function renderEvent(card: Card) {
  const [month = "OCT", day = "24"] = card.fields.date.split(/\s+/);
  return flex({
    width: card.width,
    height: card.height,
    backgroundColor: card.colors.background,
    backgroundImage: `radial-gradient(ellipse 50% 70% at 0% 100%, ${card.colors.accent}33 0%, transparent 60%)`,
    color: card.colors.foreground,
    fontFamily: "Geist",
    flexDirection: "row",
    alignItems: "center",
    padding: u(card, 56),
    gap: u(card, 36),
  },
    flex({ flexDirection: "column", width: u(card, 250) },
      text(month, { fontSize: u(card, 36), letterSpacing: 4, fontWeight: 700, color: card.colors.accent }),
      text(day, { fontSize: Math.min(u(card, 120), Math.round(card.height * 0.34)), fontWeight: 700, letterSpacing: -3, lineHeight: 1, color: card.colors.accent }),
    ),
    flex({ width: 1, height: u(card, 360), background: "rgba(255,255,255,0.16)" }),
    flex({ flexDirection: "column", gap: u(card, 18), width: u(card, 760) },
      headline(card, { base: 58, min: 32, width: 740, maxLines: 3 }, card.fields.title, { fontWeight: 650, letterSpacing: -1.2 }),
      text(`${card.fields.subtitle}  ·  ${card.fields.time}`, { fontSize: u(card, 24), color: card.colors.muted }),
      flex({
        alignSelf: "flex-start",
        marginTop: u(card, 10),
        background: card.colors.accent,
        color: "#1a0d08",
        borderRadius: 999,
        paddingLeft: u(card, 22),
        paddingRight: u(card, 22),
        paddingTop: u(card, 12),
        paddingBottom: u(card, 12),
        fontWeight: 700,
        fontSize: u(card, 20),
      }, card.fields.cta),
    ),
  );
}

export function renderPodcast(card: Card) {
  const wide = card.width / card.height > 1.05;
  return flex({
    width: card.width,
    height: card.height,
    background: card.colors.background,
    color: card.colors.foreground,
    fontFamily: "Geist",
    flexDirection: wide ? "row" : "column",
  },
    card.images.hero
      ? photo(card.images.hero, { width: wide ? "46%" : "100%", height: wide ? "100%" : "46%" })
      : photo(mountains, { width: wide ? "46%" : "100%", height: wide ? "100%" : "46%" }),
    flex({
      width: wide ? "54%" : "100%",
      height: wide ? "100%" : "54%",
      flexDirection: "column",
      justifyContent: "space-between",
      padding: u(card, 48),
    },
      flex({ justifyContent: "space-between", alignItems: "center" },
        bars(card, card.colors.accent),
        text(card.fields.episode, { fontSize: u(card, 20), letterSpacing: 2, color: card.colors.muted, fontWeight: 600 }),
      ),
      headline(card, { base: 58, min: 32, width: 560, maxLines: 3 }, card.fields.title, { fontWeight: 650, letterSpacing: -1.2 }),
    ),
  );
}

export function renderChangelog(card: Card) {
  const versions = linesOf(card.fields.versions, 4).map((line) => {
    const [version = line, note = ""] = line.split("|").map((part) => part.trim());
    return { version, note };
  });
  return flex({
    width: card.width,
    height: card.height,
    background: card.colors.background,
    color: card.colors.foreground,
    fontFamily: "Geist",
    flexDirection: "column",
    justifyContent: "center",
    padding: u(card, 64),
    gap: u(card, 28),
  },
    flex({ justifyContent: "space-between", alignItems: "center" },
      headline(card, { base: 64, min: 36, width: 900, maxLines: 2 }, card.fields.title, { fontWeight: 650, letterSpacing: -1.4 }),
      flex({ position: "relative", width: u(card, 36), height: u(card, 36), flexShrink: 0 },
        flex({ position: "absolute", top: 0, right: 0, width: u(card, 22), height: u(card, 26), borderRadius: 4, borderWidth: 2, borderStyle: "solid", borderColor: card.colors.muted, background: card.colors.background }),
        flex({ position: "absolute", left: 0, bottom: 0, width: u(card, 22), height: u(card, 26), borderRadius: 4, borderWidth: 2, borderStyle: "solid", borderColor: card.colors.foreground, background: card.colors.background }),
      ),
    ),
    flex({ flexDirection: "column", gap: u(card, 16) }, ...versions.map((entry) =>
      flex({ alignItems: "center", gap: u(card, 16) },
        flex({ width: u(card, 12), height: u(card, 12), borderRadius: 99, background: card.colors.accent }),
        flex({ background: card.colors.foreground, color: card.colors.background, borderRadius: 999, paddingLeft: u(card, 12), paddingRight: u(card, 12), paddingTop: u(card, 4), paddingBottom: u(card, 4), fontSize: u(card, 16), fontWeight: 700 }, entry.version),
        text(entry.note, { fontSize: u(card, 24), color: card.colors.muted }),
      ),
    )),
  );
}

export function renderGlass(card: Card) {
  const cardWidth = Math.min(u(card, 720), card.width - u(card, 160));
  const gutter = Math.round((card.width - cardWidth) / 2);
  const blob = Math.max(u(card, 140), gutter - u(card, 28));
  return flex({
    width: card.width,
    height: card.height,
    backgroundColor: "#7c3aed",
    backgroundImage: `linear-gradient(120deg, ${card.colors.accent} 0%, #7c3aed 42%, #22d3ee 100%)`,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
    flex({ position: "absolute", left: u(card, -28), top: u(card, -36), width: blob, height: Math.round(blob * 0.85), borderRadius: 999, background: "#fb7185", opacity: 0.92, zIndex: 0 }),
    flex({ position: "absolute", right: u(card, -28), bottom: u(card, -40), width: blob, height: Math.round(blob * 0.85), borderRadius: 999, background: "#38bdf8", opacity: 0.92, zIndex: 0 }),
    flex({
      width: cardWidth,
      position: "relative",
      zIndex: 2,
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: u(card, 18),
      background: "rgba(18, 10, 32, 0.72)",
      borderRadius: u(card, 36),
      borderWidth: 1,
      borderStyle: "solid",
      borderColor: "rgba(255,255,255,0.55)",
      paddingTop: u(card, 48),
      paddingBottom: u(card, 48),
      paddingLeft: u(card, 36),
      paddingRight: u(card, 36),
    },
      mark(card, { background: "#1c1530", foreground: "#ffffff", accent: card.colors.accent, muted: card.colors.muted }, initial(card.fields.brand), card.images),
      headline(card, { base: 64, min: 34, width: 640, maxLines: 2 }, card.fields.title, { color: "#ffffff", fontFamily: "Geist", fontWeight: 600, letterSpacing: -1.2, textAlign: "center" }),
    ),
  );
}

export function renderMinimal(card: Card) {
  return flex({
    width: card.width,
    height: card.height,
    background: card.colors.background,
    color: card.colors.foreground,
    fontFamily: "Geist Mono",
    alignItems: "center",
    padding: u(card, 72),
  },
    flex({ alignItems: "center", gap: u(card, 8) },
      headline(card, { base: 64, min: 28, width: 980, maxLines: 2 }, card.fields.command, { fontFamily: "Geist Mono", fontWeight: 500 }),
      flex({ width: u(card, 18), height: u(card, 42), background: card.colors.foreground }),
    ),
  );
}

export function renderProduct(card: Card) {
  const wide = card.width / card.height > 1.05;
  return flex({
    width: card.width,
    height: card.height,
    background: card.colors.background,
    color: card.colors.foreground,
    fontFamily: "Geist",
    flexDirection: wide ? "row" : "column",
    alignItems: "center",
    padding: u(card, 48),
    gap: u(card, 12),
  },
    flex({ flexDirection: "column", gap: u(card, 16), width: wide ? u(card, 560) : "100%" },
      headline(card, { base: 68, min: 36, width: 540, maxLines: 2 }, card.fields.title, { fontWeight: 650, letterSpacing: -1.5 }),
      text(card.fields.subtitle, { fontSize: u(card, 26), color: card.colors.muted, width: u(card, 460) }),
      text(card.fields.price, { fontSize: u(card, 54), fontWeight: 700, letterSpacing: -1, marginTop: u(card, 8) }),
      flex({
        alignSelf: "flex-start",
        marginTop: u(card, 8),
        background: card.colors.foreground,
        color: card.colors.background,
        borderRadius: 999,
        paddingLeft: u(card, 22),
        paddingRight: u(card, 22),
        paddingTop: u(card, 12),
        paddingBottom: u(card, 12),
        fontWeight: 650,
        fontSize: u(card, 20),
      }, card.fields.cta),
    ),
    card.images.hero
      ? photo(card.images.hero, { width: wide ? u(card, 460) : Math.round(card.width * 0.7), height: wide ? u(card, 420) : Math.round(card.height * 0.34) })
      : photo(shoe, { width: wide ? u(card, 480) : Math.round(card.width * 0.7), height: wide ? u(card, 320) : Math.round(card.height * 0.3) }),
  );
}

export function renderTutorial(card: Card) {
  const steps = linesOf(card.fields.steps, 4);
  return flex({
    width: card.width,
    height: card.height,
    background: card.colors.background,
    color: card.colors.foreground,
    fontFamily: "Geist",
    flexDirection: "column",
    justifyContent: "center",
    padding: u(card, 64),
    gap: u(card, 28),
  },
    headline(card, { base: 64, min: 34, width: 980, maxLines: 2 }, card.fields.title, { fontWeight: 650, letterSpacing: -1.4 }),
    flex({ flexDirection: "column", gap: u(card, 14) }, ...steps.map((step, index) =>
      flex({
        alignItems: "center",
        gap: u(card, 16),
        background: "rgba(255,255,255,0.72)",
        borderRadius: u(card, 16),
        paddingLeft: u(card, 18),
        paddingRight: u(card, 18),
        paddingTop: u(card, 14),
        paddingBottom: u(card, 14),
      },
        flex({ width: u(card, 36), height: u(card, 36), borderRadius: 99, background: card.colors.foreground, color: card.colors.background, alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: u(card, 18) }, String(index + 1)),
        text(step, { fontSize: u(card, 26), fontWeight: 500 }),
      ),
    )),
  );
}

export function renderBeforeAfter(card: Card) {
  const wide = card.width / card.height > 1.05;
  const imageHeight = wide ? u(card, 250) : Math.round(card.height * 0.24);
  return flex({
    width: card.width,
    height: card.height,
    background: card.colors.background,
    fontFamily: "Geist",
    flexDirection: "column",
    padding: u(card, 28),
    gap: u(card, 16),
  },
    flex({ flex: 1, flexDirection: wide ? "row" : "column", gap: u(card, 16) },
      comparePane(card, "Before", card.fields.beforeValue, card.images.before || mountains, "#f6d5d0", imageHeight),
      flex({ alignItems: "center", justifyContent: "center" },
        flex({ width: u(card, 64), height: u(card, 64), borderRadius: 99, background: "#ffffff", alignItems: "center", justifyContent: "center", fontWeight: 700, color: card.colors.foreground, fontSize: u(card, 18) }, "VS"),
      ),
      comparePane(card, "After", card.fields.afterValue, card.images.after || mountainsWarm, "#d9efd8", imageHeight),
    ),
    text(card.fields.caption, { textAlign: "center", fontSize: u(card, 22), color: card.colors.muted, fontWeight: 500 }),
  );
}

function comparePane(card: Card, label: string, value: string, src: string, tint: string, imageHeight: number) {
  return flex({
    flex: 1,
    background: tint,
    borderRadius: u(card, 24),
    padding: u(card, 18),
    flexDirection: "column",
    gap: u(card, 12),
  },
    text(label, { fontSize: u(card, 18), color: card.colors.muted, fontWeight: 600 }),
    photo(src, { width: "100%", height: imageHeight, borderRadius: u(card, 16) }),
    text(value, { fontSize: u(card, 36), fontWeight: 700, color: card.colors.foreground }),
  );
}
