export type WavInfo = {
  sampleRate: number;
  channels: number;
  bitsPerSample: number;
  /** One Float32Array per channel, samples in [-1, 1]. */
  samples: Float32Array[];
};

const RIFF = [0x52, 0x49, 0x46, 0x46]; // "RIFF"
const WAVE = [0x57, 0x41, 0x56, 0x45]; // "WAVE"

function tagEquals(view: DataView, offset: number, tag: number[]): boolean {
  return tag.every((byte, index) => view.getUint8(offset + index) === byte);
}

function readTag(view: DataView, offset: number): string {
  return String.fromCharCode(
    view.getUint8(offset),
    view.getUint8(offset + 1),
    view.getUint8(offset + 2),
    view.getUint8(offset + 3),
  );
}

/** Parse a RIFF/WAVE file with integer PCM samples (8/16/24/32-bit) into per-channel Float32 arrays. */
export function decodeWav(bytes: Uint8Array): WavInfo {
  if (bytes.byteLength < 12) throw new Error("Not a WAV file: too short for a RIFF header.");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (!tagEquals(view, 0, RIFF) || !tagEquals(view, 8, WAVE)) {
    throw new Error("Not a WAV file: missing RIFF/WAVE header.");
  }

  let offset = 12;
  let format: { audioFormat: number; channels: number; sampleRate: number; bitsPerSample: number } | null = null;
  let dataOffset = -1;
  let dataLength = 0;

  while (offset + 8 <= bytes.byteLength) {
    const id = readTag(view, offset);
    const size = view.getUint32(offset + 4, true);
    const chunkStart = offset + 8;
    if (chunkStart + size > bytes.byteLength) {
      throw new Error("WAV data is truncated: a chunk extends past the end of the file.");
    }
    if (id === "fmt ") {
      if (size < 16) throw new Error("WAV header is corrupt: the fmt chunk is too small.");
      format = {
        audioFormat: view.getUint16(chunkStart, true),
        channels: view.getUint16(chunkStart + 2, true),
        sampleRate: view.getUint32(chunkStart + 4, true),
        bitsPerSample: view.getUint16(chunkStart + 14, true),
      };
    } else if (id === "data" && dataOffset === -1) {
      dataOffset = chunkStart;
      dataLength = size;
    }
    offset = chunkStart + size + (size % 2 === 1 ? 1 : 0);
  }

  if (!format) throw new Error("WAV header is corrupt: no fmt chunk found.");
  if (format.audioFormat === 3) {
    throw new Error("WAV uses IEEE-float encoding, which is not supported. Convert it to 16-bit PCM first.");
  }
  if (format.audioFormat !== 1) {
    throw new Error(`WAV uses encoding format ${format.audioFormat}, which is not supported. Only PCM is supported.`);
  }
  if (![8, 16, 24, 32].includes(format.bitsPerSample)) {
    throw new Error(`WAV uses ${format.bitsPerSample}-bit samples, which is not supported. Use 8, 16, 24, or 32-bit PCM.`);
  }
  if (format.channels < 1 || format.channels > 32) {
    throw new Error(`WAV has ${format.channels} channels, which is not supported.`);
  }
  if (format.sampleRate <= 0 || format.sampleRate > 192000) {
    throw new Error(`WAV has an invalid sample rate of ${format.sampleRate} Hz.`);
  }
  if (dataOffset === -1) throw new Error("WAV header is corrupt: no data chunk found.");

  const bytesPerSample = format.bitsPerSample / 8;
  const frameSize = bytesPerSample * format.channels;
  if (dataLength % frameSize !== 0) {
    throw new Error("WAV data is truncated: the data chunk does not contain whole sample frames.");
  }
  const frameCount = dataLength / frameSize;
  const channels: Float32Array[] = Array.from({ length: format.channels }, () => new Float32Array(frameCount));

  for (let frame = 0; frame < frameCount; frame++) {
    for (let channel = 0; channel < format.channels; channel++) {
      const pos = dataOffset + frame * frameSize + channel * bytesPerSample;
      let value = 0;
      if (format.bitsPerSample === 8) {
        value = (view.getUint8(pos) - 128) / 128;
      } else if (format.bitsPerSample === 16) {
        value = view.getInt16(pos, true) / 32768;
      } else if (format.bitsPerSample === 24) {
        const raw = view.getUint8(pos) | (view.getUint8(pos + 1) << 8) | (view.getUint8(pos + 2) << 16);
        value = (raw & 0x800000 ? raw - 0x1000000 : raw) / 8388608;
      } else {
        value = view.getInt32(pos, true) / 2147483648;
      }
      (channels[channel] as Float32Array)[frame] = value;
    }
  }

  return {
    sampleRate: format.sampleRate,
    channels: format.channels,
    bitsPerSample: format.bitsPerSample,
    samples: channels,
  };
}

