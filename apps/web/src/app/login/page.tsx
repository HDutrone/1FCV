import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign in — 1FCV Suite",
};

export default function LoginPage() {
  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your company workspace.">
      <LoginForm />
    </AuthShell>
  );
}
