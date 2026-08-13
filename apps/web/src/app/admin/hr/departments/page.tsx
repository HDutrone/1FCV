import { Layers, Users2 } from "lucide-react";
import { ModulePage } from "@/components/admin/ModulePage";
import type { Column } from "@/components/ui/DataTable";

interface Department {
  id: string;
  name: string;
  direction: string;
  head: string;
  services: number;
  headcount: number;
}

const rows: Department[] = [
  { id: "1", name: "Sales", direction: "Commercial Direction", head: "Grace Kabila", services: 2, headcount: 120 },
  { id: "2", name: "Marketing", direction: "Commercial Direction", head: "David Mputu", services: 2, headcount: 64 },
  { id: "3", name: "Engineering", direction: "Technical Direction", head: "Esther Lukusa", services: 3, headcount: 150 },
  { id: "4", name: "IT Operations", direction: "Technical Direction", head: "Noel Kabeya", services: 2, headcount: 58 },
  { id: "5", name: "Treasury", direction: "Finance Direction", head: "Chantal Mwewa", services: 2, headcount: 40 },
];

const columns: Column<Department>[] = [
  { key: "name", header: "Department", render: (r) => r.name },
  { key: "direction", header: "Direction", render: (r) => r.direction },
  { key: "head", header: "Head", render: (r) => r.head },
  { key: "services", header: "Services", render: (r) => r.services },
  { key: "headcount", header: "Headcount", render: (r) => r.headcount },
];

export default function DepartmentsPage() {
  return (
    <ModulePage
      title="Departments"
      description="Departments organized within each direction."
      actionLabel="Add department"
      stats={[
        { label: "Departments", value: "14", icon: Layers },
        { label: "Avg. headcount", value: "86", icon: Users2 },
      ]}
      columns={columns}
      rows={rows}
      rowKey={(r) => r.id}
    />
  );
}
