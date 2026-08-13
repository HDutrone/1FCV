import { ArrowRightLeft, Clock } from "lucide-react";
import { ModulePage } from "@/components/admin/ModulePage";
import { Badge } from "@/components/ui/Badge";
import type { Column } from "@/components/ui/DataTable";

interface Affectation {
  id: string;
  employee: string;
  from: string;
  to: string;
  effectiveDate: string;
  status: "Pending" | "Approved";
}

const rows: Affectation[] = [
  { id: "1", employee: "Grace Kabila", from: "Field Sales", to: "Key Accounts", effectiveDate: "2026-08-18", status: "Pending" },
  { id: "2", employee: "Noel Kabeya", from: "IT Operations", to: "Backend Platform", effectiveDate: "2026-08-01", status: "Approved" },
  { id: "3", employee: "Odette Mbuyi", from: "Marketing", to: "Field Sales", effectiveDate: "2026-07-15", status: "Approved" },
  { id: "4", employee: "Blaise Kanku", from: "Mobile & Web", to: "Backend Platform", effectiveDate: "2026-08-25", status: "Pending" },
];

const columns: Column<Affectation>[] = [
  { key: "employee", header: "Employee", render: (r) => r.employee },
  { key: "from", header: "From", render: (r) => r.from },
  { key: "to", header: "To", render: (r) => r.to },
  { key: "effectiveDate", header: "Effective date", render: (r) => r.effectiveDate },
  {
    key: "status",
    header: "Status",
    render: (r) => <Badge tone={r.status === "Approved" ? "success" : "warning"}>{r.status}</Badge>,
  },
];

export default function AffectationsPage() {
  return (
    <ModulePage
      title="Affectations"
      description="Assign or reassign employees across directions, departments and services."
      actionLabel="New affectation"
      stats={[
        { label: "Pending requests", value: "6", icon: Clock },
        { label: "This month", value: "23", icon: ArrowRightLeft },
      ]}
      columns={columns}
      rows={rows}
      rowKey={(r) => r.id}
    />
  );
}
