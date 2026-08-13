import { Briefcase, Users2 } from "lucide-react";
import { ModulePage } from "@/components/admin/ModulePage";
import type { Column } from "@/components/ui/DataTable";

interface Service {
  id: string;
  name: string;
  department: string;
  supervisor: string;
  headcount: number;
}

const rows: Service[] = [
  { id: "1", name: "Key Accounts", department: "Sales", supervisor: "Fabrice Lumu", headcount: 18 },
  { id: "2", name: "Field Sales", department: "Sales", supervisor: "Odette Mbuyi", headcount: 42 },
  { id: "3", name: "Backend Platform", department: "Engineering", supervisor: "Ruth Ilunga", headcount: 22 },
  { id: "4", name: "Mobile & Web", department: "Engineering", supervisor: "Blaise Kanku", headcount: 19 },
  { id: "5", name: "Payroll Desk", department: "Treasury", supervisor: "Nadia Mputu", headcount: 8 },
];

const columns: Column<Service>[] = [
  { key: "name", header: "Service", render: (r) => r.name },
  { key: "department", header: "Department", render: (r) => r.department },
  { key: "supervisor", header: "Supervisor", render: (r) => r.supervisor },
  { key: "headcount", header: "Headcount", render: (r) => r.headcount },
];

export default function ServicesPage() {
  return (
    <ModulePage
      title="Services"
      description="The smallest organizational unit, nested within departments."
      actionLabel="Add service"
      stats={[
        { label: "Services", value: "31", icon: Briefcase },
        { label: "Avg. headcount", value: "22", icon: Users2 },
      ]}
      columns={columns}
      rows={rows}
      rowKey={(r) => r.id}
    />
  );
}
