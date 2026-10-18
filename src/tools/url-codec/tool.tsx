"use client";

import { useMemo, useState } from "react";
import { ChipButton, OptionRow, TextInput, TextArea } from "@/components/kit/controls";
import { Link } from "lucide-react";
import { CopyButton } from "@/components/kit/copy-button";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { Segmented } from "@/components/kit/segmented";
import { Pane, StatusStrip, ToolCard, ToolPanes, ToolToolbar } from "@/components/kit/shell";
import { decodeUrl, encodeUrl, parseUrl, replaceQuery, serializeQuery, utmKeys, withUtm, type EncodeMode, type QueryParam } from "@/tools/url-codec/lib/url";

export default function UrlCodecTool() {
  const [tab, setTab] = useState<"encode" | "decode" | "parse">("encode");
  const [text, setText] = useState("a b/c?");
  const [mode, setMode] = useState<EncodeMode>("component");
  const [plusAsSpace, setPlusAsSpace] = useState(true);
  const [url, setUrl] = useState("https://example.com/docs?q=hello+world");
  const [params, setParams] = useState<QueryParam[] | null>(null);

  const encoded = encodeUrl(text, mode);
  const decoded = decodeUrl(text, plusAsSpace);
  const parsed = useMemo(() => parseUrl(url), [url]);
  const activeParams = params ?? ("error" in parsed ? [] : parsed.params);
  const rebuilt = replaceQuery(url, activeParams);

  function editParam(index: number, patch: Partial<QueryParam>) {
    const next = activeParams.map((param, item) => (item === index ? { ...param, ...patch } : param));
    setParams(next);
  }

  const note = tab === "parse" ? `${activeParams.length} parameters` : mode === "component" ? "Component encoding" : "Full encoding";

  return (
    <ToolCard>
      <ToolToolbar
        label="Mode"
        options={[{ value: "encode", label: "Encode" }, { value: "decode", label: "Decode" }, { value: "parse", label: "Parse" }]}
        value={tab}
        onChange={setTab}
      />
      <ToolPanes>
        <Pane label={tab === "parse" ? "URL" : "Text"}>
          {tab === "parse" ? (
            <FieldRow label="URL or query string" htmlFor="url-input" error={"error" in parsed ? parsed.error : undefined}>
              <TextArea id="url-input" value={url} onChange={(event) => { setUrl(event.target.value); setParams(null); }} className="min-h-28 font-mono" aria-invalid={"error" in parsed} />
            </FieldRow>
          ) : (
            <>
              <FieldRow label={tab === "encode" ? "Plain text" : "Encoded text"} htmlFor="url-text">
                <TextArea id="url-text" value={text} onChange={(event) => setText(event.target.value)} className="min-h-28 font-mono" />
              </FieldRow>
              {tab === "encode" ? (
                <Segmented label="Encoding" value={mode} onChange={setMode} options={[{ value: "component", label: "Component" }, { value: "full", label: "Full URL" }]} />
              ) : (
                <OptionRow label="Treat + as space" checked={plusAsSpace} onChange={setPlusAsSpace} />
              )}
            </>
          )}
        </Pane>
        <Pane label={tab === "encode" ? "Encoded" : tab === "decode" ? "Decoded" : "Parts"}>
          <div aria-live="polite" className="flex flex-col gap-3">
          {tab === "encode" ? (
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 flex-1 truncate font-mono text-[13px]" title={encoded}>{encoded || " "}</p>
                <CopyButton value={encoded} />
              </div>
          ) : null}
          {tab === "decode" ? (
              "error" in decoded ? <Notice tone="bad" role="alert" title={decoded.error} /> : (
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 flex-1 truncate font-mono text-[13px]" title={decoded.value}>{decoded.value || " "}</p>
                  <CopyButton value={decoded.value} />
                </div>
              )
          ) : null}
          {tab === "parse" ? (
            <>
              {"error" in parsed ? (
                <EmptyState art={<Link size={22} />} title="No URL" hint="Paste a full URL or a query string such as a=1&b=2." />
              ) : (
                <>
                  <dl className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-x-3 gap-y-1 text-[13px]">
                    <Part name="Protocol" value={parsed.protocol} />
                    <Part name="Host" value={parsed.hostname} />
                    <Part name="Port" value={parsed.port} />
                    <Part name="Path" value={parsed.pathname} />
                    <Part name="Hash" value={parsed.hash} />
                  </dl>
                  <div className="flex flex-col gap-2">
                    {activeParams.map((param, index) => (
                      <div key={`${param.key}-${index}`} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-2">
                        <TextInput aria-label={`Parameter ${index + 1} name`} value={param.key} onChange={(event) => editParam(index, { key: event.target.value })} className="font-mono" />
                        <TextInput aria-label={`Parameter ${index + 1} value`} value={param.value} onChange={(event) => editParam(index, { value: event.target.value })} className="font-mono" />
                        <ChipButton onClick={() => setParams(activeParams.filter((_, item) => item !== index))}>Remove</ChipButton>
                      </div>
                    ))}
                    <ChipButton onClick={() => setParams([...activeParams, { key: "", value: "" }])}>Add parameter</ChipButton>
                  </div>
                  <div className="grid gap-2 min-[700px]:grid-cols-2">
                    {utmKeys.map((key) => (
                      <FieldRow key={key} label={key} htmlFor={`utm-${key}`}>
                        <TextInput
                          id={`utm-${key}`}
                          value={activeParams.find((param) => param.key === key)?.value ?? ""}
                          onChange={(event) => {
                            const current = Object.fromEntries(utmKeys.map((item) => [item, activeParams.find((param) => param.key === item)?.value ?? ""]));
                            setParams(withUtm(activeParams, { ...current, [key]: event.target.value }));
                          }}
                        />
                      </FieldRow>
                    ))}
                  </div>
                  {typeof rebuilt === "string" ? (
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-mono text-[13px] break-all">{rebuilt || serializeQuery(activeParams)}</p>
                      <CopyButton value={rebuilt} />
                    </div>
                  ) : <Notice tone="bad" title={rebuilt.error} />}
                </>
              )}
            </>
          ) : null}
          </div>
        </Pane>
      </ToolPanes>
      <StatusStrip note={note} tone={"error" in parsed && tab === "parse" ? "warn" : "pass"} />
    </ToolCard>
  );
}

function Part({ name, value }: { name: string; value: string }) {
  return (
    <>
      <dt className="text-muted-foreground">{name}</dt>
      <dd className="truncate font-mono" title={value || undefined}>{value || "—"}</dd>
    </>
  );
}
