import { MODELS, type PriceModel } from "@/tools/ai-token-counter/lib/prices";

export type CostRow = {
  model: PriceModel;
  inputUsd: number;
  outputUsd: number;
  requestUsd: number;
  monthUsd: number;
  longContext: boolean;
  overContext: boolean;
};

export function priceRequest(input: {
  model: PriceModel;
  inputTokens: number;
  outputTokens: number;
  cachedRatio: number;
  requestsPerDay: number;
}): CostRow {
  const ratio = clamp(input.cachedRatio, 0, 1);
  const long = input.model.longContext && input.inputTokens > input.model.longContext.afterInputTokens ? input.model.longContext : null;
  const inputRate = long?.inputPerM ?? input.model.inputPerM;
  const outputRate = long?.outputPerM ?? input.model.outputPerM;
  const cachedRate = long?.cachedInputPerM ?? input.model.cachedInputPerM;
  const cachedTokens = cachedRate === undefined ? 0 : input.inputTokens * ratio;
  const freshTokens = input.inputTokens - cachedTokens;
  const inputUsd = (freshTokens / 1_000_000) * inputRate + (cachedTokens / 1_000_000) * (cachedRate ?? inputRate);
  const outputUsd = (input.outputTokens / 1_000_000) * outputRate;
  const requestUsd = inputUsd + outputUsd;
  return {
    model: input.model,
    inputUsd,
    outputUsd,
    requestUsd,
    monthUsd: requestUsd * input.requestsPerDay * 30,
    longContext: Boolean(long),
    overContext: input.model.contextWindow !== null && input.inputTokens > input.model.contextWindow,
  };
}

export function priceSelected(input: {
  ids: string[];
  inputTokens: number;
  outputTokens: number;
  cachedRatio: number;
  requestsPerDay: number;
}) {
  return MODELS.filter((model) => input.ids.includes(model.id)).map((model) =>
    priceRequest({ ...input, model }),
  );
}

export function costMarkdown(rows: CostRow[]) {
  const lines = ["| Model | Input | Output | Per request | Per month |", "| --- | ---: | ---: | ---: | ---: |"];
  for (const row of rows) {
    lines.push(`| ${row.model.label} | ${money(row.inputUsd)} | ${money(row.outputUsd)} | ${money(row.requestUsd)} | ${money(row.monthUsd)} |`);
  }
  return lines.join("\n");
}

export function money(value: number) {
  if (value === 0) return "$0";
  if (value < 0.01) return `$${value.toFixed(4)}`;
  return `$${value.toFixed(2)}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
