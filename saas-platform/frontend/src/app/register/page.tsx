'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Stepper } from '@/components/auth/Stepper';
import { api, ApiError } from '@/lib/api';
import formStyles from '@/components/auth/Form.module.css';
import styles from './register.module.css';

interface Step1State {
  companyName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface Step2State {
  firstName: string;
  lastName: string;
  phone: string;
  sector: string;
  companySize: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [step1, setStep1] = useState<Step1State>({
    companyName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [step2, setStep2] = useState<Step2State>({
    firstName: '',
    lastName: '',
    phone: '',
    sector: '',
    companySize: '',
  });

  async function handleStep1Submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (step1.password !== step1.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const result = await api.post<{ userId: string }>('/auth/register/step-1', {
        companyName: step1.companyName,
        email: step1.email,
        password: step1.password,
      });
      setUserId(result.userId);
      setStep(2);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create your account. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleStep2Submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!userId) {
      setError('Your session expired — please restart step 1.');
      setStep(1);
      return;
    }

    setLoading(true);
    try {
      const result = await api.post<{ accessToken: string; refreshToken: string }>('/auth/register/step-2', {
        userId,
        ...step2,
      });
      localStorage.setItem('accessToken', result.accessToken);
      localStorage.setItem('refreshToken', result.refreshToken);
      router.push('/admin');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not complete your profile. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      panelTitle="Set up your workspace in two quick steps"
      panelBody="Create your company account, then tell us a bit about your team — you'll be in the dashboard in under a minute."
      highlights={[
        'No credit card required to start',
        'Invite your HR, finance and sales teams later',
        'Your data stays isolated to your company workspace',
      ]}
    >
      <Stepper steps={['Account', 'Profile']} currentStep={step} />

      {error && <div className={formStyles.error}>{error}</div>}

      {step === 1 && (
        <div className={styles.stepPane}>
          <h1 className={formStyles.title}>Create your account</h1>
          <p className={formStyles.subtitle}>Start with your company and login details.</p>

          <form onSubmit={handleStep1Submit}>
            <div className={formStyles.field}>
              <label className={formStyles.label} htmlFor="companyName">Company name</label>
              <input
                id="companyName"
                required
                className={formStyles.input}
                placeholder="Acme Holding"
                value={step1.companyName}
                onChange={(e) => setStep1({ ...step1, companyName: e.target.value })}
              />
            </div>

            <div className={formStyles.field}>
              <label className={formStyles.label} htmlFor="email">Work email</label>
              <input
                id="email"
                type="email"
                required
                className={formStyles.input}
                placeholder="you@company.com"
                value={step1.email}
                onChange={(e) => setStep1({ ...step1, email: e.target.value })}
              />
            </div>

            <div className={styles.grid2}>
              <div className={formStyles.field}>
                <label className={formStyles.label} htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  className={formStyles.input}
                  placeholder="At least 8 characters"
                  value={step1.password}
                  onChange={(e) => setStep1({ ...step1, password: e.target.value })}
                />
              </div>
              <div className={formStyles.field}>
                <label className={formStyles.label} htmlFor="confirmPassword">Confirm password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  minLength={8}
                  className={formStyles.input}
                  placeholder="Repeat password"
                  value={step1.confirmPassword}
                  onChange={(e) => setStep1({ ...step1, confirmPassword: e.target.value })}
                />
              </div>
            </div>

            <button type="submit" className={formStyles.submit} disabled={loading}>
              {loading ? 'Creating account…' : 'Continue'}
            </button>
          </form>
        </div>
      )}

      {step === 2 && (
        <div className={styles.stepPane}>
          <h1 className={formStyles.title}>Tell us about you</h1>
          <p className={formStyles.subtitle}>A few details to finish setting up your workspace.</p>

          <form onSubmit={handleStep2Submit}>
            <div className={styles.grid2}>
              <div className={formStyles.field}>
                <label className={formStyles.label} htmlFor="firstName">First name</label>
                <input
                  id="firstName"
                  required
                  className={formStyles.input}
                  placeholder="Ada"
                  value={step2.firstName}
                  onChange={(e) => setStep2({ ...step2, firstName: e.target.value })}
                />
              </div>
              <div className={formStyles.field}>
                <label className={formStyles.label} htmlFor="lastName">Last name</label>
                <input
                  id="lastName"
                  required
                  className={formStyles.input}
                  placeholder="Lovelace"
                  value={step2.lastName}
                  onChange={(e) => setStep2({ ...step2, lastName: e.target.value })}
                />
              </div>
            </div>

            <div className={formStyles.field}>
              <label className={formStyles.label} htmlFor="phone">Phone</label>
              <input
                id="phone"
                className={formStyles.input}
                placeholder="+243 000 000 000"
                value={step2.phone}
                onChange={(e) => setStep2({ ...step2, phone: e.target.value })}
              />
            </div>

            <div className={styles.grid2}>
              <div className={formStyles.field}>
                <label className={formStyles.label} htmlFor="sector">Sector</label>
                <select
                  id="sector"
                  className={styles.select}
                  value={step2.sector}
                  onChange={(e) => setStep2({ ...step2, sector: e.target.value })}
                >
                  <option value="">Select…</option>
                  <option value="retail">Retail</option>
                  <option value="finance">Finance</option>
                  <option value="services">Services</option>
                  <option value="manufacturing">Manufacturing</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className={formStyles.field}>
                <label className={formStyles.label} htmlFor="companySize">Company size</label>
                <select
                  id="companySize"
                  className={styles.select}
                  value={step2.companySize}
                  onChange={(e) => setStep2({ ...step2, companySize: e.target.value })}
                >
                  <option value="">Select…</option>
                  <option value="1-10">1–10</option>
                  <option value="11-50">11–50</option>
                  <option value="51-200">51–200</option>
                  <option value="200+">200+</option>
                </select>
              </div>
            </div>

            <div className={styles.backRow}>
              <button type="button" className={styles.backButton} onClick={() => setStep(1)}>
                Back
              </button>
              <button type="submit" className={formStyles.submit} disabled={loading}>
                {loading ? 'Finishing up…' : 'Create workspace'}
              </button>
            </div>
          </form>
        </div>
      )}

      <p className={formStyles.footerText}>
        Already have a workspace? <Link href="/login" className={formStyles.link}>Sign in</Link>
      </p>
    </AuthLayout>
  );
}
