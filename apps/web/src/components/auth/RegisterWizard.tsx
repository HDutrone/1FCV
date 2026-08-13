"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { StepIndicator } from "@/components/ui/StepIndicator";

const steps = [{ label: "Company & account" }, { label: "Your profile" }];

export function RegisterWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const startAtStep2 = searchParams.get("step") === "2";

  const [step, setStep] = useState(startAtStep2 ? 2 : 1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  async function submitStep1(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register/step1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName, email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? "Could not create your account");
        return;
      }

      setStep(2);
      router.replace("/register?step=2");
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  async function submitStep2(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register/step2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, phone: phone || undefined }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? "Could not complete your profile");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <StepIndicator steps={steps} current={step} />

      {step === 1 ? (
        <form onSubmit={submitStep1} className="flex flex-col gap-5">
          <Input
            label="Company name"
            name="companyName"
            placeholder="Acme SARL"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
          />
          <Input
            label="Work email"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            name="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
          <Input
            label="Confirm password"
            type="password"
            name="confirmPassword"
            autoComplete="new-password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={8}
            required
          />

          {error && (
            <p className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading && <Loader2 size={16} className="animate-spin" />}
            Continue
          </Button>
        </form>
      ) : (
        <form onSubmit={submitStep2} className="flex flex-col gap-5">
          <Input
            label="Full name"
            name="fullName"
            placeholder="Alice Admin"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
          <Input
            label="Phone number"
            name="phone"
            type="tel"
            placeholder="+243 812 345 678"
            hint="Optional, but recommended for account recovery"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          {error && (
            <p className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger" role="alert">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            {!startAtStep2 && (
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={() => {
                  setStep(1);
                  router.replace("/register");
                }}
              >
                Back
              </Button>
            )}
            <Button type="submit" size="lg" className="flex-1" disabled={loading}>
              {loading && <Loader2 size={16} className="animate-spin" />}
              Finish setup
            </Button>
          </div>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-foreground-muted">
        Already have a workspace?{" "}
        <Link href="/login" className="font-medium text-brand-600 hover:text-brand-700">
          Sign in
        </Link>
      </p>
    </div>
  );
}
