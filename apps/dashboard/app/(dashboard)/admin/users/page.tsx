import { UserTable } from "@/components/tables/UserTable";

export default function AdminUsersPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-bpvp-text-primary">Users</h1>
        <p className="text-sm text-bpvp-text-secondary">Identity and role administration (demo rows).</p>
      </div>
      <UserTable />
    </div>
  );
}
