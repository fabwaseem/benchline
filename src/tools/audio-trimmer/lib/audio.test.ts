import { describe, expect, it } from "vitest";
import {
  applyFade,
  decodeWav,
  encodeWav,
  formatTime,
  peaks,
  trimSamples,
} from "./audio";

function sineWave(frames: number, channels: number): Float32Array[] {
  return Array.from({ length: channels }, (_, channel) =>
    Float32Array.from({ length: frames }, (_, i) => Math.sin((2 * Math.PI * (i + channel * 7)) / 64) * 0.8),
  );
}

describe("encodeWav / decodeWav roundtrip", () => {
  it("preserves samples through 16-bit PCM", () => {
    const samples = sineWave(4410, 2);
    const encoded = encodeWav(samples, 44100);
    expect(encoded.byteLength).toBe(44 + 4410 * 2 * 2);
    const decoded = decodeWav(encoded);
    expect(decoded.sampleRate).toBe(44100);
    expect(decoded.channels).toBe(2);
    expect(decoded.bitsPerSample).toBe(16);
    expect(decoded.samples).toHaveLength(2);
    for (let channel = 0; channel < 2; channel++) {
      const original = samples[channel] as Float32Array;
      const roundtripped = decoded.samples[channel] as Float32Array;
      expect(roundtripped.length).toBe(original.length);
      for (let i = 0; i < original.length; i++) {
        // 16-bit quantization plus the 32767/32768 scale asymmetry: bounded by ~1.5 LSB.
        expect(Math.abs((roundtripped[i] as number) - (original[i] as number))).toBeLessThan(1 / 16384);
      }
    }
  });

  it("roundtrips mono", () => {
    const decoded = decodeWav(encodeWav(sineWave(100, 1), 8000));
    expect(decoded.channels).toBe(1);
    expect(decoded.samples[0]).toHaveLength(100);
  });
});

describe("decodeWav errors", () => {
  it("rejects a non-WAV file", () => {
    expect(() => decodeWav(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]))).toThrow(/RIFF/);
  });

  it("rejects IEEE-float encoding", () => {
    const bytes = encodeWav(sineWave(64, 1), 44100);
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    view.setUint16(20, 3, true); // audio format 3 = IEEE float
    expect(() => decodeWav(bytes)).toThrow(/IEEE-float/);
  });

  it("rejects truncated data", () => {
    const bytes = encodeWav(sineWave(64, 1), 44100);
    expect(() => decodeWav(bytes.slice(0, bytes.byteLength - 5))).toThrow(/truncated/i);
  });

  it("rejects a missing data chunk", () => {
    const bytes = new Uint8Array(44);
    const view = new DataView(bytes.buffer);
    for (const [offset, tag] of [[0, "RIFF"], [8, "WAVE"], [12, "fmt "]] as const) {
      for (let i = 0; i < 4; i++) view.setUint8(offset + i, tag.charCodeAt(i));
    }
    view.setUint32(4, 36, true);
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, 44100, true);
    view.setUint32(28, 88200, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    expect(() => decodeWav(bytes)).toThrow(/no data chunk/);
  });
});

describe("trimSamples", () => {
  const sampleRate = 1000;
  const samples = [Float32Array.from({ length: 1000 }, (_, i) => i)];

  it("keeps the requested window", () => {
    const trimmed = trimSamples(samples, sampleRate, 0.2, 0.5);
    expect(trimmed[0]?.length).toBe(300);
    expect(trimmed[0]?.[0]).toBe(200);
    expect(trimmed[0]?.[299]).toBe(499);
  });

  it("rejects invalid ranges", () => {
    expect(() => trimSamples(samples, sampleRate, -0.1, 0.5)).toThrow(/before 0/);
    expect(() => trimSamples(samples, sampleRate, 0.5, 0.5)).toThrow(/before trim end/);
    expect(() => trimSamples(samples, sampleRate, 0.7, 0.5)).toThrow(/before trim end/);
    expect(() => trimSamples(samples, sampleRate, 0.2, 2)).toThrow(/past the audio duration/);
    expect(() => trimSamples(samples, sampleRate, Number.NaN, 0.5)).toThrow(/finite/);
  });
});

describe("applyFade", () => {
  const sampleRate = 1000;

  it("fades in from ~0 and out to ~0, leaving the middle untouched", () => {
    const channel = new Float32Array(1000).fill(1);
    const [faded] = applyFade([channel], sampleRate, 0.1, 0.1);
    expect(faded as Float32Array).toBeDefined();
    const out = faded as Float32Array;
    expect(out[0]).toBeCloseTo(0, 5);
    expect(out[999]).toBeCloseTo(0, 5);
    expect(out[500]).toBe(1);
    // Envelope ramps monotonically.
    expect(out[50]).toBeLessThan(out[60]);
    expect(out[950]).toBeLessThan(out[940]);
  });

  it("does not mutate the input and clamps oversized fades", () => {
    const channel = new Float32Array(100).fill(0.5);
    const [faded] = applyFade([channel], sampleRate, 10, 0);
    expect(channel[0]).toBe(0.5);
    expect((faded as Float32Array)[0]).toBeCloseTo(0, 5);
    // The fade spans the whole buffer, so the last frame is at 99/100 of the ramp.
    expect((faded as Float32Array)[99]).toBeCloseTo(0.495, 5);
  });

  it("rejects negative fades", () => {
    expect(() => applyFade([new Float32Array(10)], sampleRate, -1, 0)).toThrow(/negative/);
  });
});

describe("formatTime", () => {
  it("formats m:ss.mmm", () => {
    expect(formatTime(0)).toBe("0:00.000");
    expect(formatTime(5.5)).toBe("0:05.500");
    expect(formatTime(61.25)).toBe("1:01.250");
    expect(formatTime(61.23456)).toBe("1:01.235");
    expect(formatTime(3599.999)).toBe("59:59.999");
  });
});

describe("peaks", () => {
  it("returns max abs amplitude per bucket in 0..1", () => {
    const channel = new Float32Array([0.1, -0.5, 0.9, -0.2]);
    const result = peaks(channel, 2);
    expect(result).toHaveLength(2);
    expect(result[0]).toBeCloseTo(0.5, 5);
    expect(result[1]).toBeCloseTo(0.9, 5);
    expect(result.every((value) => value >= 0 && value <= 1)).toBe(true);
  });

  it("handles empty input", () => {
    expect(peaks(new Float32Array(0), 10)).toEqual(new Array(10).fill(0));
    expect(peaks(new Float32Array([1]), 0)).toEqual([]);
  });
});
