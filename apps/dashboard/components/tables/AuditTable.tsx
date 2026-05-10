"use client";

import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/tables/DataTable";

export type AuditRow = {
  id: string;
  ts: string;
  actor: string;
  action: string;
  resource: string;
  result: string;
};

const demo: AuditRow[] = [
  {
    id: "a1",
    ts: "2026-05-10T09:12:00Z",
    actor: "ada.lovelace",
    action: "policy-change",
    resource: "risk_limits",
    result: "ok",
  },
  {
    id: "a2",
    ts: "2026-05-10T08:55:00Z",
    actor: "alan.turing",
    action: "order.submit",
    resource: "BTC-USD",
    result: "ok",
  },
  {
    id: "a3",
    ts: "2026-05-09T22:01:00Z",
    actor: "system",
    action: "settlement.batch",
    resource: "batch-441",
    result: "ok",
  },
];

export function AuditTable() {
  const columns: Column<AuditRow>[] = [
    { key: "ts", header: "Time", accessor: (r) => r.ts, sortable: true },
    { key: "actor", header: "Actor", accessor: (r) => r.actor, sortable: true },
    { key: "action", header: "Action", accessor: (r) => r.action, sortable: true },
    { key: "resource", header: "Resource", accessor: (r) => r.resource, sortable: true },
    {
      key: "result",
      header: "Result",
      accessor: (r) => (
        <Badge variant={r.result === "ok" ? "primary" : "danger"}>{r.result}</Badge>
      ),
      sortable: true,
    },
  ];

  return <DataTable data={demo} columns={columns} filterKeys={["actor", "action", "resource"]} />;
}
