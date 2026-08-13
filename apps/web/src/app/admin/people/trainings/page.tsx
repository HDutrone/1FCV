import { GraduationCap, Users2 } from "lucide-react";
import { ModulePage } from "@/components/admin/ModulePage";
import { Badge } from "@/components/ui/Badge";
import type { Column } from "@/components/ui/DataTable";

interface Training {
  id: string;
  title: string;
  trainer: string;
  participants: number;
  startDate: string;
  status: "Scheduled" | "Ongoing" | "Completed";
}

const rows: Training[] = [
  { id: "1", title: "Workplace Safety Refresher", trainer: "Ext. — SafeWork Institute", participants: 40, startDate: "2026-08-20", status: "Scheduled" },
  { id: "2", title: "Leadership Fundamentals", trainer: "Esther Lukusa", participants: 18, startDate: "2026-08-10", status: "Ongoing" },
  { id: "3", title: "Advanced Excel for Finance", trainer: "Chantal Mwewa", participants: 12, startDate: "2026-07-05", status: "Completed" },
  { id: "4", title: "Customer Service Excellence", trainer: "Grace Kabila", participants: 35, startDate: "2026-06-18", status: "Completed" },
];

const columns: Column<Training>[] = [
  { key: "title", header: "Training", render: (r) => r.title },
  { key: "trainer", header: "Trainer", render: (r) => r.trainer },
  { key: "participants", header: "Participants", render: (r) => r.participants },
  { key: "startDate", header: "Start date", render: (r) => r.startDate },
  {
    key: "status",
    header: "Status",
    render: (r) => (
      <Badge tone={r.status === "Completed" ? "success" : r.status === "Ongoing" ? "brand" : "neutral"}>
        {r.status}
      </Badge>
    ),
  },
];

export default function TrainingsPage() {
  return (
    <ModulePage
      title="Trainings"
      description="Plan and track employee training programs."
      actionLabel="Schedule training"
      stats={[
        { label: "Upcoming sessions", value: "5", icon: GraduationCap },
        { label: "Employees trained (YTD)", value: "312", icon: Users2 },
      ]}
      columns={columns}
      rows={rows}
      rowKey={(r) => r.id}
    />
  );
}
