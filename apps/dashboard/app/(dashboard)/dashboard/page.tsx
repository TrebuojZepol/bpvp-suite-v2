import { KpiCard } from "@/components/charts/KpiCard";
import { PriceChart } from "@/components/charts/PriceChart";

const candles = [
  { o: 67180, h: 67240, l: 67150, c: 67210 },
  { o: 67210, h: 67280, l: 67190, c: 67250 },
  { o: 67250, h: 67320, l: 67220, c: 67290 },
  { o: 67290, h: 67310, l: 67240, c: 67260 },
  { o: 67260, h: 67300, l: 67180, c: 67220 },
  { o: 67220, h: 67270, l: 67190, c: 67255 },
];

export default function DashboardOverviewPage() {
  return (
    <div className="space-y-6 transition-all duration-150 ease-out">
      <div>
        <h1 className="text-xl font-semibold text-bpvp-text-primary">Overview</h1>
        <p className="text-sm text-bpvp-text-secondary">Key risk and liquidity metrics (demo data).</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="TVL"
          value="$482.4M"
          changePct={1.24}
          detail="Total value locked across spot and lending books."
          sparkline={[410, 420, 415, 430, 440, 448, 455, 462]}
        />
        <KpiCard
          title="24h Volume"
          value="$91.2M"
          changePct={-0.42}
          detail="Notional traded across all registered counterparties."
          sparkline={[120, 118, 122, 119, 121, 117, 115, 114]}
        />
        <KpiCard
          title="Open interest"
          value="$210M"
          changePct={0.18}
          detail="Aggregate OI for listed perpetual-style hedges."
          sparkline={[200, 202, 205, 204, 208, 209, 210, 210]}
        />
        <KpiCard
          title="VaR (1d 99%)"
          value="$3.1M"
          changePct={-2.1}
          detail="Parametric VaR — illustrative, not a live risk engine readout."
          sparkline={[3.8, 3.6, 3.5, 3.4, 3.35, 3.2, 3.15, 3.1]}
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <PriceChart title="BTC-USD" data={candles} />
        <div className="rounded-lg border border-bpvp-border bg-bpvp-card p-4 text-sm text-bpvp-text-secondary transition-all duration-150 ease-out">
          <p className="font-medium text-bpvp-text-primary">Operations</p>
          <ul className="mt-3 list-inside list-disc space-y-2">
            <li>Settlement batches on schedule</li>
            <li>OTC desk: 2 RFQs awaiting quote</li>
            <li>Lending utilization within policy bands</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
