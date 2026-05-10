"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCompact } from "@/lib/utils";
import type { BookLevel } from "@/hooks/useMarketData";

type OrderBookProps = {
  bids: BookLevel[];
  asks: BookLevel[];
  onSelectLevel?: (side: "bid" | "ask", price: number) => void;
};

export function OrderBook({ bids, asks, onSelectLevel }: OrderBookProps) {
  const maxVol = useMemo(() => {
    const all = [...bids.map((b) => b.size), ...asks.map((a) => a.size)];
    return Math.max(...all, 1e-9);
  }, [bids, asks]);

  const bestBid = bids[0]?.price ?? 0;
  const bestAsk = asks[0]?.price ?? 0;
  const spread = bestAsk && bestBid ? bestAsk - bestBid : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-bpvp-text-secondary">Order book</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="grid grid-cols-2 gap-2 text-xs text-bpvp-text-secondary">
          <span>Price</span>
          <span className="text-right">Size</span>
        </div>
        <div className="flex max-h-[220px] flex-col gap-0.5 overflow-hidden text-xs">
          {bids.slice(0, 12).map((b, i) => {
            const intensity = b.size / maxVol;
            return (
              <button
                key={`b-${i}`}
                type="button"
                onClick={() => onSelectLevel?.("bid", b.price)}
                className="relative grid w-full grid-cols-2 rounded px-1 py-0.5 text-left tabular-nums transition-all duration-150 ease-out hover:bg-bpvp-bg"
              >
                <span
                  className="pointer-events-none absolute inset-y-0 left-0 rounded bg-emerald-500/15"
                  style={{ width: `${intensity * 100}%` }}
                />
                <span className="relative text-bpvp-primary">{b.price.toFixed(2)}</span>
                <span className="relative text-right text-bpvp-text-primary">{formatCompact(b.size)}</span>
              </button>
            );
          })}
        </div>
        <div className="rounded border border-bpvp-border bg-bpvp-bg py-2 text-center text-xs text-bpvp-text-secondary">
          Spread:{" "}
          <span className="font-medium text-bpvp-text-primary tabular-nums">{spread.toFixed(2)}</span>
        </div>
        <div className="flex max-h-[220px] flex-col gap-0.5 overflow-hidden text-xs">
          {asks.slice(0, 12).map((a, i) => {
            const intensity = a.size / maxVol;
            return (
              <button
                key={`a-${i}`}
                type="button"
                onClick={() => onSelectLevel?.("ask", a.price)}
                className="relative grid w-full grid-cols-2 rounded px-1 py-0.5 text-left tabular-nums transition-all duration-150 ease-out hover:bg-bpvp-bg"
              >
                <span
                  className="pointer-events-none absolute inset-y-0 right-0 rounded bg-rose-500/15"
                  style={{ width: `${intensity * 100}%` }}
                />
                <span className="relative text-bpvp-danger">{a.price.toFixed(2)}</span>
                <span className="relative text-right text-bpvp-text-primary">{formatCompact(a.size)}</span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
