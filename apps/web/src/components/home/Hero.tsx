import Link from "next/link";
import { ArrowRight, Building2, ShoppingCart, Users2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage:
            "radial-gradient(circle at 15% 10%, var(--brand-100), transparent 40%), radial-gradient(circle at 85% 25%, var(--brand-50), transparent 45%)",
        }}
      />
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-8 lg:py-24 lg:px-8">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-foreground-muted">
            Now with real-time notifications
          </span>

          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-balance text-foreground sm:text-5xl lg:text-6xl">
            One platform to run your entire company.
          </h1>

          <p className="mt-6 max-w-xl text-lg text-foreground-muted text-pretty">
            Branches, HR, payroll, stock, CRM, accounting, audit and billing — unified in a
            single, modern workspace built for web, tablet and mobile.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto">
                Start free workspace
                <ArrowRight size={18} />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                Sign in
              </Button>
            </Link>
          </div>

          <p className="mt-6 text-sm text-foreground-muted">
            No credit card required · Set up in under 2 minutes
          </p>
        </div>

        <div className="relative">
          <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl shadow-brand-900/10">
            <div className="flex items-center gap-1.5 border-b border-border bg-surface-muted px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-danger/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
            </div>
            <div className="grid grid-cols-[auto_1fr]">
              <div className="hidden w-40 flex-col gap-1 border-r border-border p-3 sm:flex">
                {[
                  { icon: Building2, label: "Branches" },
                  { icon: Users2, label: "HR" },
                  { icon: Wallet, label: "Payroll" },
                  { icon: ShoppingCart, label: "Sales" },
                ].map(({ icon: Icon, label }, i) => (
                  <div
                    key={label}
                    className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium ${
                      i === 0 ? "bg-brand-50 text-brand-700" : "text-foreground-muted"
                    }`}
                  >
                    <Icon size={14} />
                    {label}
                  </div>
                ))}
              </div>
              <div className="col-span-2 space-y-3 p-4 sm:col-span-1">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Revenue", value: "$482K" },
                    { label: "Active staff", value: "1,204" },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-xl border border-border p-3">
                      <p className="text-[11px] text-foreground-muted">{stat.label}</p>
                      <p className="mt-1 text-lg font-semibold text-foreground">{stat.value}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border border-border p-3">
                  <div className="flex items-end gap-1.5">
                    {[40, 65, 45, 80, 60, 95, 70].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t bg-brand-500/70"
                        style={{ height: `${h * 0.6}px` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute -bottom-4 -left-4 hidden rounded-xl border border-border bg-surface p-3 shadow-lg sm:block">
            <div className="flex items-center gap-2 text-xs font-medium text-success">
              <span className="h-2 w-2 rounded-full bg-success" />
              Live sync via Redis
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
