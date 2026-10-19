"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/kit/primitives/button";
import { Input } from "@/components/kit/primitives/input";
import { Segmented } from "@/components/kit/segmented";
import { RANGE_PRESETS, type RangePreset } from "@/lib/admin/range";

const options: { value: RangePreset; label: string }[] = [
  { value: "24h", label: "24h" },
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
  { value: "90d", label: "90d" },
  { value: "custom", label: "Custom" },
];

export function RangePicker() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const raw = params.get("range");
  const preset: RangePreset = RANGE_PRESETS.includes(raw as RangePreset) ? (raw as RangePreset) : "30d";
  const compare = params.get("compare") === "1";

  function push(next: URLSearchParams) {
    const query = next.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  function setPreset(value: RangePreset) {
    const next = new URLSearchParams(params);
    next.set("range", value);
    if (value !== "custom") {
      next.delete("from");
      next.delete("to");
    }
    push(next);
  }

  function setDate(key: "from" | "to", value: string) {
    const next = new URLSearchParams(params);
    next.set("range", "custom");
    if (value) next.set(key, value);
    else next.delete(key);
    push(next);
  }

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented label="Date range" value={preset} options={options} onChange={setPreset} />
        <Button
          type="button"
          size="sm"
          variant={compare ? "primary" : "outline"}
          aria-pressed={compare}
          onClick={() => {
            const next = new URLSearchParams(params);
            if (compare) next.delete("compare");
            else next.set("compare", "1");
            push(next);
          }}
        >
          Compare
        </Button>
      </div>
      {preset === "custom" ? (
        <div className="flex flex-wrap gap-2">
          <Input aria-label="From" type="date" value={params.get("from")?.slice(0, 10) ?? ""} onChange={(event) => setDate("from", event.target.value)} />
          <Input aria-label="To" type="date" value={params.get("to")?.slice(0, 10) ?? ""} onChange={(event) => setDate("to", event.target.value)} />
        </div>
      ) : null}
    </div>
  );
}
