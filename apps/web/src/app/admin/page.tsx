import { Building2, TrendingUp, Users2, Wallet } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

const stats = [
  { label: "Active employees", value: "1,204", icon: Users2, trend: { value: "+4.2% this month", direction: "up" as const } },
  { label: "Branches", value: "18", icon: Building2, trend: { value: "+2 this quarter", direction: "up" as const } },
  { label: "Monthly payroll", value: "$482,300", icon: Wallet, trend: { value: "+1.1% vs last month", direction: "up" as const } },
  { label: "Revenue (MTD)", value: "$1.2M", icon: TrendingUp, trend: { value: "-2.4% vs target", direction: "down" as const } },
];

const activity = [
  { label: "New employee onboarded — Kinshasa branch", tone: "success" as const, time: "2h ago" },
  { label: "Vacation request pending approval — J. Mwamba", tone: "warning" as const, time: "5h ago" },
  { label: "Invoice #INV-2451 overdue", tone: "danger" as const, time: "1d ago" },
  { label: "Stock replenished — Lubumbashi warehouse", tone: "neutral" as const, time: "1d ago" },
  { label: "New CRM lead assigned to sales team", tone: "brand" as const, time: "2d ago" },
];

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Dashboard" description="Company-wide overview, updated in real time." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <h2 className="text-sm font-semibold text-foreground">Revenue vs. payroll</h2>
          <p className="text-xs text-foreground-muted">Last 7 months</p>
          <div className="mt-6 flex h-48 items-end gap-3">
            {[
              { revenue: 60, payroll: 40 },
              { revenue: 75, payroll: 45 },
              { revenue: 55, payroll: 42 },
              { revenue: 90, payroll: 48 },
              { revenue: 70, payroll: 50 },
              { revenue: 100, payroll: 52 },
              { revenue: 85, payroll: 55 },
            ].map((month, i) => (
              <div key={i} className="flex flex-1 items-end gap-1">
                <div
                  className="flex-1 rounded-t bg-brand-500"
                  style={{ height: `${month.revenue * 1.7}px` }}
                />
                <div
                  className="flex-1 rounded-t bg-brand-200"
                  style={{ height: `${month.payroll * 1.7}px` }}
                />
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-5 text-xs text-foreground-muted">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-brand-500" /> Revenue
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-brand-200" /> Payroll
            </span>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-sm font-semibold text-foreground">Recent activity</h2>
          <ul className="mt-4 flex flex-col gap-4">
            {activity.map((item) => (
              <li key={item.label} className="flex items-start gap-3">
                <Badge tone={item.tone} className="mt-0.5 h-2 w-2 shrink-0 rounded-full p-0" />
                <div>
                  <p className="text-sm text-foreground">{item.label}</p>
                  <p className="text-xs text-foreground-muted">{item.time}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
