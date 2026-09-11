import {useEffect, useState, type FormEvent} from 'react';
import {AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, Lock, Mail, MapPin, Moon, Sun, UserRound} from 'lucide-react';
import {ThemeToggle} from '../components/ThemeToggle';
import {createAdminAccount, listAdmins} from '../lib/adminAuth';
import {loadGeofenceSite, saveGeofenceSite} from '../lib/geofenceSite';
import type {AdminProfile, GeofenceSite} from '@shared/types';
import {geofenceFromEnv} from '@shared/geofence';

export function SettingsPage() {
  const [admins, setAdmins] = useState<AdminProfile[]>([]);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [geofence, setGeofence] = useState<GeofenceSite>(geofenceFromEnv());
  const [geofenceSaving, setGeofenceSaving] = useState(false);
  const [geofenceNotice, setGeofenceNotice] = useState('');
  const [geofenceError, setGeofenceError] = useState('');

  async function refreshAdmins() {
    setAdmins(await listAdmins());
  }

  useEffect(() => {
    document.title = 'Settings · CheckIn360';
    Promise.all([refreshAdmins(), loadGeofenceSite()])
      .then(([, site]) => {
        setGeofence(site);
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Unable to load administrators.');
      })
      .finally(() => setLoading(false));
  }, []);

  async function onCreateAdmin(event: FormEvent) {
    event.preventDefault();
    setError('');
    setNotice('');
    setSaving(true);
    try {
      const profile = await createAdminAccount(email, password, displayName);
      setDisplayName('');
      setEmail('');
      setPassword('');
      setNotice(`${profile.displayName} can now sign in as an administrator.`);
      await refreshAdmins();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create that admin account.');
    } finally {
      setSaving(false);
    }
  }

  async function onSaveGeofence(event: FormEvent) {
    event.preventDefault();
    setGeofenceError('');
    setGeofenceNotice('');
    setGeofenceSaving(true);
    try {
      const saved = await saveGeofenceSite(geofence);
      setGeofence(saved);
      setGeofenceNotice(`Saved ${saved.name} · ${saved.radiusMeters} m radius.`);
    } catch (err) {
      setGeofenceError(err instanceof Error ? err.message : 'Unable to save the geofence.');
    } finally {
      setGeofenceSaving(false);
    }
  }

  function useBrowserLocation() {
    if (!('geolocation' in navigator)) {
      setGeofenceError('This browser cannot read GPS.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      position => {
        setGeofence(current => ({
          ...current,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }));
        setGeofenceError('');
      },
      () => {
        setGeofenceError('Unable to read this device’s location.');
      },
      {enableHighAccuracy: true, timeout: 20000, maximumAge: 0},
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl animate-slide-up">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          Settings
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Workspace preferences and administrator accounts.
        </p>
      </header>

      <section className="card p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Appearance</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Light and dark mode apply to every page and drawer.
            </p>
          </div>
          <ThemeToggle />
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-800 dark:border-slate-700 dark:bg-transparent dark:text-slate-500">
            <Sun className="mb-2 h-4 w-4" />
            Light
          </div>
          <div className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-400 dark:border-brand-400/40 dark:bg-brand-500/15 dark:text-brand-200">
            <Moon className="mb-2 h-4 w-4" />
            Dark
          </div>
        </div>
      </section>

      <section className="card mt-5 p-5 sm:p-6">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Company geofence</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Employees see this boundary on the check-in map. Green means inside, red means outside.
        </p>
        <form onSubmit={onSaveGeofence} className="mt-5 space-y-4">
          <label className="block">
            <span className="field-label">Site name</span>
            <input
              className="field-input mt-1.5"
              value={geofence.name}
              onChange={event => setGeofence(current => ({...current, name: event.target.value}))}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="field-label">Latitude</span>
              <input
                className="field-input mt-1.5"
                inputMode="decimal"
                value={geofence.latitude}
                onChange={event =>
                  setGeofence(current => ({...current, latitude: Number(event.target.value)}))
                }
              />
            </label>
            <label className="block">
              <span className="field-label">Longitude</span>
              <input
                className="field-input mt-1.5"
                inputMode="decimal"
                value={geofence.longitude}
                onChange={event =>
                  setGeofence(current => ({...current, longitude: Number(event.target.value)}))
                }
              />
            </label>
          </div>
          <label className="block">
            <span className="field-label">Radius (metres)</span>
            <input
              className="field-input mt-1.5"
              inputMode="numeric"
              min={10}
              value={geofence.radiusMeters}
              onChange={event =>
                setGeofence(current => ({...current, radiusMeters: Number(event.target.value)}))
              }
            />
          </label>
          {geofenceNotice ? (
            <div className="flex gap-3 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800 ring-1 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-200 dark:ring-emerald-500/30">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
              <p>{geofenceNotice}</p>
            </div>
          ) : null}
          {geofenceError ? (
            <div
              role="alert"
              className="flex gap-3 rounded-2xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-100 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/30">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <p>{geofenceError}</p>
            </div>
          ) : null}
          <div className="flex flex-col gap-2 sm:flex-row">
            <button type="submit" disabled={geofenceSaving} className="btn-primary">
              {geofenceSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
              {geofenceSaving ? 'Saving…' : 'Save geofence'}
            </button>
            <button type="button" className="btn-outline" onClick={useBrowserLocation}>
              Use my current location
            </button>
          </div>
        </form>
      </section>

      <section className="card mt-5 p-5 sm:p-6">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Administrators</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Create another admin from here. They will sign in on the login page with their own email.
        </p>

        {loading ? (
          <p className="mt-4 flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading administrators…
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
            {admins.map(admin => (
              <li key={admin.uid} className="flex flex-col py-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="font-medium text-slate-900 dark:text-white">{admin.displayName}</span>
                <span className="text-sm text-slate-500">{admin.email}</span>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={onCreateAdmin} className="mt-5 space-y-4 border-t border-slate-100 pt-5 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Create admin</h3>
          <label className="block">
            <span className="field-label">Display name</span>
            <div className="relative mt-1.5">
              <UserRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                className="field-input pl-11"
                placeholder="msekiwa"
                autoComplete="name"
                value={displayName}
                onChange={event => setDisplayName(event.target.value)}
              />
            </div>
          </label>
          <label className="block">
            <span className="field-label">Email</span>
            <div className="relative mt-1.5">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                inputMode="email"
                autoComplete="off"
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
                autoComplete="new-password"
                placeholder="At least 6 characters"
                className="field-input px-11"
                value={password}
                onChange={event => setPassword(event.target.value)}
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword(value => !value)}
                className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200">
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </label>

          {notice ? (
            <div className="flex gap-3 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800 ring-1 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-200 dark:ring-emerald-500/30">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
              <p>{notice}</p>
            </div>
          ) : null}

          {error ? (
            <div
              role="alert"
              className="flex gap-3 rounded-2xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-100 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/30">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <p>{error}</p>
            </div>
          ) : null}

          <button type="submit" disabled={saving} className="btn-primary w-full sm:w-auto">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating…
              </>
            ) : (
              'Create admin account'
            )}
          </button>
        </form>
      </section>
    </div>
  );
}
