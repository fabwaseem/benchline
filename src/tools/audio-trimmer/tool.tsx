"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ActionButton, Slider } from "@/components/kit/controls";
import { Download, Pause, Play } from "lucide-react";
import { downloadBytes } from "@/components/kit/download-button";
import { Dropzone } from "@/components/kit/dropzone";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { ResultStat } from "@/components/kit/result-stat";
import { Pane, StatusStrip, ToolCard, ToolPanes, ToolToolbar } from "@/components/kit/shell";
import { useWorkbenchKeys } from "@/components/kit/tool-shell";
import { formatBytes } from "@/lib/image-format";
import { applyFade, encodeWav, formatTime, peaks, trimSamples } from "@/tools/audio-trimmer/lib/audio";

type Selection = { start: number; end: number };
const PEAK_BUCKETS = 1200;
const FADE_MAX = 5;

export default function AudioTrimmerTool() {
  const [fileName, setFileName] = useState("");
  const [duration, setDuration] = useState(0);
  const [sourceBytes, setSourceBytes] = useState(0);
  const [peakData, setPeakData] = useState<number[]>([]);
  const [selection, setSelection] = useState<Selection>({ start: 0, end: 0 });
  const [fadeIn, setFadeIn] = useState(0);
  const [fadeOut, setFadeOut] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);

  const audioCtx = useRef<AudioContext | null>(null);
  const buffer = useRef<AudioBuffer | null>(null);
  const source = useRef<AudioBufferSourceNode | null>(null);
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const dragAnchor = useRef<number | null>(null);
  const prevSelection = useRef<Selection | null>(null);

  function getCtx(): AudioContext {
    if (!audioCtx.current) audioCtx.current = new AudioContext();
    return audioCtx.current;
  }

  async function addFile(files: File[]) {
    const file = files[0];
    if (!file) return;
    setError("");
    setBusy(true);
    stopPlayback();
    try {
      const ctx = getCtx();
      await ctx.resume();
      const raw = await file.arrayBuffer();
      const decoded = await ctx.decodeAudioData(raw.slice(0));
      if (decoded.duration <= 0 || decoded.length === 0) throw new Error("That audio file is empty.");
      buffer.current = decoded;
      const mono = new Float32Array(decoded.length);
      for (let channel = 0; channel < decoded.numberOfChannels; channel++) {
        const data = decoded.getChannelData(channel);
        for (let i = 0; i < decoded.length; i++) mono[i] = (mono[i] as number) + (data[i] as number) / decoded.numberOfChannels;
      }
      setPeakData(peaks(mono, PEAK_BUCKETS));
      setFileName(file.name || "audio");
      setDuration(decoded.duration);
      setSourceBytes(decoded.length * decoded.numberOfChannels * 4);
      setSelection({ start: 0, end: decoded.duration });
      setFadeIn(0);
      setFadeOut(0);
      setReady(true);
    } catch (caught) {
      buffer.current = null;
      setReady(false);
      setPeakData([]);
      setError(caught instanceof Error && caught.message.includes("empty") ? caught.message : "Could not decode that audio file. Try another format.");
    } finally {
      setBusy(false);
    }
  }

  const draw = useCallback(() => {
    const node = canvas.current;
    if (!node || peakData.length === 0) return;
    const width = node.clientWidth;
    const height = node.clientHeight;
    if (width === 0 || height === 0) return;
    const dpr = window.devicePixelRatio || 1;
    node.width = Math.round(width * dpr);
    node.height = Math.round(height * dpr);
    const ctx2d = node.getContext("2d");
    if (!ctx2d) return;
    ctx2d.scale(dpr, dpr);
    ctx2d.clearRect(0, 0, width, height);
    ctx2d.fillStyle = getComputedStyle(node).color;
    for (let x = 0; x < width; x++) {
      const peak = peakData[Math.min(peakData.length - 1, Math.floor((x / width) * peakData.length))] ?? 0;
      const bar = Math.max(1, peak * (height - 6));
      ctx2d.fillRect(x, (height - bar) / 2, 1, bar);
    }
  }, [peakData]);

  useEffect(() => {
    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [draw]);

  function timeAt(clientX: number, node: HTMLDivElement): number {
    const rect = node.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return ratio * duration;
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!ready) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    prevSelection.current = selection;
    const time = timeAt(event.clientX, event.currentTarget);
    dragAnchor.current = time;
    setSelection({ start: time, end: time });
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (dragAnchor.current == null) return;
    const time = timeAt(event.clientX, event.currentTarget);
    setSelection({ start: Math.min(dragAnchor.current, time), end: Math.max(dragAnchor.current, time) });
  }

  function onPointerUp() {
    if (dragAnchor.current == null) return;
    dragAnchor.current = null;
    // A bare click keeps the previous selection instead of making an empty one.
    setSelection((current) => {
      if (current.end - current.start < 0.01 && prevSelection.current) return prevSelection.current;
      return current;
    });
    prevSelection.current = null;
  }

  function stopPlayback() {
    try { source.current?.stop(); } catch { /* already stopped */ }
    source.current = null;
    setPlaying(false);
  }

  function buildSelectionBuffer(): AudioBuffer | null {
    const ctx = getCtx();
    const decoded = buffer.current;
    if (!decoded) return null;
    const channels = Array.from({ length: decoded.numberOfChannels }, (_, channel) =>
      Float32Array.from(decoded.getChannelData(channel)),
    );
    const trimmed = trimSamples(channels, decoded.sampleRate, selection.start, selection.end);
    const faded = applyFade(trimmed, decoded.sampleRate, fadeIn, fadeOut);
    const out = ctx.createBuffer(decoded.numberOfChannels, (faded[0] as Float32Array).length, decoded.sampleRate);
    faded.forEach((channel, index) => out.getChannelData(index).set(channel));
    return out;
  }

  function togglePlay() {
    if (playing) {
      stopPlayback();
      return;
    }
    setError("");
    try {
      const ctx = getCtx();
      void ctx.resume();
      const selected = buildSelectionBuffer();
      if (!selected) return;
      const node = ctx.createBufferSource();
      node.buffer = selected;
      node.onended = () => { source.current = null; setPlaying(false); };
      node.connect(ctx.destination);
      source.current = node;
      node.start();
      setPlaying(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not play the selection.");
    }
  }

  function exportWav() {
    setError("");
    try {
      const selected = buildSelectionBuffer();
      if (!selected) return;
      const channels = Array.from({ length: selected.numberOfChannels }, (_, channel) =>
        Float32Array.from(selected.getChannelData(channel)),
      );
      const bytes = encodeWav(channels, selected.sampleRate);
      downloadBytes("trimmed.wav", bytes, "audio/wav");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not export the audio.");
    }
  }

  useWorkbenchKeys({ onEnter: () => { if (ready) exportWav(); }, onEscape: stopPlayback });

  const selectionLength = Math.max(0, selection.end - selection.start);
  const fadeMax = Math.min(FADE_MAX, selectionLength / 2);
  const leftPct = duration > 0 ? (selection.start / duration) * 100 : 0;
  const widthPct = duration > 0 ? ((selection.end - selection.start) / duration) * 100 : 0;
  const fadeInPct = selectionLength > 0 ? (Math.min(fadeIn, selectionLength) / selectionLength) * 100 : 0;
  const fadeOutPct = selectionLength > 0 ? (Math.min(fadeOut, selectionLength) / selectionLength) * 100 : 0;

  return (
    <ToolCard>
      <ToolToolbar
        actions={
          <ActionButton className="btn btn-ink" onClick={exportWav} disabled={!ready || busy}>
            <Download />Export WAV
          </ActionButton>
        }
      />
      <ToolPanes ratio="60/40">
        <Pane label="Audio">
          <Dropzone
            accept="audio/*,.mp3,.m4a,.ogg,.wav,.flac,.aac"
            onFiles={(files) => void addFile(files)}
            label="Drop audio. It stays in this browser."
            invalid={Boolean(error)}
            disabled={busy}
          />
          {error ? <Notice tone="bad" role="alert" title="Something went wrong" body={error} /> : null}
          {ready ? (
            <div className="flex flex-col gap-2">
              <div
                className="relative h-32 w-full cursor-crosshair touch-none overflow-hidden rounded-lg bg-well select-none"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                role="group"
                aria-label="Trim region"
                aria-describedby="trim-hint"
              >
                <canvas ref={canvas} className="text-brand absolute inset-0 h-full w-full" />
                <div className="pointer-events-none absolute inset-y-0 left-0 bg-background/60" style={{ width: `${leftPct}%` }} />
                <div className="pointer-events-none absolute inset-y-0 right-0 bg-background/60" style={{ width: `${100 - leftPct - widthPct}%` }} />
                <div className="pointer-events-none absolute inset-y-0 bg-brand/25" style={{ left: `${leftPct}%`, width: `${fadeInPct * (widthPct / 100)}%` }} />
                <div className="pointer-events-none absolute inset-y-0 bg-brand/25" style={{ left: `${leftPct + widthPct - fadeOutPct * (widthPct / 100)}%`, width: `${fadeOutPct * (widthPct / 100)}%` }} />
                <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-brand" style={{ left: `${leftPct}%` }} />
                <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-brand" style={{ left: `${leftPct + widthPct}%` }} />
              </div>
              <p id="trim-hint" className="text-[12px] text-faint">Drag across the waveform to choose the part to keep.</p>
              <div className="grid grid-cols-3 gap-2">
                <ResultStat label="Start" value={formatTime(selection.start)} />
                <ResultStat label="End" value={formatTime(selection.end)} />
                <ResultStat label="Length" value={formatTime(selectionLength)} />
              </div>
            </div>
          ) : (
            <EmptyState title="No audio yet" hint="Drop an MP3, M4A, OGG, FLAC, or WAV. It is decoded in this browser, never uploaded." />
          )}
        </Pane>
        <Pane label="Trim & export">
          <div className="flex flex-col gap-4">
            <FieldRow label="Fade in" htmlFor="fade-in" help={`Rises from silence over the first ${formatTime(fadeIn)} of the selection.`}>
              <Slider id="fade-in" value={[fadeIn]} min={0} max={fadeMax} step={0.05} disabled={!ready} onValueChange={([value]) => setFadeIn(value ?? 0)} />
            </FieldRow>
            <FieldRow label="Fade out" htmlFor="fade-out" help={`Falls to silence over the last ${formatTime(fadeOut)} of the selection.`}>
              <Slider id="fade-out" value={[fadeOut]} min={0} max={fadeMax} step={0.05} disabled={!ready} onValueChange={([value]) => setFadeOut(value ?? 0)} />
            </FieldRow>
            <ActionButton variant="outline" onClick={togglePlay} disabled={!ready || selectionLength <= 0}>
              {playing ? <Pause /> : <Play />}{playing ? "Stop" : "Play selection"}
            </ActionButton>
            {ready ? (
              <div className="grid grid-cols-2 gap-2">
                <ResultStat label="Source" value={formatBytes(sourceBytes)} />
                <ResultStat label="Duration" value={formatTime(duration)} />
              </div>
            ) : null}
            <Notice tone="neutral" title="Nothing is uploaded." body="Decoding, trimming, and the WAV export all happen in this tab. The export is 16-bit PCM WAV." />
          </div>
        </Pane>
      </ToolPanes>
      <StatusStrip
        note={error || (ready ? "Drag the waveform to set the trim region" : "Audio stays in this browser")}
        tone={error ? "warn" : "pass"}
        trailing="⌘↵ export"
        items={[
          {
            level: "info",
            label: "Audio",
            detail: ready ? `${fileName} · ${formatTime(duration)}` : "Waiting for audio",
          },
        ]}
      />
    </ToolCard>
  );
}
