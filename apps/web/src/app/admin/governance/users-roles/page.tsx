import { UserCog, ShieldCheck } from "lucide-react";
import { ModulePage } from "@/components/admin/ModulePage";
import { Badge } from "@/components/ui/Badge";
import type { Column } from "@/components/ui/DataTable";

interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: "Super Admin" | "Admin" | "Manager" | "Employee";
  status: "Active" | "Suspended";
}

const rows: SystemUser[] = [
  { id: "1", name: "Alice Mbala", email: "alice@acme.test", role: "Super Admin", status: "Active" },
  { id: "2", name: "Jean Kalonji", email: "jean@acme.test", role: "Admin", status: "Active" },
  { id: "3", name: "Esther Lukusa", email: "esther@acme.test", role: "Manager", status: "Active" },
  { id: "4", name: "Paul Tshibangu", email: "paul@acme.test", role: "Manager", status: "Suspended" },
];

const columns: Column<SystemUser>[] = [
  { key: "name", header: "Name", render: (r) => r.name },
  { key: "email", header: "Email", render: (r) => r.email },
  { key: "role", header: "Role", render: (r) => <Badge tone="brand">{r.role}</Badge> },
  {
    key: "status",
    header: "Status",
    render: (r) => <Badge tone={r.status === "Active" ? "success" : "neutral"}>{r.status}</Badge>,
  },
];

export default function UsersRolesPage() {
  return (
    <ModulePage
      title="Users & roles"
      description="System users, their roles and permission scopes."
      actionLabel="Invite user"
      stats={[
        { label: "System users", value: "48", icon: UserCog },
        { label: "Roles defined", value: "4", icon: ShieldCheck },
      ]}
      columns={columns}
      rows={rows}
      rowKey={(r) => r.id}
    />
  );
}
