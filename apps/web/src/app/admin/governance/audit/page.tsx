import { ShieldCheck, Activity } from "lucide-react";
import { ModulePage } from "@/components/admin/ModulePage";
import { Badge } from "@/components/ui/Badge";
import type { Column } from "@/components/ui/DataTable";

interface AuditEntry {
  id: string;
  action: string;
  actor: string;
  target: string;
  at: string;
  severity: "Info" | "Warning" | "Critical";
}

const rows: AuditEntry[] = [
  { id: "1", action: "Updated payroll batch", actor: "Chantal Mwewa", target: "Payroll — Jul 2026", at: "2026-08-12 14:02", severity: "Info" },
  { id: "2", action: "Deleted employee record", actor: "Alice Mbala", target: "Employee #4021", at: "2026-08-11 09:41", severity: "Warning" },
  { id: "3", action: "Failed login attempts (5x)", actor: "Unknown", target: "admin@acme.test", at: "2026-08-10 22:17", severity: "Critical" },
  { id: "4", action: "Approved vacation request", actor: "Esther Lukusa", target: "Ruth Ilunga", at: "2026-08-09 11:30", severity: "Info" },
];

const columns: Column<AuditEntry>[] = [
  { key: "action", header: "Action", render: (r) => r.action },
  { key: "actor", header: "Actor", render: (r) => r.actor },
  { key: "target", header: "Target", render: (r) => r.target },
  { key: "at", header: "Timestamp", render: (r) => r.at },
  {
    key: "severity",
    header: "Severity",
    render: (r) => (
      <Badge tone={r.severity === "Critical" ? "danger" : r.severity === "Warning" ? "warning" : "neutral"}>
        {r.severity}
      </Badge>
    ),
  },
];

export default function AuditPage() {
  return (
    <ModulePage
      title="Audit"
      description="A tamper-evident trail of every sensitive action taken in the system."
      actionLabel="Export log"
      stats={[
        { label: "Events today", value: "312", icon: Activity },
        { label: "Critical alerts (7d)", value: "2", icon: ShieldCheck },
      ]}
      columns={columns}
      rows={rows}
      rowKey={(r) => r.id}
    />
  );
}
