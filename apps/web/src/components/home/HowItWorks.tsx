const steps = [
  {
    step: "01",
    title: "Create your workspace",
    description: "Register your company and admin account in a quick two-step sign-up.",
  },
  {
    step: "02",
    title: "Set up your organization",
    description: "Add branches, directions, departments and services — then assign your team.",
  },
  {
    step: "03",
    title: "Run day to day",
    description: "Track payroll, stock, sales, CRM and billing, with everything audited automatically.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Up and running in minutes
        </h2>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-3">
        {steps.map(({ step, title, description }) => (
          <div key={step} className="relative pl-14 sm:pl-0">
            <span className="absolute left-0 top-0 text-4xl font-bold text-brand-100 sm:static sm:text-5xl">
              {step}
            </span>
            <h3 className="mt-0 text-base font-semibold text-foreground sm:mt-4">{title}</h3>
            <p className="mt-2 text-sm text-foreground-muted text-pretty">{description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
