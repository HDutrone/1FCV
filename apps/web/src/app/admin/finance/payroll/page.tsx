import { Wallet, Users2 } from "lucide-react";
import { ModulePage } from "@/components/admin/ModulePage";
import { Badge } from "@/components/ui/Badge";
import type { Column } from "@/components/ui/DataTable";

interface Payslip {
  id: string;
  employee: string;
  branch: string;
  period: string;
  netPay: string;
  status: "Paid" | "Processing" | "Failed";
}

const rows: Payslip[] = [
  { id: "1", employee: "Grace Kabila", branch: "Kinshasa HQ", period: "Jul 2026", netPay: "$1,420", status: "Paid" },
  { id: "2", employee: "Jean Mwamba", branch: "Lubumbashi Branch", period: "Jul 2026", netPay: "$980", status: "Paid" },
  { id: "3", employee: "Ruth Ilunga", branch: "Kinshasa HQ", period: "Jul 2026", netPay: "$1,650", status: "Processing" },
  { id: "4", employee: "Fabrice Lumu", branch: "Goma Branch", period: "Jul 2026", netPay: "$1,100", status: "Failed" },
];

const columns: Column<Payslip>[] = [
  { key: "employee", header: "Employee", render: (r) => r.employee },
  { key: "branch", header: "Branch", render: (r) => r.branch },
  { key: "period", header: "Period", render: (r) => r.period },
  { key: "netPay", header: "Net pay", render: (r) => r.netPay },
  {
    key: "status",
    header: "Status",
    render: (r) => (
      <Badge tone={r.status === "Paid" ? "success" : r.status === "Failed" ? "danger" : "warning"}>
        {r.status}
      </Badge>
    ),
  },
];

export default function PayrollPage() {
  return (
    <ModulePage
      title="Payroll"
      description="Salary payments and payslips across all branches."
      actionLabel="Run payroll"
      stats={[
        { label: "This month's payroll", value: "$482,300", icon: Wallet },
        { label: "Employees paid", value: "1,198 / 1,204", icon: Users2 },
      ]}
      columns={columns}
      rows={rows}
      rowKey={(r) => r.id}
    />
  );
}
