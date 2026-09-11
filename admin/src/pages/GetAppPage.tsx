import {useEffect} from 'react';
import {Link} from 'react-router-dom';
import {Download, ShieldCheck, Smartphone} from 'lucide-react';
import {Logo} from '../components/Logo';
import {ThemeToggle} from '../components/ThemeToggle';

const APK_URL =
  import.meta.env.VITE_ANDROID_APK_URL ||
  'https://github.com/Tawa58/360-CheckIn/releases/latest/download/CheckIn360.apk';

export function GetAppPage() {
  useEffect(() => {
    document.title = 'Get the employee app · CheckIn360';
  }, []);

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
        <div className="mx-auto flex w-full max-w-lg items-center justify-between gap-3">
          <Logo variant="light" className="h-10 w-auto sm:h-12" />
          <ThemeToggle className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/20" />
        </div>
      </header>

      <div className="relative mx-auto flex min-h-dvh w-full max-w-lg items-center justify-center py-28">
        <div className="w-full">
          <div className="rounded-3xl bg-white p-5 shadow-float dark:border dark:border-slate-800 dark:bg-slate-900 sm:p-7">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-800 dark:bg-brand-500/15 dark:text-brand-200">
              <Smartphone className="h-6 w-6" />
            </div>
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              CheckIn360 for Android
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Employees check in from the Android app. Admins keep using this website.
            </p>

            <a href={APK_URL} className="btn-primary mt-6 w-full">
              <Download className="h-4 w-4" />
              Download Android app
            </a>

            <ol className="mt-6 space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-800 dark:bg-brand-500/15 dark:text-brand-200">
                  1
                </span>
                Open this page on your Android phone and tap Download.
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-800 dark:bg-brand-500/15 dark:text-brand-200">
                  2
                </span>
                If asked, allow your browser to install unknown apps, then open the APK.
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-800 dark:bg-brand-500/15 dark:text-brand-200">
                  3
                </span>
                Sign in with your username, password, and access code.
              </li>
            </ol>

            <div className="mt-6 flex gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-800/80 dark:text-slate-300">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-700 dark:text-brand-300" />
              <p>
                Check-in stays locked until the phone can verify a live GPS position inside
                company premises.
              </p>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-white/50">
            Admin?{' '}
            <Link to="/login" className="text-white/80 underline-offset-2 hover:underline">
              Sign in to the dashboard
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
