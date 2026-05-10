import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function QuantPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-bpvp-text-primary">Quant</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Models & research</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-bpvp-text-secondary">
          Placeholder for volatility surfaces, calibration runs, and strategy research notebooks.
        </CardContent>
      </Card>
    </div>
  );
}
