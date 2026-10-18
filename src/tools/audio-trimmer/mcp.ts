import { z } from "zod";
import { encodeBase64 } from "@/lib/base64";
import { mcpFileSchema, readMcpBytes } from "@/lib/mcp/bytes";
import type { BenchTool } from "@/lib/mcp/types";
import { applyFade, decodeWav, encodeWav, trimSamples } from "@/tools/audio-trimmer/lib/audio";

export const inputSchema = z.object({
  file: mcpFileSchema,
  startSec: z.number().min(0).describe("Trim start in seconds."),
  endSec: z.number().positive().describe("Trim end in seconds, after startSec."),
  fadeInSec: z.number().min(0).default(0).describe("Linear fade-in length in seconds."),
  fadeOutSec: z.number().min(0).default(0).describe("Linear fade-out length in seconds."),
});

export const outputSchema = z.object({
  data: z.string().describe("Trimmed audio as a 16-bit PCM WAV, base64."),
  durationSec: z.number().describe("Duration of the trimmed audio in seconds."),
  sampleRate: z.number().int().describe("Sample rate in Hz."),
  bytes: z.number().int().describe("WAV file size in bytes."),
});

async function run(input: unknown) {
  const parsed = inputSchema.parse(input);
  const read = await readMcpBytes(parsed.file, "Audio file");
  let info;
  try {
    info = decodeWav(read.bytes);
  } catch {
    throw new Error("Only WAV audio is supported over MCP — use the web UI for MP3/OGG/M4A.");
  }
  const trimmed = trimSamples(info.samples, info.sampleRate, parsed.startSec, parsed.endSec);
  const faded = applyFade(trimmed, info.sampleRate, parsed.fadeInSec, parsed.fadeOutSec);
  const encoded = encodeWav(faded, info.sampleRate);
  return outputSchema.parse({
    data: encodeBase64(encoded),
    durationSec: (faded[0] as Float32Array).length / info.sampleRate,
    sampleRate: info.sampleRate,
    bytes: encoded.byteLength,
  });
}

export const tool: BenchTool = {
  slug: "audio-trimmer",
  name: "trim_audio",
  title: "Trim a WAV audio file",
  description:
    "Trim a WAV audio file to a time range with optional fade in and out, returning a 16-bit PCM WAV as base64. Only WAV is accepted; the web UI handles MP3/OGG/M4A.",
  openWorld: true,
  inputSchema,
  outputSchema,
  run,
};
