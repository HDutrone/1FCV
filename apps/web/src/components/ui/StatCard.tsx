import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card } from "./Card";
import { cn } from "@/lib/cn";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: { value: string; direction: "up" | "down" };
}

export function StatCard({ label, value, icon: Icon, trend }: StatCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-foreground-muted">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <Icon size={20} />
        </div>
      </div>
      {trend && (
        <div
          className={cn(
            "mt-3 inline-flex items-center gap-1 text-xs font-medium",
            trend.direction === "up" ? "text-success" : "text-danger",
          )}
        >
          {trend.direction === "up" ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {trend.value}
        </div>
      )}
    </Card>
  );
}
