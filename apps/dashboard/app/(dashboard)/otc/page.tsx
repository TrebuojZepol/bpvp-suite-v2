import { RfqForm } from "@/components/forms/RfqForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function OtcPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-bpvp-text-primary">OTC desk</h1>
        <p className="text-sm text-bpvp-text-secondary">Request-for-quote workflow (RFQ).</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <RfqForm />
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Active quotes</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-bpvp-text-secondary">
            No live RFQs connected — wire to engine OTC service when available.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
