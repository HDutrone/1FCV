import { Building2, MapPin, Users2 } from "lucide-react";
import { ModulePage } from "@/components/admin/ModulePage";
import { Badge } from "@/components/ui/Badge";
import type { Column } from "@/components/ui/DataTable";

interface Branch {
  id: string;
  name: string;
  city: string;
  manager: string;
  employees: number;
  status: "Active" | "Closed";
}

const rows: Branch[] = [
  { id: "1", name: "Kinshasa HQ", city: "Kinshasa", manager: "Alice Mbala", employees: 312, status: "Active" },
  { id: "2", name: "Lubumbashi Branch", city: "Lubumbashi", manager: "Jean Kalonji", employees: 154, status: "Active" },
  { id: "3", name: "Goma Branch", city: "Goma", manager: "Marie Nzuzi", employees: 87, status: "Active" },
  { id: "4", name: "Kisangani Branch", city: "Kisangani", manager: "Paul Tshibangu", employees: 64, status: "Active" },
  { id: "5", name: "Matadi Depot", city: "Matadi", manager: "Sarah Ilunga", employees: 22, status: "Closed" },
];

const columns: Column<Branch>[] = [
  { key: "name", header: "Branch", render: (r) => r.name },
  { key: "city", header: "City", render: (r) => r.city },
  { key: "manager", header: "Manager", render: (r) => r.manager },
  { key: "employees", header: "Employees", render: (r) => r.employees },
  {
    key: "status",
    header: "Status",
    render: (r) => <Badge tone={r.status === "Active" ? "success" : "neutral"}>{r.status}</Badge>,
  },
];

export default function BranchesPage() {
  return (
    <ModulePage
      title="Branches"
      description="Every physical location your company operates from."
      actionLabel="Add branch"
      stats={[
        { label: "Total branches", value: "18", icon: Building2 },
        { label: "Cities covered", value: "9", icon: MapPin },
        { label: "Staff across branches", value: "1,204", icon: Users2 },
      ]}
      columns={columns}
      rows={rows}
      rowKey={(r) => r.id}
    />
  );
}
