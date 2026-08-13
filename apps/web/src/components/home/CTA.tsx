import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function CTA() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl bg-brand-900 px-6 py-16 text-center sm:px-16">
        <div
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              "radial-gradient(circle at 30% 20%, rgba(129,140,248,0.5), transparent 45%), radial-gradient(circle at 75% 80%, rgba(99,102,241,0.4), transparent 50%)",
          }}
        />
        <div className="relative">
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Ready to bring your company onto one platform?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-brand-100 text-pretty">
            Create your workspace today — invite your team and start managing branches, HR,
            payroll and more in minutes.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/register">
              <Button size="lg" className="w-full bg-white text-brand-700 hover:bg-brand-50 sm:w-auto">
                Create your workspace
                <ArrowRight size={18} />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
