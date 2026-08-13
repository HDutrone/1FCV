'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { api, ApiError } from '@/lib/api';
import formStyles from '@/components/auth/Form.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await api.post<{ accessToken: string; refreshToken: string }>('/auth/login', {
        email,
        password,
      });
      localStorage.setItem('accessToken', result.accessToken);
      localStorage.setItem('refreshToken', result.refreshToken);
      router.push('/admin');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      panelTitle="Run your whole company from one dashboard"
      panelBody="Branches, HR, payroll, sales, stock and CRM — realtime, in one place."
      highlights={[
        'Live operations feed across every branch',
        'Role-based access down to the module level',
        'Full audit trail on every sensitive action',
      ]}
    >
      <h1 className={formStyles.title}>Welcome back</h1>
      <p className={formStyles.subtitle}>Sign in to your workspace to continue.</p>

      {error && <div className={formStyles.error}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className={formStyles.field}>
          <label className={formStyles.label} htmlFor="email">Work email</label>
          <input
            id="email"
            type="email"
            required
            className={formStyles.input}
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className={formStyles.field}>
          <label className={formStyles.label} htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            className={formStyles.input}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className={formStyles.row}>
          <label className={formStyles.checkboxRow}>
            <input type="checkbox" /> Remember me
          </label>
          <a href="#" className={formStyles.link}>Forgot password?</a>
        </div>

        <button type="submit" className={formStyles.submit} disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className={formStyles.footerText}>
        Don&apos;t have a workspace yet?{' '}
        <Link href="/register" className={formStyles.link}>Start free trial</Link>
      </p>
    </AuthLayout>
  );
}
