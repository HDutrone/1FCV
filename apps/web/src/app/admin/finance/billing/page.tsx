import { Receipt, AlertTriangle } from "lucide-react";
import { ModulePage } from "@/components/admin/ModulePage";
import { Badge } from "@/components/ui/Badge";
import type { Column } from "@/components/ui/DataTable";

interface Bill {
  id: string;
  invoice: string;
  customer: string;
  amount: string;
  dueDate: string;
  status: "Paid" | "Pending" | "Overdue";
}

const rows: Bill[] = [
  { id: "1", invoice: "INV-2448", customer: "Groupe Kivu Trading", amount: "$12,400", dueDate: "2026-08-05", status: "Paid" },
  { id: "2", invoice: "INV-2450", customer: "Congo Retail SARL", amount: "$6,720", dueDate: "2026-08-20", status: "Pending" },
  { id: "3", invoice: "INV-2451", customer: "Bakin Distribution", amount: "$3,150", dueDate: "2026-08-01", status: "Overdue" },
  { id: "4", invoice: "INV-2453", customer: "Nova Import-Export", amount: "$9,800", dueDate: "2026-08-28", status: "Pending" },
];

const columns: Column<Bill>[] = [
  { key: "invoice", header: "Invoice", render: (r) => r.invoice },
  { key: "customer", header: "Customer", render: (r) => r.customer },
  { key: "amount", header: "Amount", render: (r) => r.amount },
  { key: "dueDate", header: "Due date", render: (r) => r.dueDate },
  {
    key: "status",
    header: "Status",
    render: (r) => (
      <Badge tone={r.status === "Paid" ? "success" : r.status === "Overdue" ? "danger" : "warning"}>
        {r.status}
      </Badge>
    ),
  },
];

export default function BillingPage() {
  return (
    <ModulePage
      title="Billing"
      description="Customer invoices and bills, from issue to payment."
      actionLabel="New invoice"
      stats={[
        { label: "Outstanding", value: "$19,670", icon: Receipt },
        { label: "Overdue invoices", value: "3", icon: AlertTriangle },
      ]}
      columns={columns}
      rows={rows}
      rowKey={(r) => r.id}
    />
  );
}
