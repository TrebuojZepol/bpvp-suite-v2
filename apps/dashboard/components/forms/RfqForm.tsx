"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function RfqForm() {
  const [pair, setPair] = useState("BTC-USD");
  const [size, setSize] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-bpvp-text-secondary">Request for quote</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <label className="text-xs text-bpvp-text-secondary">Pair</label>
          <Input value={pair} onChange={(e) => setPair(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-xs text-bpvp-text-secondary">Notional / size</label>
          <Input value={size} onChange={(e) => setSize(e.target.value)} placeholder="e.g. 2.5 BTC" />
        </div>
        <div className="space-y-2">
          <label className="text-xs text-bpvp-text-secondary">Notes (optional)</label>
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <Button className="w-full" variant="secondary">
          Submit RFQ
        </Button>
      </CardContent>
    </Card>
  );
}
