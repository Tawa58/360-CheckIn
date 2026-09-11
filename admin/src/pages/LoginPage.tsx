import {useEffect, useState, type FormEvent} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {AlertCircle, Eye, EyeOff, Loader2, Lock, Mail, Smartphone} from 'lucide-react';
import {firebaseReady} from '../lib/firebase';
import {loginAdmin} from '../lib/adminAuth';
import {Logo} from '../components/Logo';
import {ThemeToggle} from '../components/ThemeToggle';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = 'Admin login · CheckIn360';
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginAdmin(email, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-dvh overflow-hidden bg-brand-900 px-5 dark:bg-slate-950">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 -top-28 h-72 w-72 rounded-full bg-brand-500/25 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -right-20 h-80 w-80 rounded-full bg-accent-500/20 blur-3xl"
      />

      <header className="absolute inset-x-0 top-0 z-10 px-5 pt-7 sm:pt-9">
        <div className="mx-auto flex w-full max-w-md items-center justify-between gap-3">
          <Logo variant="light" className="h-10 w-auto sm:h-12" />
          <ThemeToggle className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/20" />
        </div>
      </header>

      <div className="relative mx-auto flex min-h-dvh w-full max-w-md items-center justify-center py-28">
        <div className="w-full">
          <h1 className="sr-only">CheckIn360 admin dashboard</h1>
          <div className="rounded-3xl bg-white p-5 shadow-float dark:border dark:border-slate-800 dark:bg-slate-900 sm:p-7">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Sign in to register employees, renew access codes, and review attendance.
            </p>

            {!firebaseReady ? (
              <div className="mt-4 flex gap-3 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-500/30">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <p>
                  Add your Firebase web credentials in{' '}
                  <code className="font-mono text-xs">.env</code> before using the dashboard.
                </p>
              </div>
            ) : null}

            <form onSubmit={onSubmit} className="mt-5 space-y-4">
              <label className="block">
                <span className="field-label">Email</span>
                <div className="relative mt-1.5">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    inputMode="email"
                    autoComplete="email"
                    placeholder="admin@company.com"
                    className="field-input pl-11"
                    value={email}
                    onChange={event => setEmail(event.target.value)}
                  />
                </div>
              </label>

              <label className="block">
                <span className="field-label">Password</span>
                <div className="relative mt-1.5">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    autoComplete="current-password"
                    placeholder="At least 6 characters"
                    className="field-input px-11"
                    value={password}
                    onChange={event => setPassword(event.target.value)}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword(value => !value)}
                    className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </label>

              {error ? (
                <div
                  role="alert"
                  className="flex gap-3 rounded-2xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-100 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/30">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                  <p>{error}</p>
                </div>
              ) : null}

              <button type="submit" disabled={!firebaseReady || loading} className="btn-primary w-full">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Please wait…
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-white/50">
            Employees use the Android app, not this dashboard.{' '}
            <Link
              to="/get-app"
              className="inline-flex items-center gap-1 text-white/80 underline-offset-2 hover:underline">
              <Smartphone className="h-3.5 w-3.5" />
              Download CheckIn360
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
