import { navGroups } from "@/lib/nav-config";
import { Card } from "@/components/ui/Card";

export function FeaturesGrid() {
  const groups = navGroups.filter((g) => g.label !== "Overview");

  return (
    <section id="modules" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Every module your company needs
        </h2>
        <p className="mt-4 text-lg text-foreground-muted text-pretty">
          Stop stitching together spreadsheets and point solutions. It&apos;s all here, wired
          together and kept in sync in real time.
        </p>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => (
          <Card key={group.label} className="p-6">
            <h3 className="text-base font-semibold text-foreground">{group.label}</h3>
            <ul className="mt-4 flex flex-col gap-3">
              {group.items.map(({ icon: Icon, label, description }) => (
                <li key={label} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <Icon size={16} />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{label}</p>
                    <p className="text-xs text-foreground-muted">{description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </section>
  );
}
