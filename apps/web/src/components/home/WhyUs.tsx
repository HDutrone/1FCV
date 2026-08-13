import { Zap, ShieldCheck, Smartphone, Layers3 } from "lucide-react";

const points = [
  {
    icon: Zap,
    title: "Real-time by design",
    description:
      "Redis-backed pub/sub pushes updates instantly across every connected device — no refresh needed.",
  },
  {
    icon: ShieldCheck,
    title: "Secure by default",
    description:
      "JWT-based auth, role-based access control and a full audit trail on every sensitive action.",
  },
  {
    icon: Smartphone,
    title: "Works everywhere",
    description:
      "A single responsive interface tuned for desktop, tablet and mobile — no separate app to maintain.",
  },
  {
    icon: Layers3,
    title: "One source of truth",
    description:
      "HR, finance and operations share the same data model, so numbers always agree across teams.",
  },
];

export function WhyUs() {
  return (
    <section id="features" className="border-y border-border bg-surface-muted/40">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {points.map(({ icon: Icon, title, description }) => (
            <div key={title}>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white">
                <Icon size={20} />
              </span>
              <h3 className="mt-4 text-base font-semibold text-foreground">{title}</h3>
              <p className="mt-2 text-sm text-foreground-muted text-pretty">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
