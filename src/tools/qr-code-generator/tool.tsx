"use client";

import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { downloadBytes, downloadText } from "@/components/kit/download-button";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { Segmented } from "@/components/kit/segmented";
import { InkButton, Panel, ToolShell, ToolTabs, useWorkbenchKeys } from "@/components/kit/tool-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  DEFAULT_DARK,
  DEFAULT_LIGHT,
  qrPayload,
  renderQr,
  type EccLevel,
  type QrRequest,
  type QrType,
  type WifiSecurity,
} from "@/tools/qr-code-generator/lib/qr";

const emptyVcard = { name: "", phone: "", email: "", org: "", title: "", url: "" };

export default function QrTool() {
  const [type, setType] = useState<QrType>("url");
  const [text, setText] = useState("Hello from Benchline");
  const [url, setUrl] = useState("https://tools.fabwaseem.com");
  const [ssid, setSsid] = useState("");
  const [password, setPassword] = useState("");
  const [security, setSecurity] = useState<WifiSecurity>("WPA");
  const [hidden, setHidden] = useState(false);
  const [vcard, setVcard] = useState(emptyVcard);
  const [ecc, setEcc] = useState<EccLevel>("M");
  const [dark, setDark] = useState(DEFAULT_DARK);
  const [light, setLight] = useState(DEFAULT_LIGHT);
  const [margin, setMargin] = useState<"1" | "2" | "4">("2");
  const [size, setSize] = useState<"256" | "512" | "1024">("512");
  const [svg, setSvg] = useState("");
  const [png, setPng] = useState("");
  const [payload, setPayload] = useState("");
  const [error, setError] = useState("");

  const request = useMemo<QrRequest>(() => ({
    type,
    text,
    url,
    wifi: { ssid, password, security, hidden },
    vcard,
  }), [type, text, url, ssid, password, security, hidden, vcard]);

  useEffect(() => {
    let cancel = false;
    const timer = window.setTimeout(() => {
      try {
        const next = qrPayload(request);
        void renderQr(next, { ecc, dark, light, margin: Number(margin), size: Number(size) }).then((rendered) => {
          if (cancel) return;
          setPayload(next);
          setSvg(rendered.svg);
          setPng(rendered.pngBase64);
          setError("");
        }).catch((caught: unknown) => {
          if (cancel) return;
          setSvg("");
          setPng("");
          setError(caught instanceof Error ? caught.message : "Could not draw that code.");
        });
      } catch (caught) {
        if (!cancel) {
          setSvg("");
          setPng("");
          setPayload("");
          setError(caught instanceof Error ? caught.message : "Could not build that code.");
        }
      }
    }, 80);
    return () => {
      cancel = true;
      window.clearTimeout(timer);
    };
  }, [request, ecc, dark, light, margin, size]);

  function downloadPng() {
    if (!png) return;
    const binary = atob(png);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    downloadBytes("qr-code.png", bytes, "image/png");
  }

  function downloadSvg() {
    if (svg) downloadText("qr-code.svg", svg, "image/svg+xml");
  }

  useWorkbenchKeys({
    onEnter: downloadPng,
    onCopy: () => { if (svg) void navigator.clipboard.writeText(svg).then(() => toast.success("SVG copied")); },
  });

  return (
    <ToolShell
      runsLocally
      layout="split+inspector"
      flow="band"
      columns="min-[1280px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_300px]"
      tabs={<ToolTabs label="QR contents" value={type} onChange={setType} options={[
        { value: "text", label: "Text" },
        { value: "url", label: "URL" },
        { value: "wifi", label: "Wi-Fi" },
        { value: "vcard", label: "vCard" },
      ]} />}
      actions={<InkButton icon={<Download size={15} />} onClick={downloadPng} disabled={!png}>Download PNG</InkButton>}
      status={
        <>
          <span className={error ? "dot dot-warn" : "dot"} />
          <span>{error || "Static code, drawn in this browser"}</span>
          <span className="ml-auto hidden min-[700px]:inline">⌘⇧C copy SVG · ⌘↵ PNG</span>
        </>
      }
      input={
        <Panel title="Contents">
          {type === "text" ? (
            <FieldRow label="Text" htmlFor="qr-text" help="Up to 2,000 characters. The sample text is a placeholder.">
              <Textarea id="qr-text" value={text} onChange={(event) => setText(event.target.value)} />
            </FieldRow>
          ) : null}
          {type === "url" ? (
            <FieldRow label="URL" htmlFor="qr-url" help="Include https://. The sample points at this site.">
              <Input id="qr-url" value={url} onChange={(event) => setUrl(event.target.value)} />
            </FieldRow>
          ) : null}
          {type === "wifi" ? (
            <>
              <FieldRow label="Network name" htmlFor="ssid"><Input id="ssid" value={ssid} onChange={(event) => setSsid(event.target.value)} /></FieldRow>
              <FieldRow label="Security" htmlFor="security">
                <Segmented label="Wi-Fi security" value={security} onChange={setSecurity} options={[
                  { value: "WPA", label: "WPA" },
                  { value: "WEP", label: "WEP" },
                  { value: "nopass", label: "None" },
                ]} />
              </FieldRow>
              {security === "nopass" ? null : (
                <FieldRow label="Password" htmlFor="wifi-password" help="The password is stored in the image.">
                  <Input id="wifi-password" value={password} onChange={(event) => setPassword(event.target.value)} />
                </FieldRow>
              )}
              <label className="flex min-h-11 items-center justify-between gap-3 text-sm">
                Hidden network
                <Switch checked={hidden} onCheckedChange={setHidden} />
              </label>
            </>
          ) : null}
          {type === "vcard" ? (
            <>
              <FieldRow label="Name" htmlFor="vc-name"><Input id="vc-name" value={vcard.name} onChange={(event) => setVcard({ ...vcard, name: event.target.value })} /></FieldRow>
              <FieldRow label="Phone" htmlFor="vc-phone"><Input id="vc-phone" value={vcard.phone} onChange={(event) => setVcard({ ...vcard, phone: event.target.value })} /></FieldRow>
              <FieldRow label="Email" htmlFor="vc-email"><Input id="vc-email" type="email" value={vcard.email} onChange={(event) => setVcard({ ...vcard, email: event.target.value })} /></FieldRow>
              <FieldRow label="Organization" htmlFor="vc-org"><Input id="vc-org" value={vcard.org} onChange={(event) => setVcard({ ...vcard, org: event.target.value })} /></FieldRow>
              <FieldRow label="Title" htmlFor="vc-title"><Input id="vc-title" value={vcard.title} onChange={(event) => setVcard({ ...vcard, title: event.target.value })} /></FieldRow>
              <FieldRow label="URL" htmlFor="vc-url"><Input id="vc-url" value={vcard.url} onChange={(event) => setVcard({ ...vcard, url: event.target.value })} /></FieldRow>
            </>
          ) : null}
        </Panel>
      }
      output={
        <Panel title="Code">
          {error ? <Notice tone="bad" role="alert" title="No code yet" body={error} /> : null}
          {png ? (
            <div className="flex flex-col items-start gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`data:image/png;base64,${png}`} alt="QR code preview" className="w-full max-w-64 rounded-lg border border-border bg-background p-3" />
              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={downloadPng}><Download />PNG</Button>
                <Button type="button" variant="outline" onClick={downloadSvg}><Download />SVG</Button>
              </div>
              <p className="max-w-sm font-mono text-[12px] break-all text-muted-foreground">{payload}</p>
            </div>
          ) : <EmptyState title="Fill in the fields" hint="The code updates as you type. It does not call a tracking service." />}
        </Panel>
      }
      inspector={
        <Panel title="Style">
          <FieldRow label="Error correction" htmlFor="ecc" help="L 7%, M 15%, Q 25%, H 30% recovery.">
            <Segmented label="Error correction" value={ecc} onChange={setEcc} options={[
              { value: "L", label: "L" },
              { value: "M", label: "M" },
              { value: "Q", label: "Q" },
              { value: "H", label: "H" },
            ]} />
          </FieldRow>
          <FieldRow label="Foreground" htmlFor="dark">
            <div className="flex items-center gap-2">
              <input id="dark" type="color" value={toColorInput(dark, DEFAULT_DARK)} aria-label="Foreground color" className="size-8 cursor-pointer rounded-md border border-border bg-transparent" onChange={(event) => setDark(event.target.value)} />
              <Input value={dark} onChange={(event) => setDark(event.target.value)} aria-label="Foreground hex" />
            </div>
          </FieldRow>
          <FieldRow label="Background" htmlFor="light">
            <div className="flex items-center gap-2">
              <input id="light" type="color" value={toColorInput(light, DEFAULT_LIGHT)} aria-label="Background color" className="size-8 cursor-pointer rounded-md border border-border bg-transparent" onChange={(event) => setLight(event.target.value)} />
              <Input value={light} onChange={(event) => setLight(event.target.value)} aria-label="Background hex" />
            </div>
          </FieldRow>
          <FieldRow label="Quiet zone" htmlFor="margin">
            <Segmented label="Quiet zone" value={margin} onChange={setMargin} options={[
              { value: "1", label: "1" },
              { value: "2", label: "2" },
              { value: "4", label: "4" },
            ]} />
          </FieldRow>
          <FieldRow label="PNG size" htmlFor="size">
            <Segmented label="PNG size" value={size} onChange={setSize} options={[
              { value: "256", label: "256" },
              { value: "512", label: "512" },
              { value: "1024", label: "1024" },
            ]} />
          </FieldRow>
        </Panel>
      }
    />
  );
}

function toColorInput(value: string, fallback: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value : fallback;
}