/** Encode per-channel Float32 samples as a 16-bit PCM WAV file. */
export function encodeWav(samples: Float32Array[], sampleRate: number): Uint8Array {
  if (samples.length === 0) throw new Error("Nothing to encode: no audio channels.");
  if (!Number.isFinite(sampleRate) || sampleRate <= 0) throw new Error("Invalid sample rate.");
  const channels = samples.length;
  const frames = (samples[0] as Float32Array).length;
  for (const channel of samples) {
    if (channel.length !== frames) throw new Error("Cannot encode channels of different lengths.");
  }

  const dataLength = frames * channels * 2;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  writeTag(view, 0, "RIFF");
  view.setUint32(4, 36 + dataLength, true);
  writeTag(view, 8, "WAVE");
  writeTag(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * channels * 2, true); // byte rate
  view.setUint16(32, channels * 2, true); // block align
  view.setUint16(34, 16, true);
  writeTag(view, 36, "data");
  view.setUint32(40, dataLength, true);

  let offset = 44;
  for (let frame = 0; frame < frames; frame++) {
    for (let channel = 0; channel < channels; channel++) {
      const sample = Math.max(-1, Math.min(1, (samples[channel] as Float32Array)[frame] ?? 0));
      view.setInt16(offset, Math.round(sample * 32767), true);
      offset += 2;
    }
  }
  return bytes;
}

function writeTag(view: DataView, offset: number, tag: string) {
  for (let i = 0; i < 4; i++) view.setUint8(offset + i, tag.charCodeAt(i));
}

/** Keep the audio between startSec (inclusive) and endSec (exclusive). Returns new arrays. */
export function trimSamples(
  samples: Float32Array[],
  sampleRate: number,
  startSec: number,
  endSec: number,
): Float32Array[] {
  const totalFrames = samples.length > 0 ? (samples[0] as Float32Array).length : 0;
  const duration = totalFrames / sampleRate;
  if (!Number.isFinite(startSec) || !Number.isFinite(endSec)) {
    throw new Error("Trim range must be finite seconds.");
  }
  if (startSec < 0 || endSec < 0) throw new Error("Trim range cannot start before 0s.");
  if (startSec >= endSec) throw new Error("Trim start must be before trim end.");
  if (endSec > duration) {
    throw new Error(`Trim end ${formatTime(endSec)} is past the audio duration of ${formatTime(duration)}.`);
  }
  const startFrame = Math.floor(startSec * sampleRate);
  const endFrame = Math.ceil(endSec * sampleRate);
  return samples.map((channel) => channel.slice(startFrame, endFrame));
}

/** Apply linear fade-in and fade-out envelopes. Fades longer than the audio are clamped. Returns new arrays. */
export function applyFade(
  samples: Float32Array[],
  sampleRate: number,
  fadeInSec: number,
  fadeOutSec: number,
): Float32Array[] {
  if (fadeInSec < 0 || fadeOutSec < 0) throw new Error("Fade lengths cannot be negative.");
  if (!Number.isFinite(fadeInSec) || !Number.isFinite(fadeOutSec)) {
    throw new Error("Fade lengths must be finite seconds.");
  }
  return samples.map((channel) => {
    const out = Float32Array.from(channel);
    const fadeInFrames = Math.min(Math.floor(fadeInSec * sampleRate), out.length);
    const fadeOutFrames = Math.min(Math.floor(fadeOutSec * sampleRate), out.length);
    for (let i = 0; i < fadeInFrames; i++) {
      out[i] = (out[i] as number) * (i / fadeInFrames);
    }
    for (let i = 0; i < fadeOutFrames; i++) {
      const index = out.length - 1 - i;
      out[index] = (out[index] as number) * (i / fadeOutFrames);
    }
    return out;
  });
}

/** Format seconds as "m:ss.mmm", e.g. 61.25 -> "1:01.250". */
export function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "0:00.000";
  const totalMs = Math.round(sec * 1000);
  const minutes = Math.floor(totalMs / 60000);
  const seconds = Math.floor((totalMs % 60000) / 1000);
  const ms = totalMs % 1000;
  return `${minutes}:${String(seconds).padStart(2, "0")}.${String(ms).padStart(3, "0")}`;
}

/** Max absolute amplitude per bucket (0..1), used for waveform rendering. */
export function peaks(samples: Float32Array, buckets: number): number[] {
  if (buckets <= 0) return [];
  if (samples.length === 0) return new Array(buckets).fill(0);
  const result = new Array<number>(buckets).fill(0);
  const bucketSize = samples.length / buckets;
  for (let bucket = 0; bucket < buckets; bucket++) {
    const start = Math.floor(bucket * bucketSize);
    const end = Math.max(start + 1, Math.floor((bucket + 1) * bucketSize));
    let max = 0;
    for (let i = start; i < end && i < samples.length; i++) {
      const value = Math.abs(samples[i] as number);
      if (value > max) max = value;
    }
    result[bucket] = max;
  }
  return result;
}
