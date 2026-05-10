"use client";

import { useState } from "react";
import { OrderBook } from "@/components/charts/OrderBook";
import { OrderForm } from "@/components/forms/OrderForm";
import { PriceChart } from "@/components/charts/PriceChart";
import { Badge } from "@/components/ui/badge";
import { useMarketData } from "@/hooks/useMarketData";

const candles = [
  { o: 67180, h: 67240, l: 67150, c: 67210 },
  { o: 67210, h: 67280, l: 67190, c: 67250 },
  { o: 67250, h: 67320, l: 67220, c: 67290 },
];

export function MarketPageClient() {
  const { snapshot, connected, usingMock } = useMarketData("BTC-USD");
  const [fillPrice, setFillPrice] = useState("");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold text-bpvp-text-primary">Spot market</h1>
          <p className="text-sm text-bpvp-text-secondary">BTC-USD order book and execution.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={connected && !usingMock ? "primary" : "accent"}>
            {connected && !usingMock ? "Live feed" : "Demo / offline"}
          </Badge>
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-4">
          <PriceChart title="BTC-USD" data={candles} />
          <OrderBook
            bids={snapshot.bids}
            asks={snapshot.asks}
            onSelectLevel={(_, price) => setFillPrice(price.toFixed(2))}
          />
        </div>
        <OrderForm initialPrice={fillPrice} />
      </div>
    </div>
  );
}
