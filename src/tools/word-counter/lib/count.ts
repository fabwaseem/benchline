export const readingWordsPerMinute = 238;
export const speakingWordsPerMinute = 150;

export const platforms = [
  { id: "seo-title", label: "SEO title", limit: 60 },
  { id: "meta-description", label: "Meta description", limit: 160 },
  { id: "x", label: "X post", limit: 280 },
  { id: "sms", label: "SMS", limit: 160 },
  { id: "bluesky", label: "Bluesky", limit: 300 },
  { id: "instagram", label: "Instagram caption", limit: 2200 },
] as const;

export type PlatformId = (typeof platforms)[number]["id"];

export type PlatformCount = {
  id: PlatformId;
  label: string;
  limit: number;
  count: number;
  over: boolean;
};

export type TextCounts = {
  words: number;
  uniqueWords: number;
  characters: number;
  charactersNoSpaces: number;
  graphemes: number;
  sentences: number;
  paragraphs: number;
  lines: number;
  readingSeconds: number;
  speakingSeconds: number;
  readingLabel: string;
  speakingLabel: string;
  platforms: PlatformCount[];
};

const wordSegmenter = new Intl.Segmenter("en", { granularity: "word" });
const graphemeSegmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
const sentenceSegmenter = new Intl.Segmenter("en", { granularity: "sentence" });

export function countText(text: string): TextCounts {
  const characters = Array.from(text).length;
  const charactersNoSpaces = Array.from(text).filter((character) => !/\s/u.test(character)).length;
  const graphemes = text.length === 0 ? 0 : [...graphemeSegmenter.segment(text)].length;
  const words: string[] = [];
  if (text.length > 0) {
    for (const part of wordSegmenter.segment(text)) {
      if (part.isWordLike) words.push(part.segment);
    }
  }
  const uniqueWords = new Set(words.map((word) => word.toLocaleLowerCase("en-US"))).size;
  const sentences = text.trim().length === 0
    ? 0
    : [...sentenceSegmenter.segment(text)].filter((part) => part.segment.trim().length > 0).length;
  const paragraphs = text.trim().length === 0 ? 0 : text.split(/\n\s*\n/).filter((part) => part.trim().length > 0).length;
  const lines = text.length === 0 ? 0 : text.split("\n").length;
  const reading = duration(words.length, readingWordsPerMinute);
  const speaking = duration(words.length, speakingWordsPerMinute);
  return {
    words: words.length,
    uniqueWords,
    characters,
    charactersNoSpaces,
    graphemes,
    sentences,
    paragraphs,
    lines,
    readingSeconds: reading.seconds,
    speakingSeconds: speaking.seconds,
    readingLabel: reading.label,
    speakingLabel: speaking.label,
    platforms: platforms.map((platform) => ({
      id: platform.id,
      label: platform.label,
      limit: platform.limit,
      count: characters,
      over: characters > platform.limit,
    })),
  };
}

function duration(words: number, perMinute: number) {
  if (words === 0) return { seconds: 0, label: "0 sec" };
  const seconds = Math.max(1, Math.round((words / perMinute) * 60));
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  const label = minutes === 0 ? `${rest} sec` : rest === 0 ? `${minutes} min` : `${minutes} min ${rest} sec`;
  return { seconds, label };
}

export const exampleText = "The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.";
