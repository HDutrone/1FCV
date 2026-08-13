import { Calculator, TrendingUp } from "lucide-react";
import { ModulePage } from "@/components/admin/ModulePage";
import { Badge } from "@/components/ui/Badge";
import type { Column } from "@/components/ui/DataTable";

interface LedgerEntry {
  id: string;
  reference: string;
  account: string;
  type: "Debit" | "Credit";
  amount: string;
  date: string;
}

const rows: LedgerEntry[] = [
  { id: "1", reference: "JE-3021", account: "Sales Revenue", type: "Credit", amount: "$45,200", date: "2026-08-10" },
  { id: "2", reference: "JE-3022", account: "Office Supplies", type: "Debit", amount: "$1,240", date: "2026-08-10" },
  { id: "3", reference: "JE-3023", account: "Payroll Expense", type: "Debit", amount: "$482,300", date: "2026-08-01" },
  { id: "4", reference: "JE-3024", account: "Accounts Receivable", type: "Debit", amount: "$18,900", date: "2026-08-08" },
];

const columns: Column<LedgerEntry>[] = [
  { key: "reference", header: "Reference", render: (r) => r.reference },
  { key: "account", header: "Account", render: (r) => r.account },
  {
    key: "type",
    header: "Type",
    render: (r) => <Badge tone={r.type === "Credit" ? "success" : "neutral"}>{r.type}</Badge>,
  },
  { key: "amount", header: "Amount", render: (r) => r.amount },
  { key: "date", header: "Date", render: (r) => r.date },
];

export default function AccountingPage() {
  return (
    <ModulePage
      title="Accounting"
      description="General ledger, journal entries and bookkeeping."
      actionLabel="New entry"
      stats={[
        { label: "Net position (MTD)", value: "$1.02M", icon: TrendingUp },
        { label: "Open journal entries", value: "12", icon: Calculator },
      ]}
      columns={columns}
      rows={rows}
      rowKey={(r) => r.id}
    />
  );
}
