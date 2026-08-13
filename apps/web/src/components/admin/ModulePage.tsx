import type { LucideIcon } from "lucide-react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";

interface Stat {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: { value: string; direction: "up" | "down" };
}

interface ModulePageProps<Row> {
  title: string;
  description: string;
  actionLabel: string;
  stats?: Stat[];
  columns: Column<Row>[];
  rows: Row[];
  rowKey: (row: Row) => string;
}

export function ModulePage<Row>({
  title,
  description,
  actionLabel,
  stats,
  columns,
  rows,
  rowKey,
}: ModulePageProps<Row>) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={title}
        description={description}
        action={
          <Button size="md">
            <Plus size={16} />
            {actionLabel}
          </Button>
        }
      />

      {stats && stats.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      )}

      <DataTable columns={columns} rows={rows} rowKey={rowKey} />
    </div>
  );
}
