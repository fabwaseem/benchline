"use client";

import { useEffect, useRef, useState } from "react";
import { Network } from "lucide-react";
import { CodeField } from "@/components/kit/code-output";
import { ActionButton, OptionRow, TextInput } from "@/components/kit/controls";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { ErrorCallout } from "@/components/kit/notice";
import { Pane, StatusStrip, ToolCard, ToolPanes, ToolToolbar } from "@/components/kit/shell";
import { cn } from "@/lib/utils";
import {
  closeCodeName,
  exampleSocketUrl,
  formatFrameTime,
  makeFrame,
  parseWebSocketUrl,
  type LogFrame,
} from "@/tools/websocket-tester/lib/websocket";

type ConnState = "closed" | "connecting" | "open" | "closing";

const DIRECTION_STYLE: Record<LogFrame["direction"], string> = {
  in: "text-sky-600 dark:text-sky-400",
  out: "text-emerald-600 dark:text-emerald-400",
  sys: "text-muted-foreground",
};

const DIRECTION_LABEL: Record<LogFrame["direction"], string> = {
  in: "← in",
  out: "→ out",
  sys: "• sys",
};

export default function WebSocketTesterTool() {
  const [url, setUrl] = useState(exampleSocketUrl);
  const [connState, setConnState] = useState<ConnState>("closed");
  const [frames, setFrames] = useState<LogFrame[]>([]);
  const [draft, setDraft] = useState('{"hello":"world"}');
  const [heartbeatOn, setHeartbeatOn] = useState(false);
  const [heartbeatSecs, setHeartbeatSecs] = useState(30);
  const [heartbeatMsg, setHeartbeatMsg] = useState("ping");
  const [urlError, setUrlError] = useState("");
  const socketRef = useRef<WebSocket | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const push = (frame: LogFrame) => setFrames((prev) => [...prev.slice(-499), frame]);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [frames]);

  useEffect(() => {
    return () => {
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!heartbeatOn || connState !== "open") return;
    const secs = Math.min(Math.max(heartbeatSecs, 5), 300);
    const timer = window.setInterval(() => {
      const socket = socketRef.current;
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(heartbeatMsg);
        push(makeFrame("out", heartbeatMsg));
      }
    }, secs * 1000);
    return () => window.clearInterval(timer);
  }, [heartbeatOn, heartbeatSecs, heartbeatMsg, connState]);

  const connect = () => {
    const checked = parseWebSocketUrl(url);
    if (!checked.valid) {
      setUrlError(checked.error ?? "Invalid URL.");
      return;
    }
    setUrlError("");
    setConnState("connecting");
    push(makeFrame("sys", `Connecting to ${url.trim()} …`));
    const socket = new WebSocket(url.trim());
    socketRef.current = socket;
    socket.onopen = () => {
      setConnState("open");
      push(makeFrame("sys", "Connected."));
    };
    socket.onmessage = (event: MessageEvent) => {
      const text = typeof event.data === "string" ? event.data : "[binary frame]";
      push(makeFrame("in", text));
    };
    socket.onerror = () => {
      push(makeFrame("sys", "Socket error — the server may be unreachable or refused the connection."));
    };
    socket.onclose = (event: CloseEvent) => {
      socketRef.current = null;
      setConnState("closed");
      const reason = event.reason ? ` (${event.reason})` : "";
      push(makeFrame("sys", `Closed: ${event.code} ${closeCodeName(event.code)}${reason}`));
    };
  };

  const disconnect = () => {
    setConnState("closing");
    socketRef.current?.close(1000, "Client disconnect");
  };

  const send = () => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN || !draft) return;
    socket.send(draft);
    push(makeFrame("out", draft));
  };

  const statusTone = connState === "open" ? "pass" : connState === "closed" ? "info" : "warn";
  const status = connState === "open" ? `Connected to ${url.trim()}` : connState === "connecting" ? "Connecting…" : connState === "closing" ? "Closing…" : "Disconnected.";

  return (
    <ToolCard>
      <ToolToolbar
        label="Connection"
        options={[{ value: "live", label: "Live" }]}
        value="live"
        onChange={() => undefined}
        actions={
          <>
            <ActionButton variant="outline" onClick={() => setFrames([])}>Clear log</ActionButton>
            {connState === "open" || connState === "connecting" ? (
              <ActionButton className="btn btn-ink" onClick={disconnect}>Disconnect</ActionButton>
            ) : (
              <ActionButton className="btn btn-ink" onClick={connect}>Connect</ActionButton>
            )}
          </>
        }
      />
      <ToolPanes>
        <Pane label="Send" scroll={false} bodyClassName="flex min-h-[340px] flex-col gap-3 p-3">
          <FieldRow label="WebSocket URL" htmlFor="ws-url" error={urlError}>
            <TextInput
              id="ws-url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              className="font-mono"
              placeholder="wss://example.com/socket"
              spellCheck={false}
              disabled={connState !== "closed"}
            />
          </FieldRow>
          {urlError ? <ErrorCallout title="Invalid URL" body={urlError} /> : null}
          <CodeField
            id="ws-draft"
            label="Message"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className="min-h-[120px]"
          />
          <ActionButton variant="outline" disabled={connState !== "open" || !draft} onClick={send}>
            Send message
          </ActionButton>
          <OptionRow
            label="Heartbeat"
            checked={heartbeatOn}
            onChange={setHeartbeatOn}
            hint="Send a small text message on an interval (browsers cannot send protocol ping frames)."
          />
          {heartbeatOn ? (
            <>
              <FieldRow label="Every (seconds)" htmlFor="ws-hb-secs">
                <TextInput
                  id="ws-hb-secs"
                  type="number"
                  min={5}
                  max={300}
                  value={heartbeatSecs}
                  onChange={(event) => setHeartbeatSecs(Number(event.target.value))}
                />
              </FieldRow>
              <FieldRow label="Heartbeat message" htmlFor="ws-hb-msg">
                <TextInput id="ws-hb-msg" value={heartbeatMsg} onChange={(event) => setHeartbeatMsg(event.target.value)} className="font-mono" />
              </FieldRow>
            </>
          ) : null}
        </Pane>
        <Pane label="Frames" scroll={false} bodyClassName="flex min-h-[340px] flex-col gap-3 p-3">
          <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
            <span className={cn("inline-block size-2 rounded-full", connState === "open" ? "bg-emerald-500" : connState === "closed" ? "bg-muted" : "bg-amber-500")} />
            {status}
          </div>
          <div ref={logRef} className="min-h-0 flex-1 overflow-y-auto rounded-md border border-border bg-muted/30 p-2 font-mono text-[12px]">
            {frames.length === 0 ? (
              <EmptyState art={<Network size={22} />} title="No frames yet" hint="Connect, then send a message." />
            ) : (
              <ul className="flex flex-col gap-1">
                {frames.map((frame) => (
                  <li key={frame.id} className="flex gap-2 break-all">
                    <span className="shrink-0 text-muted-foreground">{formatFrameTime(frame.at)}</span>
                    <span className={cn("shrink-0 font-semibold", DIRECTION_STYLE[frame.direction])}>{DIRECTION_LABEL[frame.direction]}</span>
                    <span className="whitespace-pre-wrap">{frame.text}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Pane>
      </ToolPanes>
      <StatusStrip note={`${frames.length} frame${frames.length === 1 ? "" : "s"}`} tone={statusTone} />
    </ToolCard>
  );
}
