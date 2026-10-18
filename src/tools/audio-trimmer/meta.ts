import type { ToolMeta } from "@/registry/schema";

export const meta = {
  slug: "audio-trimmer",
  name: "Audio Trimmer",
  tagline: "Cut a section out of an audio file. See the waveform, drag the trim region, add fades, and export WAV.",
  description:
    "Free audio trimmer that runs entirely in your browser. Upload audio, see the waveform, drag-select the part to keep, add fade in and fade out, and download a 16-bit WAV. Your audio never leaves this device.",
  category: "audio",
  tags: ["audio", "trim"],
  keywords: ["audio trimmer", "trim audio", "cut audio", "audio cutter", "mp3 trimmer", "wav trimmer"],
  status: "new",
  createdAt: "2026-10-18",
  updatedAt: "2026-10-18",
  icon: "AudioWaveform",
  related: [],
  faqs: [
    { q: "Are my audio files uploaded?", a: "No. Everything runs locally in the browser. The file is decoded, trimmed, and encoded on this device. Nothing is sent to a server." },
    { q: "Which formats can I open?", a: "Anything your browser can decode: MP3, M4A, OGG, FLAC, WAV, and more. The export is always a 16-bit WAV, no matter which format you opened." },
    { q: "How do I pick the trim region?", a: "Press and drag across the waveform to select the part to keep. The start and end times update as you drag. Fades apply to the kept section." },
    { q: "Why is the exported file bigger than the original?", a: "WAV is uncompressed. The same audio in 16-bit WAV takes roughly 10 MB per stereo minute." },
  ],
  seo: {
    title: "Audio Trimmer — Cut Audio Online, Free",
    description: "Trim audio in your browser. Open MP3, M4A, OGG, WAV, drag-select the part to keep, add fades, and export a WAV. Files stay on this device.",
  },
  howTo: [
    { name: "Add an audio file", text: "Drop any audio file. It is decoded in this browser, never uploaded." },
    { name: "Select the trim region", text: "Drag across the waveform to choose the part to keep. Start and end times are shown." },
    { name: "Add fades and export", text: "Set fade in and fade out lengths, preview the selection, then download the trimmed audio as a 16-bit WAV." },
  ],
  inputs: "An audio file (any format the browser can decode), the trim start and end, and optional fade in and fade out lengths.",
  outputs: "A 16-bit PCM WAV file containing the selected region with fades applied.",
  runsLocally: true,
  badges: ["In this browser"],
} satisfies ToolMeta;
