"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, ScanBarcode } from "lucide-react";
import { toast } from "sonner";
import { ActionButton } from "@/components/kit/controls";
import { CopyButton } from "@/components/kit/copy-button";
import { Dropzone } from "@/components/kit/dropzone";
import { EmptyState } from "@/components/kit/empty-state";
import { Notice } from "@/components/kit/notice";
import { ResultStat } from "@/components/kit/result-stat";
import { InkButton, Panel, ToolShell, ToolTabs, useWorkbenchKeys } from "@/components/kit/tool-shell";
import { IMAGE_ACCEPT } from "@/lib/image-format";
import { fileToBitmap } from "@/lib/client-image";
import type { BarcodeHit } from "@/tools/qr-code-reader/lib/codes";

const MAX_FILE = 40 * 1024 * 1024;

async function imageDataFromFile(file: File) {
  const bitmap = await fileToBitmap(file);
  try {
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("This browser could not read the picture.");
    context.drawImage(bitmap, 0, 0, width, height);
    return context.getImageData(0, 0, width, height);
  } finally {
    bitmap.close();
  }
}

export default function QrReaderTool() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [codes, setCodes] = useState<BarcodeHit[]>([]);
  const [busy, setBusy] = useState(false);
  const [camera, setCamera] = useState(false);
  const [error, setError] = useState("");
  const [source, setSource] = useState("Waiting for an image");

  async function readFile(file: File) {
    if (file.size > MAX_FILE) {
      setError("Images larger than 40 MB stay out of this page.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const image = await imageDataFromFile(file);
      const { scanBarcodes } = await import("@/tools/qr-code-reader/lib/scan");
      const hits = await scanBarcodes(image);
      setCodes(hits);
      setSource(file.name);
      if (hits.length === 0) setError("No code found in that image.");
    } catch (caught) {
      setCodes([]);
      setError(caught instanceof Error ? caught.message : "Could not read that image.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    function onPaste(event: ClipboardEvent) {
      const file = [...(event.clipboardData?.files ?? [])].find((item) => item.type.startsWith("image/"));
      if (file) void readFile(file);
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, []);

  useEffect(() => {
    if (!camera) return;
    let stop = false;
    let timer = 0;
    async function tick() {
      const video = videoRef.current;
      if (stop) return;
      if (!video || video.readyState < 2 || video.videoWidth < 2) {
        timer = window.setTimeout(() => void tick(), 240);
        return;
      }
      const scale = Math.min(1, 900 / video.videoWidth);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
      canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
      const context = canvas.getContext("2d");
      if (!context) return;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      try {
        const { scanBarcodes } = await import("@/tools/qr-code-reader/lib/scan");
        const hits = await scanBarcodes(context.getImageData(0, 0, canvas.width, canvas.height));
        if (!stop && hits.length > 0) {
          setCodes(hits);
          setSource("Camera");
          setError("");
        }
      } catch {
        if (!stop) setError("The camera frame could not be read.");
      }
      timer = window.setTimeout(() => void tick(), 450);
    }
    void tick();
    return () => {
      stop = true;
      window.clearTimeout(timer);
    };
  }, [camera]);

  async function toggleCamera() {
    if (camera) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setCamera(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCamera(true);
      setError("");
    } catch {
      setError("Camera access was blocked. You can still drop or paste an image.");
    }
  }

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  useWorkbenchKeys({
    onCopy: () => {
      const text = codes.map((code) => code.text).join("\n");
      if (text) void navigator.clipboard.writeText(text).then(() => toast.success("Copied"));
    },
  });

  return (
    <ToolShell
      runsLocally
      busy={busy}
      layout="split"
      tabs={<ToolTabs label="Source" value="image" onChange={() => {}} options={[{ value: "image", label: "Image" }]} />}
      actions={<InkButton icon={<Camera size={15} />} onClick={() => void toggleCamera()}>{camera ? "Stop camera" : "Camera"}</InkButton>}
      status={
        <>
          <span className={error ? "dot dot-warn" : "dot"} />
          <span>{error || `${codes.length} code${codes.length === 1 ? "" : "s"} · ${source}`}</span>
          <span className="ml-auto hidden min-[700px]:inline">Paste an image · stays in this browser</span>
        </>
      }
      input={
        <Panel title="Picture">
          <Notice tone="neutral" title="Nothing is uploaded." body="Drop a photo, paste one, or use the camera. Decoding stays on this device." />
          <Dropzone accept={IMAGE_ACCEPT} label="Drop an image, or click to choose one" onFile={(file) => void readFile(file)} />
          {camera ? (
            <video ref={videoRef} autoPlay playsInline muted className="aspect-video w-full rounded-lg bg-sunken object-cover" />
          ) : null}
          <ActionButton type="button" variant="outline" onClick={() => void toggleCamera()}>
            <Camera />{camera ? "Stop camera" : "Use camera"}
          </ActionButton>
        </Panel>
      }
      output={
        <Panel title="Codes">
          {codes.length === 0 ? (
            <EmptyState art={<ScanBarcode size={22} />} title="No code yet" hint="A QR code or barcode in the picture shows up here with its format." />
          ) : (
            <ul className="flex flex-col gap-2">
              {codes.map((code) => (
                <li key={`${code.format}-${code.text}`} className="rounded-lg border border-border p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="font-mono text-[12px] text-muted-foreground">{code.label}</span>
                    <CopyButton value={code.text} />
                  </div>
                  <p className="font-mono text-sm break-all">{code.text}</p>
                </li>
              ))}
            </ul>
          )}
          <div className="grid grid-cols-2 gap-2">
            <ResultStat variant="well" label="Codes" value={String(codes.length)} />
            <ResultStat variant="well" label="Source" value={source === "Waiting for an image" ? "—" : source} />
          </div>
        </Panel>
      }
    />
  );
}
