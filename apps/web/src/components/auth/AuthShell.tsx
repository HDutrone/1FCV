import Link from "next/link";
import { ArrowLeft, Building2, ShieldCheck, Users2, Wallet } from "lucide-react";

const highlights = [
  { icon: Building2, text: "Branches & HR org structure in one place" },
  { icon: Users2, text: "Trainings, vacations & assignment history" },
  { icon: Wallet, text: "Payroll, accounting and billing, unified" },
  { icon: ShieldCheck, text: "Full audit trail on every action" },
];

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-[42%] flex-col justify-between overflow-hidden bg-brand-900 p-10 text-white lg:flex xl:w-[38%]">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(129,140,248,0.5), transparent 45%), radial-gradient(circle at 80% 70%, rgba(99,102,241,0.45), transparent 50%)",
          }}
        />
        <Link href="/" className="relative flex items-center gap-2 text-lg font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-brand-700">
            1F
          </span>
          1FCV Suite
        </Link>

        <div className="relative flex flex-col gap-6">
          <p className="text-2xl font-semibold leading-snug text-balance">
            The operating system for how your company actually runs.
          </p>
          <ul className="flex flex-col gap-4">
            {highlights.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-brand-100">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <Icon size={18} />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-brand-200/80">
          &copy; {new Date().getFullYear()} 1FCV Suite. All rights reserved.
        </p>
      </div>

      <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-10 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-1.5 text-sm text-foreground-muted transition-colors hover:text-foreground lg:hidden"
          >
            <ArrowLeft size={16} />
            Back to home
          </Link>

          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          <p className="mt-2 text-sm text-foreground-muted">{subtitle}</p>

          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
