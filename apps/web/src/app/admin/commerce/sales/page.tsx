import { ShoppingCart, TrendingUp } from "lucide-react";
import { ModulePage } from "@/components/admin/ModulePage";
import { Badge } from "@/components/ui/Badge";
import type { Column } from "@/components/ui/DataTable";

interface Order {
  id: string;
  order: string;
  customer: string;
  branch: string;
  amount: string;
  status: "Completed" | "Processing" | "Cancelled";
}

const rows: Order[] = [
  { id: "1", order: "SO-8821", customer: "Congo Retail SARL", branch: "Kinshasa HQ", amount: "$6,720", status: "Completed" },
  { id: "2", order: "SO-8825", customer: "Nova Import-Export", branch: "Lubumbashi Branch", amount: "$9,800", status: "Processing" },
  { id: "3", order: "SO-8827", customer: "Bakin Distribution", branch: "Goma Branch", amount: "$3,150", status: "Completed" },
  { id: "4", order: "SO-8830", customer: "Kivu Trading", branch: "Kinshasa HQ", amount: "$2,400", status: "Cancelled" },
];

const columns: Column<Order>[] = [
  { key: "order", header: "Order", render: (r) => r.order },
  { key: "customer", header: "Customer", render: (r) => r.customer },
  { key: "branch", header: "Branch", render: (r) => r.branch },
  { key: "amount", header: "Amount", render: (r) => r.amount },
  {
    key: "status",
    header: "Status",
    render: (r) => (
      <Badge tone={r.status === "Completed" ? "success" : r.status === "Cancelled" ? "danger" : "warning"}>
        {r.status}
      </Badge>
    ),
  },
];

export default function SalesPage() {
  return (
    <ModulePage
      title="Sales"
      description="Sales orders and revenue across every branch."
      actionLabel="New order"
      stats={[
        { label: "Revenue (MTD)", value: "$1.2M", icon: TrendingUp },
        { label: "Orders this week", value: "146", icon: ShoppingCart },
      ]}
      columns={columns}
      rows={rows}
      rowKey={(r) => r.id}
    />
  );
}
