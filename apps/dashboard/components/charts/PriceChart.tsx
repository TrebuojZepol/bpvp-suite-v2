"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Candle = { o: number; h: number; l: number; c: number };

type PriceChartProps = {
  title?: string;
  data: Candle[];
  className?: string;
};

export function PriceChart({ title = "Price", data, className }: PriceChartProps) {
  const w = 320;
  const h = 140;
  const pad = 8;
  if (data.length === 0) return null;
  const lows = data.map((d) => d.l);
  const highs = data.map((d) => d.h);
  const min = Math.min(...lows);
  const max = Math.max(...highs);
  const span = max - min || 1;
  const barW = (w - pad * 2) / data.length - 2;

  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-bpvp-text-secondary">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <svg width="100%" viewBox={`0 0 ${w} ${h}`} className="max-h-40 text-bpvp-primary">
          {data.map((d, i) => {
            const x = pad + i * ((w - pad * 2) / data.length) + 1;
            const y = (v: number) => pad + (1 - (v - min) / span) * (h - pad * 2);
            const up = d.c >= d.o;
            return (
              <g key={i}>
                <line
                  x1={x + barW / 2}
                  x2={x + barW / 2}
                  y1={y(d.h)}
                  y2={y(d.l)}
                  stroke={up ? "#10b981" : "#f43f5e"}
                  strokeWidth={1}
                />
                <rect
                  x={x}
                  y={y(Math.max(d.o, d.c))}
                  width={barW}
                  height={Math.max(1, Math.abs(y(d.o) - y(d.c)))}
                  fill={up ? "#10b981" : "#f43f5e"}
                  opacity={0.85}
                />
              </g>
            );
          })}
        </svg>
      </CardContent>
    </Card>
  );
}
