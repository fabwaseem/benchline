"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActionButton, ChipButton, Select, TextInput } from "@/components/kit/controls";
import { CopyButton } from "@/components/kit/copy-button";
import { EmptyState } from "@/components/kit/empty-state";
import { FieldRow } from "@/components/kit/field-row";
import { Notice } from "@/components/kit/notice";
import { Pane, StatusStrip, ToolCard, ToolPanes } from "@/components/kit/shell";
import { useWorkbenchKeys } from "@/components/kit/tool-shell";
import { ArrowLeftRight } from "lucide-react";
import { toast } from "sonner";
import {
  CURRENCIES,
  convertAmount,
  currencyLabel,
  formatMoney,
  isoDateDaysAgo,
  latestUrl,
  parseAmountInput,
  parseLatest,
  parseTimeSeries,
  timeSeriesUrl,
  trendStats,
  type RatePoint,
} from "@/tools/currency-converter/lib/currency";

const TABLE_CODES = ["USD", "EUR", "GBP", "JPY", "CHF", "CAD", "AUD", "CNY", "INR", "PKR", "AED", "SAR"];
const RANGES = [
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
  { label: "1Y", days: 365 },
];

function TrendChart({ points, from, to }: { points: RatePoint[]; from: string; to: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || points.length < 2) return;
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = 180;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    const rates = points.map((point) => point.rate);
    const min = Math.min(...rates);
    const max = Math.max(...rates);
    const span = max - min || 1;
    const pad = 12;
    const x = (index: number) => pad + (index / (points.length - 1)) * (width - pad * 2);
    const y = (rate: number) => pad + (1 - (rate - min) / span) * (height - pad * 2);
    const styles = getComputedStyle(canvas);
    const accent = styles.getPropertyValue("--hatch-widget-accent").trim() || "#2563eb";
    const muted = styles.getPropertyValue("--hatch-widget-muted").trim() || "#888888";
    ctx.strokeStyle = muted;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.4;
    for (const fraction of [0, 0.5, 1]) {
      const lineY = pad + fraction * (height - pad * 2);
      ctx.beginPath();
      ctx.moveTo(pad, lineY);
      ctx.lineTo(width - pad, lineY);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    points.forEach((point, index) => {
      if (index === 0) ctx.moveTo(x(index), y(point.rate));
      else ctx.lineTo(x(index), y(point.rate));
    });
    ctx.stroke();
    const last = points[points.length - 1];
    if (last) {
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(x(points.length - 1), y(last.rate), 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = muted;
    ctx.font = "11px system-ui";
    ctx.fillText(`${min.toFixed(4)}`, pad, height - 2);
    ctx.fillText(`${max.toFixed(4)}`, pad, 12);
  }, [points]);

  if (points.length < 2) return <EmptyState title="No trend data" hint="Not enough history for this pair yet." />;
  return <canvas ref={ref} className="h-[180px] w-full" aria-label={`${from} to ${to} trend`} />;
}

export default function CurrencyConverterTool() {
  const [amountText, setAmountText] = useState("100");
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("EUR");
  const [rates, setRates] = useState<Record<string, number> | null>(null);
  const [asOf, setAsOf] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [range, setRange] = useState(90);
  const [series, setSeries] = useState<RatePoint[]>([]);
  const [seriesLoading, setSeriesLoading] = useState(false);

  const amount = useMemo(() => parseAmountInput(amountText), [amountText]);

  const loadRates = useCallback(async (base: string) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(latestUrl(base, TABLE_CODES.filter((code) => code !== base)));
      if (!response.ok) throw new Error(`Rates service returned ${response.status}.`);
      const latest = parseLatest(await response.json());
      setRates(latest.rates);
      setAsOf(latest.date);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Could not load rates.");
      setRates(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const kick = window.setTimeout(() => {
      void loadRates(from);
    }, 0);
    return () => window.clearTimeout(kick);
  }, [from, loadRates]);

  const loadSeries = useCallback(
    async (base: string, target: string, days: number) => {
      if (base === target) {
        setSeries([]);
        return;
      }
      setSeriesLoading(true);
      try {
        const end = isoDateDaysAgo(0);
        const start = isoDateDaysAgo(days);
        const response = await fetch(timeSeriesUrl(start, end, base, target));
        if (!response.ok) throw new Error(`Trend service returned ${response.status}.`);
        setSeries(parseTimeSeries(await response.json(), target));
      } catch {
        setSeries([]);
      } finally {
        setSeriesLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    const kick = window.setTimeout(() => {
      void loadSeries(from, to, range);
    }, 0);
    return () => window.clearTimeout(kick);
  }, [from, to, range, loadSeries]);

  const rate = rates?.[to];
  const result = amount.ok && rate !== undefined ? convertAmount(amount.value, rate) : null;
  const stats = useMemo(() => trendStats(series), [series]);

  const copyText = result !== null ? `${formatMoney(amount.ok ? amount.value : 0, from)} = ${formatMoney(result, to)}` : "";
  useWorkbenchKeys({
    onCopy: () => {
      if (!copyText) return;
      void navigator.clipboard.writeText(copyText).then(() => toast.success("Copied"));
    },
  });

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  return (
    <ToolCard>
      <ToolPanes>
        <Pane label="Convert">
          <FieldRow label="Amount" htmlFor="cc-amount">
            <TextInput
              id="cc-amount"
              inputMode="decimal"
              value={amountText}
              onChange={(event) => setAmountText(event.target.value)}
              className="font-mono"
            />
          </FieldRow>
          <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
            <FieldRow label="From" htmlFor="cc-from">
              <Select id="cc-from" value={from} onChange={(event) => setFrom(event.target.value)}>
                {CURRENCIES.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currencyLabel(currency.code)}
                  </option>
                ))}
              </Select>
            </FieldRow>
            <ActionButton onClick={swap} aria-label="Swap currencies" className="mb-1">
              <ArrowLeftRight className="h-4 w-4" />
            </ActionButton>
            <FieldRow label="To" htmlFor="cc-to">
              <Select id="cc-to" value={to} onChange={(event) => setTo(event.target.value)}>
                {CURRENCIES.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currencyLabel(currency.code)}
                  </option>
                ))}
              </Select>
            </FieldRow>
          </div>
          {!amount.ok && <Notice tone="bad" role="alert" title="Something went wrong" body={amount.error} />}
          {error && <Notice tone="bad" role="alert" title="Something went wrong" body={error} />}
          <div className="rounded-lg border p-4">
            <div className="text-[12px] text-muted-foreground">Result{asOf ? ` · as of ${asOf}` : ""}</div>
            {loading ? (
              <div className="mt-1 text-2xl font-semibold text-muted-foreground">Loading…</div>
            ) : result !== null ? (
              <>
                <div className="mt-1 font-mono text-3xl font-semibold">{formatMoney(result, to)}</div>
                <div className="mt-1 font-mono text-[13px] text-muted-foreground">
                  1 {from} = {rate?.toFixed(4)} {to}
                </div>
              </>
            ) : (
              <EmptyState title="No result" hint="Pick two different currencies to convert." />
            )}
          </div>
          {copyText && (
            <div className="flex gap-2">
              <CopyButton value={copyText} />
              <ChipButton onClick={() => void loadRates(from)}>Refresh rates</ChipButton>
            </div>
          )}
        </Pane>
        <Pane label="Rates & trend">
          <FieldRow label="Trend range" htmlFor="cc-range">
            <div className="flex gap-2" id="cc-range">
              {RANGES.map((option) => (
                <ChipButton key={option.days} onClick={() => setRange(option.days)} pressed={range === option.days}>
                  {option.label}
                </ChipButton>
              ))}
            </div>
          </FieldRow>
          {seriesLoading ? (
            <EmptyState title="Loading trend…" hint="Fetching history." />
          ) : (
            <TrendChart points={series} from={from} to={to} />
          )}
          {stats && (
            <div className="font-mono text-[12px] text-muted-foreground">
              {range}D change {stats.changePct >= 0 ? "+" : ""}
              {stats.changePct.toFixed(2)}% · low {stats.min.toFixed(4)} · high {stats.max.toFixed(4)}
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="py-1 pr-2 font-medium">Currency</th>
                  <th className="py-1 pr-2 text-right font-medium">1 {from} =</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {TABLE_CODES.filter((code) => code !== from).map((code) => (
                  <tr key={code} className="border-t">
                    <td className="py-1 pr-2">{currencyLabel(code)}</td>
                    <td className="py-1 pr-2 text-right">{rates?.[code]?.toFixed(4) ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Pane>
      </ToolPanes>
      <StatusStrip>
        Rates by Frankfurter (ECB reference data) · fetched live · {asOf ? `updated ${asOf}` : "not loaded"}
      </StatusStrip>
    </ToolCard>
  );
}
