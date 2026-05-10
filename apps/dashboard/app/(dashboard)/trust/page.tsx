import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TrustPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-bpvp-text-primary">Trust</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Custody & attestations</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-bpvp-text-secondary">
          Placeholder for proof-of-reserves, attestation schedules, and third-party audit status.
        </CardContent>
      </Card>
    </div>
  );
}
