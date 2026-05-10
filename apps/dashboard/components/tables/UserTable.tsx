"use client";

import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/tables/DataTable";

export type UserRow = {
  id: string;
  username: string;
  role: string;
  status: string;
  lastLogin: string;
};

const demo: UserRow[] = [
  { id: "1", username: "ada.lovelace", role: "admin", status: "active", lastLogin: "2026-05-10T10:00:00Z" },
  { id: "2", username: "alan.turing", role: "trader", status: "active", lastLogin: "2026-05-09T18:22:00Z" },
  { id: "3", username: "grace.hopper", role: "operator", status: "suspended", lastLogin: "2026-05-01T12:00:00Z" },
];

export function UserTable() {
  const columns: Column<UserRow>[] = [
    { key: "username", header: "User", accessor: (r) => r.username, sortable: true },
    {
      key: "role",
      header: "Role",
      accessor: (r) => <Badge variant="default">{r.role}</Badge>,
      sortable: true,
    },
    { key: "status", header: "Status", accessor: (r) => r.status, sortable: true },
    { key: "lastLogin", header: "Last login", accessor: (r) => r.lastLogin, sortable: true },
  ];

  return <DataTable data={demo} columns={columns} filterKeys={["username", "role"]} />;
}
