"use client";

import { useMemo, useState } from "react";
import { zipSync, strToU8 } from "fflate";
import { toast } from "sonner";
import { CodeOutput } from "@/components/kit/code-output";
import { FieldRow } from "@/components/kit/field-row";
import { ResultStat } from "@/components/kit/result-stat";
import { Segmented } from "@/components/kit/segmented";
import { ToolShell } from "@/components/kit/tool-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { buildCommands, buildCompose, buildDockerfile, buildDockerignore, buildNextConfig, dockerfileDefaults, estimatedSize, type BaseImage, type DockerfileOptions, type NodeVersion, type PackageManager } from "@/tools/nextjs-dockerfile-generator/lib/dockerfile";

export default function DockerTool() {
  const [options, setOptions] = useState<DockerfileOptions>(dockerfileDefaults);
  const [tab, setTab] = useState<"Dockerfile" | "ignore" | "compose" | "config" | "commands">("Dockerfile");
  const files = useMemo(() => ({
    Dockerfile: buildDockerfile(options),
    ignore: buildDockerignore(),
    compose: buildCompose(options),
    config: buildNextConfig(options),
    commands: buildCommands(options),
  }), [options]);
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

  return (
    <ToolShell runsLocally actions={<Button type="button" onClick={downloadZip}>Download all (.zip)</Button>}>
      <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,20rem)_1fr]">
        <div className="flex flex-col gap-3">
          <FieldRow label="Package manager" htmlFor="pm">
            <Segmented label="Package manager" value={options.packageManager} onChange={(packageManager) => setOptions({ ...options, packageManager })} options={(["npm", "pnpm", "yarn", "bun"] as PackageManager[]).map((value) => ({ value, label: value }))} />
          </FieldRow>
          <FieldRow label="Node" htmlFor="node">
            <Segmented label="Node" value={options.node} onChange={(node) => setOptions({ ...options, node })} options={(["20", "22", "24"] as NodeVersion[]).map((value) => ({ value, label: value }))} />
          </FieldRow>
          <FieldRow label="Base" htmlFor="base">
            <Segmented label="Base" value={options.base} onChange={(base) => setOptions({ ...options, base })} options={([{ value: "slim", label: "Debian slim" }, { value: "alpine", label: "Alpine" }] as { value: BaseImage; label: string }[])} />
          </FieldRow>
          <Toggle label="Standalone output" checked={options.standalone} onChange={(standalone) => setOptions({ ...options, standalone })} />
          <Toggle label="Prisma" checked={options.prisma} onChange={(prisma) => setOptions({ ...options, prisma })} />
          <Toggle label="prisma migrate deploy" checked={options.migrate} onChange={(migrate) => setOptions({ ...options, migrate })} />
          <Toggle label="Healthcheck" checked={options.healthcheck} onChange={(healthcheck) => setOptions({ ...options, healthcheck })} />
          <Toggle label="Disable telemetry" checked={options.telemetryDisabled} onChange={(telemetryDisabled) => setOptions({ ...options, telemetryDisabled })} />
          <Toggle label="BuildKit cache mounts" checked={options.cacheMounts} onChange={(cacheMounts) => setOptions({ ...options, cacheMounts })} />
          <Toggle label="Monorepo note" checked={options.turbo} onChange={(turbo) => setOptions({ ...options, turbo })} />
          <FieldRow label="Port" htmlFor="port"><Input id="port" type="number" value={options.port} onChange={(event) => setOptions({ ...options, port: Number(event.target.value) || 3000 })} /></FieldRow>
          <FieldRow label="Health path" htmlFor="health"><Input id="health" value={options.healthPath} onChange={(event) => setOptions({ ...options, healthPath: event.target.value })} /></FieldRow>
          <FieldRow label="Build-time NEXT_PUBLIC_ names" htmlFor="envs" help="Comma-separated. They become ARG lines. Server secrets stay runtime env.">
            <Input id="envs" value={options.publicEnvs.join(", ")} onChange={(event) => setOptions({ ...options, publicEnvs: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} />
          </FieldRow>
        </div>
        <div className="flex flex-col gap-3">
          <ResultStat label="Estimated image size" value={estimatedSize(options)} hint="A static estimate, not a measurement." />
          <Segmented label="File" value={tab} onChange={setTab} options={[
            { value: "Dockerfile", label: "Dockerfile" },
            { value: "ignore", label: ".dockerignore" },
            { value: "compose", label: "compose" },
            { value: "config", label: "next.config" },
            { value: "commands", label: "commands" },
          ]} />
          <CodeOutput code={code} filename={tab === "ignore" ? ".dockerignore" : tab === "compose" ? "docker-compose.yml" : tab === "config" ? "next.config.ts" : tab === "commands" ? "commands.txt" : "Dockerfile"} label={tab} />
        </div>
      </div>
    </ToolShell>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 text-sm">
      {label}
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}
