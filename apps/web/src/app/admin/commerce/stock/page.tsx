import { Package, AlertTriangle } from "lucide-react";
import { ModulePage } from "@/components/admin/ModulePage";
import { Badge } from "@/components/ui/Badge";
import type { Column } from "@/components/ui/DataTable";

interface StockItem {
  id: string;
  sku: string;
  name: string;
  warehouse: string;
  quantity: number;
  status: "In stock" | "Low" | "Out of stock";
}

const rows: StockItem[] = [
  { id: "1", sku: "SKU-1042", name: "Office Chair — Ergo", warehouse: "Kinshasa HQ", quantity: 240, status: "In stock" },
  { id: "2", sku: "SKU-1088", name: "Laptop Stand", warehouse: "Lubumbashi Branch", quantity: 18, status: "Low" },
  { id: "3", sku: "SKU-1103", name: "Printer Toner — Black", warehouse: "Goma Branch", quantity: 0, status: "Out of stock" },
  { id: "4", sku: "SKU-1155", name: "Warehouse Pallet Wrap", warehouse: "Matadi Depot", quantity: 520, status: "In stock" },
];

const columns: Column<StockItem>[] = [
  { key: "sku", header: "SKU", render: (r) => r.sku },
  { key: "name", header: "Item", render: (r) => r.name },
  { key: "warehouse", header: "Warehouse", render: (r) => r.warehouse },
  { key: "quantity", header: "Quantity", render: (r) => r.quantity },
  {
    key: "status",
    header: "Status",
    render: (r) => (
      <Badge tone={r.status === "In stock" ? "success" : r.status === "Out of stock" ? "danger" : "warning"}>
        {r.status}
      </Badge>
    ),
  },
];

export default function StockPage() {
  return (
    <ModulePage
      title="Stock"
      description="Inventory levels across all warehouses."
      actionLabel="Add item"
      stats={[
        { label: "SKUs tracked", value: "1,340", icon: Package },
        { label: "Low or out of stock", value: "27", icon: AlertTriangle },
      ]}
      columns={columns}
      rows={rows}
      rowKey={(r) => r.id}
    />
  );
}
