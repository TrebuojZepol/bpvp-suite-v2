"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type OrderFormProps = {
  initialPrice?: string;
  onSubmit?: (o: { side: "buy" | "sell"; type: "limit" | "market"; price?: number; size: number }) => void;
};

export function OrderForm({ initialPrice = "", onSubmit }: OrderFormProps) {
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [price, setPrice] = useState(initialPrice);
  const [size, setSize] = useState("");

  useEffect(() => {
    if (initialPrice) setPrice(initialPrice);
  }, [initialPrice]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-bpvp-text-secondary">Place order</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={side === "buy" ? "default" : "secondary"}
            onClick={() => setSide("buy")}
          >
            Buy
          </Button>
          <Button
            type="button"
            variant={side === "sell" ? "danger" : "secondary"}
            onClick={() => setSide("sell")}
          >
            Sell
          </Button>
        </div>
        <Tabs defaultValue="limit">
          <TabsList className="w-full">
            <TabsTrigger value="limit" className="flex-1">
              Limit
            </TabsTrigger>
            <TabsTrigger value="market" className="flex-1">
              Market
            </TabsTrigger>
          </TabsList>
          <TabsContent value="limit" className="space-y-2">
            <label className="text-xs text-bpvp-text-secondary">Price</label>
            <Input value={price} onChange={(e) => setPrice(e.target.value)} className="tabular-nums" />
          </TabsContent>
          <TabsContent value="market" className="text-xs text-bpvp-text-secondary">
            Market orders execute at the best available price.
          </TabsContent>
        </Tabs>
        <div className="space-y-2">
          <label className="text-xs text-bpvp-text-secondary">Size (BTC)</label>
          <Input value={size} onChange={(e) => setSize(e.target.value)} className="tabular-nums" />
        </div>
        <Button
          className="w-full"
          onClick={() => {
            const sz = parseFloat(size);
            const pr = parseFloat(price);
            onSubmit?.({
              side,
              type: price ? "limit" : "market",
              price: Number.isFinite(pr) ? pr : undefined,
              size: Number.isFinite(sz) ? sz : 0,
            });
          }}
        >
          Submit {side === "buy" ? "buy" : "sell"}
        </Button>
      </CardContent>
    </Card>
  );
}
