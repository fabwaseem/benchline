import { cn } from "@/lib/utils";

const segmentColor = ["text-seg-header", "text-seg-payload", "text-seg-signature"] as const;
const chipColor = ["var(--seg-header)", "var(--seg-payload)", "var(--seg-signature)"] as const;
const chipName = ["header", "payload", "signature"] as const;

export function TokenSegments({
  header,
  payload,
  signature,
  badSegment,
  chips = false,
  chipsOnly = false,
  className,
}: {
  header: string;
  payload: string;
  signature: string;
  badSegment?: 1 | 2 | 3;
  chips?: boolean;
  chipsOnly?: boolean;
  className?: string;
}) {
  const parts = [header, payload, signature];
  return (
    <div className={className}>
      {chipsOnly ? null : (
      <p className="font-mono text-[12.5px] leading-[1.8] break-all">
        {parts.map((part, index) => {
          const segment = (index + 1) as 1 | 2 | 3;
          return (
            <span key={chipName[index]}>
              {index > 0 ? <span className="text-faint">.</span> : null}
              <span className={cn(segmentColor[index], badSegment === segment && "badseg")}>{part}</span>
            </span>
          );
        })}
      </p>
      )}
      {chips ? (
        <div className={cn("flex flex-wrap gap-2", chipsOnly ? "" : "mt-3")}>
          {parts.map((part, index) => (
            <span key={chipName[index]} className="chip">
              <i className="dot" style={{ background: chipColor[index] }} />
              {chipName[index]} · {part.length}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
