import { History, ArrowRightLeft } from "lucide-react";
import { ModulePage } from "@/components/admin/ModulePage";
import type { Column } from "@/components/ui/DataTable";

interface HistoryEntry {
  id: string;
  employee: string;
  from: string;
  to: string;
  date: string;
  changedBy: string;
}

const rows: HistoryEntry[] = [
  { id: "1", employee: "Odette Mbuyi", from: "Marketing", to: "Field Sales", date: "2026-07-15", changedBy: "Alice Mbala" },
  { id: "2", employee: "Noel Kabeya", from: "IT Operations", to: "Backend Platform", date: "2026-08-01", changedBy: "Esther Lukusa" },
  { id: "3", employee: "Chantal Mwewa", from: "Accounts Payable", to: "Treasury", date: "2026-05-20", changedBy: "Paul Tshibangu" },
  { id: "4", employee: "Fabrice Lumu", from: "Field Sales", to: "Key Accounts", date: "2026-03-11", changedBy: "Jean Kalonji" },
];

const columns: Column<HistoryEntry>[] = [
  { key: "employee", header: "Employee", render: (r) => r.employee },
  { key: "from", header: "From", render: (r) => r.from },
  { key: "to", header: "To", render: (r) => r.to },
  { key: "date", header: "Date", render: (r) => r.date },
  { key: "changedBy", header: "Approved by", render: (r) => r.changedBy },
];

export default function AffectationHistoryPage() {
  return (
    <ModulePage
      title="Affectation history"
      description="Full, read-only history of every employee assignment change."
      actionLabel="Export history"
      stats={[
        { label: "Total records", value: "1,842", icon: History },
        { label: "This year", value: "196", icon: ArrowRightLeft },
      ]}
      columns={columns}
      rows={rows}
      rowKey={(r) => r.id}
    />
  );
}
