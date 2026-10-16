import { Tiktoken } from "js-tiktoken/lite";
import cl100k from "js-tiktoken/ranks/cl100k_base";
import o200k from "js-tiktoken/ranks/o200k_base";

const encoders = {
  o200k: new Tiktoken(o200k),
  cl100k: new Tiktoken(cl100k),
};

export type EncodingName = keyof typeof encoders;

export function countTokens(text: string, encoding: EncodingName, preview = 2000) {
  const ids = encoders[encoding].encode(text);
  const segments: string[] = [];
  const limit = Math.min(ids.length, preview);
  for (let i = 0; i < limit; i += 1) {
    segments.push(encoders[encoding].decode([ids[i]!]));
  }
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  return { count: ids.length, chars: text.length, words, segments };
}
