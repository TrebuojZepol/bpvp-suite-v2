"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatPct } from "@/lib/utils";

type KpiCardProps = {
  title: string;
  value: string;
  changePct: number;
  detail?: string;
  sparkline: number[];
};

function Sparkline({ data, positive }: { data: number[]; positive: boolean }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const w = 80;
  const h = 28;
  const pad = 2;
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const t = max === min ? 0.5 : (v - min) / (max - min);
    const y = pad + (1 - t) * (h - pad * 2);
    return `${x},${y}`;
  });
  const d = `M ${pts.join(" L ")}`;
  return (
    <svg width={w} height={h} className="shrink-0 overflow-visible" aria-hidden>
      <path
        d={d}
        fill="none"
        strokeWidth={1.5}
        className={cn(positive ? "stroke-bpvp-primary" : "stroke-bpvp-danger")}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function KpiCard({ title, value, changePct, detail, sparkline }: KpiCardProps) {
  const up = changePct >= 0;
  return (
    <Card className="group relative transition-all duration-150 ease-out hover:border-bpvp-primary/30">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-bpvp-text-secondary">{title}</CardTitle>
        <Sparkline data={sparkline} positive={up} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tabular-nums text-bpvp-text-primary">{value}</div>
        <p
          className={cn(
            "mt-1 text-xs font-medium tabular-nums",
            up ? "text-bpvp-primary" : "text-bpvp-danger",
          )}
        >
          {formatPct(changePct)}
        </p>
        {detail ? (
          <p
            className="pointer-events-none absolute bottom-3 left-4 right-4 rounded border border-bpvp-border bg-bpvp-bg/95 p-2 text-xs text-bpvp-text-secondary opacity-0 transition-opacity duration-150 group-hover:opacity-100"
            role="tooltip"
          >
            {detail}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
