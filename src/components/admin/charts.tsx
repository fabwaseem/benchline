"use client";

import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { bucketLabel } from "@/lib/admin/format";

const tooltipStyle = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
  color: "var(--foreground)",
};

export function Sparkline({ values, tone = "neutral" }: { values: number[]; tone?: "neutral" | "good" | "bad" }) {
  if (values.length < 2) return <span className="block h-8 w-[104px]" aria-hidden />;
  const stroke = tone === "good" ? "var(--success)" : tone === "bad" ? "var(--danger)" : "var(--chart-1)";
  const data = values.map((value, index) => ({ index, value }));
  return (
    <LineChart width={104} height={32} data={data} aria-hidden>
      <Line type="monotone" dataKey="value" stroke={stroke} strokeWidth={1.5} dot={false} isAnimationActive={false} />
    </LineChart>
  );
}

export function RunsChart({ data }: { data: { bucket: string; web: number; mcp: number; api: number }[] }) {
  const rows = data.map((row) => ({ ...row, label: bucketLabel(row.bucket) }));
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} barCategoryGap="28%">
          <XAxis dataKey="label" tick={{ fill: "var(--faint)", fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={28} />
          <YAxis tick={{ fill: "var(--faint)", fontSize: 11 }} axisLine={false} tickLine={false} width={36} allowDecimals={false} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--sunken)" }} />
          <Bar dataKey="web" name="Web" stackId="runs" fill="var(--chart-1)" isAnimationActive={false} />
          <Bar dataKey="mcp" name="MCP" stackId="runs" fill="var(--chart-3)" isAnimationActive={false} />
          <Bar dataKey="api" name="API" stackId="runs" fill="var(--chart-2)" radius={[3, 3, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CountChart({ data }: { data: { bucket: string; count: number }[] }) {
  const rows = data.map((row) => ({ ...row, label: bucketLabel(row.bucket) }));
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows}>
          <XAxis dataKey="label" tick={{ fill: "var(--faint)", fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={28} />
          <YAxis tick={{ fill: "var(--faint)", fontSize: 11 }} axisLine={false} tickLine={false} width={36} allowDecimals={false} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--sunken)" }} />
          <Bar dataKey="count" name="Errors" fill="var(--danger)" radius={[3, 3, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
