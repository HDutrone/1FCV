import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { RegisterWizard } from "@/components/auth/RegisterWizard";

export const metadata: Metadata = {
  title: "Create your workspace — 1FCV Suite",
};

export default function RegisterPage() {
  return (
    <AuthShell
      title="Create your company workspace"
      subtitle="Two quick steps and you're in — no credit card required."
    >
      <Suspense>
        <RegisterWizard />
      </Suspense>
    </AuthShell>
  );
}
