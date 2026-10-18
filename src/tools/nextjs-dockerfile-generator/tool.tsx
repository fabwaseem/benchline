"use client";

import { useMemo, useState } from "react";
import { TextInput, OptionRow } from "@/components/kit/controls";
import { Container, Download } from "lucide-react";
import { zipSync, strToU8 } from "fflate";
import { toast } from "sonner";
import { CheckRows } from "@/components/kit/check-row";
import { CodeOutput } from "@/components/kit/code-output";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { ResultStat } from "@/components/kit/result-stat";
import { Segmented } from "@/components/kit/segmented";
import { InkButton, Panel, ToolShell, ToolTabs, useWorkbenchKeys } from "@/components/kit/tool-shell";
import { buildArgWarnings, buildCommands, buildCompose, buildDockerfile, buildDockerignore, buildNextConfig, dockerfileDefaults, estimatedSize, type BaseImage, type DockerfileOptions, type NodeVersion, type PackageManager } from "@/tools/nextjs-dockerfile-generator/lib/dockerfile";

export default function DockerTool() {
  const [options, setOptions] = useState<DockerfileOptions>({ ...dockerfileDefaults, base: "alpine" });
  const [envText, setEnvText] = useState("");
  const [tab, setTab] = useState<"Dockerfile" | "ignore" | "compose" | "config" | "commands">("Dockerfile");
  const withEnvs = useMemo(
    () => ({ ...options, publicEnvs: envText.split(",").map((item) => item.trim()).filter(Boolean) }),
    [options, envText],
  );
  const warnings = buildArgWarnings(withEnvs.publicEnvs);
  const files = useMemo(() => ({
    Dockerfile: buildDockerfile(withEnvs),
    ignore: buildDockerignore(),
    compose: buildCompose(withEnvs),
    config: buildNextConfig(withEnvs),
    commands: buildCommands(withEnvs),
  }), [withEnvs]);
  const code = tab === "Dockerfile" ? files.Dockerfile : tab === "ignore" ? files.ignore : tab === "compose" ? files.compose : tab === "config" ? files.config : files.commands;

  function downloadZip() {
    const zipped = zipSync({
      Dockerfile: strToU8(files.Dockerfile),
      ".dockerignore": strToU8(files.ignore),
      "docker-compose.yml": strToU8(files.compose),
      "next.config.ts": strToU8(files.config),
    });
    const blob = new Blob([zipped], { type: "application/zip" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "nextjs-docker.zip";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded");
  }

  useWorkbenchKeys({
    onCopy: () => {
      void navigator.clipboard.writeText(files.Dockerfile).then(() => toast.success("Dockerfile copied"));
    },
    onEnter: downloadZip,
  });

  const checks = [
    { level: "pass" as const, label: "Non-root user", detail: "The runner stage adds user nextjs." },
    { level: options.standalone ? "pass" as const : "warn" as const, label: "Standalone output", detail: options.standalone ? "The runtime copies .next/standalone." : "Without standalone the image copies the whole app." },
    { level: options.healthcheck ? "pass" as const : "info" as const, label: "Healthcheck", detail: options.healthcheck ? `node fetch ${options.healthPath}` : "No healthcheck is written." },
    { level: options.telemetryDisabled ? "pass" as const : "info" as const, label: "Telemetry", detail: options.telemetryDisabled ? "NEXT_TELEMETRY_DISABLED=1" : "Next.js telemetry stays on." },
    ...warnings.map((warning) => ({ level: "fail" as const, label: "Build arg", detail: warning })),
  ];

  const status = warnings.length
    ? "Server secret in build-time names"
    : `${options.packageManager} · Node ${options.node} · ${options.base} · ${options.standalone ? "standalone" : "full"} · 3 stages · 5 files`;

  return (
    <ToolShell
      runsLocally
      layout="split+inspector"
      flow="band"
      columns="min-[1280px]:grid-cols-[360px_minmax(0,1fr)_320px]"
      tabs={<ToolTabs label="Mode" value="generate" onChange={() => {}} options={[{ value: "generate", label: "Generate" }]} />}
      actions={<InkButton icon={<Download size={15} />} onClick={downloadZip}>Download all (.zip)</InkButton>}
      status={
        <>
          <span className={warnings.length || !options.standalone ? "dot dot-warn" : "dot"} />
          <span>{status}</span>
          <span className="ml-auto hidden min-[700px]:inline">⌘⇧C copy Dockerfile · ⌘↵ download zip</span>
        </>
      }
      input={
        <Panel title="Options">
          <FieldRow label="Package manager" htmlFor="pm">
            <Segmented label="Package manager" value={options.packageManager} onChange={(packageManager) => setOptions({ ...options, packageManager })} options={(["npm", "pnpm", "yarn", "bun"] as PackageManager[]).map((value) => ({ value, label: value }))} />
          </FieldRow>
          <FieldRow label="Node" htmlFor="node">
            <Segmented label="Node" value={options.node} onChange={(node) => setOptions({ ...options, node })} options={(["20", "22", "24"] as NodeVersion[]).map((value) => ({ value, label: value }))} />
          </FieldRow>
          <FieldRow label="Base" htmlFor="base">
            <Segmented label="Base" value={options.base} onChange={(base) => setOptions({ ...options, base })} options={([{ value: "alpine", label: "Alpine" }, { value: "slim", label: "Debian slim" }] as { value: BaseImage; label: string }[])} />
          </FieldRow>
          <OptionRow label="Standalone output" checked={options.standalone} onChange={(standalone) => setOptions({ ...options, standalone })} />
          <OptionRow label="Prisma" checked={options.prisma} onChange={(prisma) => setOptions({ ...options, prisma })} />
          <OptionRow label="prisma migrate deploy" checked={options.migrate} onChange={(migrate) => setOptions({ ...options, migrate })} />
          <OptionRow label="Healthcheck" checked={options.healthcheck} onChange={(healthcheck) => setOptions({ ...options, healthcheck })} />
          <OptionRow label="Disable telemetry" checked={options.telemetryDisabled} onChange={(telemetryDisabled) => setOptions({ ...options, telemetryDisabled })} />
          <OptionRow label="BuildKit cache mounts" checked={options.cacheMounts} onChange={(cacheMounts) => setOptions({ ...options, cacheMounts })} />
          <OptionRow label="Monorepo note" checked={options.turbo} onChange={(turbo) => setOptions({ ...options, turbo })} />
          <FieldRow label="Port" htmlFor="port"><TextInput id="port" type="number" value={options.port} onChange={(event) => setOptions({ ...options, port: Number(event.target.value) || 3000 })} className="max-[699px]:h-11" /></FieldRow>
          <FieldRow label="Health path" htmlFor="health"><TextInput id="health" value={options.healthPath} onChange={(event) => setOptions({ ...options, healthPath: event.target.value })} className="max-[699px]:h-11" /></FieldRow>
          <FieldRow label="Build-time NEXT_PUBLIC_ names" htmlFor="envs" help="Comma-separated. They become ARG lines. Server secrets stay runtime env." error={warnings[0]}>
            <TextInput id="envs" value={envText} aria-invalid={warnings.length > 0 || undefined} onChange={(event) => setEnvText(event.target.value)} className="max-[699px]:h-11" />
          </FieldRow>
        </Panel>
      }
      output={
        <Panel title="Files">
          {!options.standalone ? <Notice tone="warn" title="Standalone is off." body="The image copies the whole app and is much larger." /> : null}
          {warnings.length > 0 ? <Notice tone="bad" role="alert" title={warnings[0] ?? "A server secret would be baked into the image."} /> : null}
          <Segmented label="File" value={tab} onChange={setTab} options={[
            { value: "Dockerfile", label: "Dockerfile" },
            { value: "ignore", label: ".dockerignore" },
            { value: "compose", label: "compose" },
            { value: "config", label: "next.config" },
            { value: "commands", label: "commands" },
          ]} />
          <CodeOutput code={code} filename={tab === "ignore" ? ".dockerignore" : tab === "compose" ? "docker-compose.yml" : tab === "config" ? "next.config.ts" : tab === "commands" ? "commands.txt" : "Dockerfile"} label={tab} />
        </Panel>
      }
      inspector={
        <Panel title="Summary">
          <ResultStat variant="well" label="Estimated image size" value={estimatedSize(withEnvs)} hint="A static estimate, not a measurement." />
          <CheckRows rows={checks} />
          <p className="px-4 font-mono text-[12px] text-muted-foreground">{files.commands}</p>
          <InkButton icon={<Container size={15} />} onClick={downloadZip}>Download all (.zip)</InkButton>
        </Panel>
      }
    />
  );
}

