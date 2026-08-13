import { Plane, Clock } from "lucide-react";
import { ModulePage } from "@/components/admin/ModulePage";
import { Badge } from "@/components/ui/Badge";
import type { Column } from "@/components/ui/DataTable";

interface Vacation {
  id: string;
  employee: string;
  type: string;
  from: string;
  to: string;
  status: "Pending" | "Approved" | "Rejected";
}

const rows: Vacation[] = [
  { id: "1", employee: "Jean Mwamba", type: "Annual leave", from: "2026-08-18", to: "2026-08-28", status: "Pending" },
  { id: "2", employee: "Ruth Ilunga", type: "Sick leave", from: "2026-08-12", to: "2026-08-14", status: "Approved" },
  { id: "3", employee: "Fabrice Lumu", type: "Annual leave", from: "2026-09-01", to: "2026-09-10", status: "Pending" },
  { id: "4", employee: "Nadia Mputu", type: "Maternity leave", from: "2026-07-01", to: "2026-10-01", status: "Approved" },
  { id: "5", employee: "David Mputu", type: "Annual leave", from: "2026-08-05", to: "2026-08-08", status: "Rejected" },
];

const columns: Column<Vacation>[] = [
  { key: "employee", header: "Employee", render: (r) => r.employee },
  { key: "type", header: "Type", render: (r) => r.type },
  { key: "from", header: "From", render: (r) => r.from },
  { key: "to", header: "To", render: (r) => r.to },
  {
    key: "status",
    header: "Status",
    render: (r) => (
      <Badge tone={r.status === "Approved" ? "success" : r.status === "Rejected" ? "danger" : "warning"}>
        {r.status}
      </Badge>
    ),
  },
];

export default function VacationsPage() {
  return (
    <ModulePage
      title="Vacations"
      description="Leave requests and approvals across the company."
      actionLabel="New request"
      stats={[
        { label: "Pending approvals", value: "9", icon: Clock },
        { label: "On leave today", value: "14", icon: Plane },
      ]}
      columns={columns}
      rows={rows}
      rowKey={(r) => r.id}
    />
  );
}
