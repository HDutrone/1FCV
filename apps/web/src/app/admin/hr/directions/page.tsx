import { Network, Users2 } from "lucide-react";
import { ModulePage } from "@/components/admin/ModulePage";
import type { Column } from "@/components/ui/DataTable";

interface Direction {
  id: string;
  name: string;
  head: string;
  departments: number;
  headcount: number;
}

const rows: Direction[] = [
  { id: "1", name: "General Direction", head: "Alice Mbala", departments: 3, headcount: 420 },
  { id: "2", name: "Commercial Direction", head: "Jean Kalonji", departments: 4, headcount: 310 },
  { id: "3", name: "Technical Direction", head: "Marie Nzuzi", departments: 5, headcount: 280 },
  { id: "4", name: "Finance Direction", head: "Paul Tshibangu", departments: 2, headcount: 194 },
];

const columns: Column<Direction>[] = [
  { key: "name", header: "Direction", render: (r) => r.name },
  { key: "head", header: "Head of direction", render: (r) => r.head },
  { key: "departments", header: "Departments", render: (r) => r.departments },
  { key: "headcount", header: "Headcount", render: (r) => r.headcount },
];

export default function DirectionsPage() {
  return (
    <ModulePage
      title="Directions"
      description="Top-level directions that structure the organization."
      actionLabel="Add direction"
      stats={[
        { label: "Directions", value: "4", icon: Network },
        { label: "Total headcount", value: "1,204", icon: Users2 },
      ]}
      columns={columns}
      rows={rows}
      rowKey={(r) => r.id}
    />
  );
}
