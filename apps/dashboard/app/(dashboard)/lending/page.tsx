import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/charts/KpiCard";

export default function LendingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-bpvp-text-primary">Lending</h1>
        <p className="text-sm text-bpvp-text-secondary">Borrow/lend book overview (illustrative).</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard
          title="Utilization"
          value="72.4%"
          changePct={0.6}
          detail="Weighted utilization across BTC and stable pools."
          sparkline={[68, 69, 70, 71, 71.5, 72, 72.2, 72.4]}
        />
        <KpiCard
          title="Borrow APR (avg)"
          value="6.85%"
          changePct={-0.12}
          detail="Volume-weighted mean borrow rate."
          sparkline={[7.1, 7.05, 7.0, 6.95, 6.92, 6.9, 6.88, 6.85]}
        />
        <KpiCard
          title="Supply APR (avg)"
          value="4.10%"
          changePct={0.05}
          detail="Net supply yield after protocol fee."
          sparkline={[3.95, 3.98, 4.0, 4.02, 4.04, 4.06, 4.08, 4.1]}
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pools</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-bpvp-text-secondary">
          Connect on-chain settlement and risk engines to replace this static panel.
        </CardContent>
      </Card>
    </div>
  );
}
