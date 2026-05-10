import { AuditTable } from "@/components/tables/AuditTable";

export default function AdminAuditPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-bpvp-text-primary">Audit trail</h1>
        <p className="text-sm text-bpvp-text-secondary">Immutable event log (demo data).</p>
      </div>
      <AuditTable />
    </div>
  );
}
