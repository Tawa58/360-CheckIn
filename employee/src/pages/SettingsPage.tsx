import {useEffect, useRef, useState} from 'react';
import {AlertCircle, CheckCircle2, ImagePlus, Loader2, Trash2} from 'lucide-react';
import {useAuth} from '../context/AuthContext';
import {Avatar} from '../components/Avatar';
import {clearProfilePhoto, compressProfileImage, saveProfilePhoto} from '../lib/profile';

export function SettingsPage() {
  const {employee, refreshEmployee} = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    document.title = 'Settings · CheckIn360';
  }, []);

  if (!employee) {
    return null;
  }

  const profile = employee;

  async function onFile(file: File | undefined) {
    if (!file) {
      return;
    }
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const photoUrl = await compressProfileImage(file);
      await saveProfilePhoto(profile.authUid, photoUrl);
      await refreshEmployee();
      setNotice('Profile photo updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save that photo.');
    } finally {
      setSaving(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  }

  async function onRemove() {
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await clearProfilePhoto(profile.authUid);
      await refreshEmployee();
      setNotice('Profile photo removed.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to remove the photo.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="animate-slide-up">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
        Settings
      </h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Add a photo for your profile. Theme is in the header.
      </p>

      <section className="card mt-6 p-5">
        <p className="text-base font-semibold text-slate-900 dark:text-white">Profile photo</p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          This image appears on your profile and in the admin employee list.
        </p>

        <div className="mt-5 flex items-center gap-4">
          <Avatar name={employee.fullName} photoUrl={employee.photoUrl} size="lg" />
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-900 dark:text-white">
              {employee.fullName}
            </p>
            <p className="truncate text-sm text-slate-500">{employee.department}</p>
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={event => onFile(event.target.files?.[0])}
        />

        <div className="mt-5 grid gap-2">
          <button
            type="button"
            disabled={saving}
            className="btn-primary w-full"
            onClick={() => inputRef.current?.click()}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
            {employee.photoUrl ? 'Replace photo' : 'Upload photo'}
          </button>
          {employee.photoUrl ? (
            <button
              type="button"
              disabled={saving}
              className="btn-outline w-full"
              onClick={onRemove}>
              <Trash2 className="h-4 w-4" />
              Remove photo
            </button>
          ) : null}
        </div>

        {error ? (
          <div
            role="alert"
            className="mt-4 flex gap-3 rounded-2xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-100 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/30">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <p>{error}</p>
          </div>
        ) : null}

        {notice ? (
          <div className="mt-4 flex gap-3 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800 ring-1 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <p>{notice}</p>
          </div>
        ) : null}
      </section>
    </div>
  );
}
