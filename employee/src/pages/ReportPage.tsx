import {useEffect, useState, type FormEvent} from 'react';
import {AlertCircle, CheckCircle2, Loader2, MessageSquarePlus} from 'lucide-react';
import {useAuth} from '../context/AuthContext';
import {
  ABSENCE_CATEGORIES,
  ISSUE_CATEGORIES,
  listMyMessages,
  submitEmployeeMessage,
} from '../lib/messages';
import type {EmployeeMessage, EmployeeMessageKind} from '@shared/types';
import {formatDisplayDate, formatDisplayDateTime, localISODate} from '@shared/dates';

const tabs: {id: EmployeeMessageKind; label: string; hint: string}[] = [
  {
    id: 'absence',
    label: 'Absence notice',
    hint: 'Tell admin why you will not be in, or why you missed a day.',
  },
  {
    id: 'issue',
    label: 'System issue',
    hint: 'Report an app error, failed check-in, GPS problem, or access-code issue.',
  },
];

export function ReportPage() {
  const {employee} = useAuth();
  const [kind, setKind] = useState<EmployeeMessageKind>('absence');
  const [category, setCategory] = useState<string>(ABSENCE_CATEGORIES[0]);
  const [absenceDate, setAbsenceDate] = useState(localISODate());
  const [details, setDetails] = useState('');
  const [messages, setMessages] = useState<EmployeeMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    document.title = 'Send a report · CheckIn360';
  }, []);

  useEffect(() => {
    if (!employee) {
      return;
    }
    listMyMessages(employee.authUid)
      .then(setMessages)
      .catch(() => setError('Unable to load your recent reports.'))
      .finally(() => setLoading(false));
  }, [employee]);

  function switchKind(next: EmployeeMessageKind) {
    setKind(next);
    setCategory(next === 'absence' ? ABSENCE_CATEGORIES[0] : ISSUE_CATEGORIES[0]);
    setError('');
    setNotice('');
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!employee) {
      return;
    }
    setSubmitting(true);
    setError('');
    setNotice('');
    try {
      const message = await submitEmployeeMessage({
        employee,
        kind,
        category,
        details,
        absenceDate: kind === 'absence' ? absenceDate : undefined,
      });
      setMessages(current => [message, ...current]);
      setDetails('');
      setNotice(
        kind === 'absence'
          ? 'Absence notice sent. Admin can see it in the inbox.'
          : 'Issue report sent. Admin can see it in the inbox.',
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send this report.');
    } finally {
      setSubmitting(false);
    }
  }

  const categories = kind === 'absence' ? ABSENCE_CATEGORIES : ISSUE_CATEGORIES;
  const activeTab = tabs.find(tab => tab.id === kind);

  return (
    <div className="animate-slide-up">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
        Send a report
      </h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Absence notices and system issues go to the admin inbox.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => switchKind(tab.id)}
            className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
              kind === tab.id
                ? 'bg-white text-brand-800 shadow-sm dark:bg-slate-900 dark:text-brand-200'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>
      <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{activeTab?.hint}</p>

      <form onSubmit={onSubmit} className="card mt-4 space-y-4 p-5">
        {kind === 'absence' ? (
          <label className="block">
            <span className="field-label">Date away</span>
            <input
              type="date"
              required
              className="field-input mt-1.5"
              value={absenceDate}
              onChange={event => setAbsenceDate(event.target.value)}
            />
          </label>
        ) : null}

        <fieldset>
          <legend className="field-label">
            {kind === 'absence' ? 'Reason' : 'What went wrong'}
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {categories.map(item => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  category === item
                    ? 'bg-brand-800 text-white dark:bg-brand-600'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}>
                {item}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="block">
          <span className="field-label">Details</span>
          <textarea
            required
            minLength={8}
            rows={4}
            className="field-input mt-1.5 resize-none"
            placeholder={
              kind === 'absence'
                ? 'Add anything admin should know about this absence.'
                : 'Describe the error, when it happened, and what you were trying to do.'
            }
            value={details}
            onChange={event => setDetails(event.target.value)}
          />
        </label>

        {error ? (
          <div
            role="alert"
            className="flex gap-3 rounded-2xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-100 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/30">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <p>{error}</p>
          </div>
        ) : null}

        {notice ? (
          <div className="flex gap-3 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800 ring-1 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <p>{notice}</p>
          </div>
        ) : null}

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending…
            </>
          ) : (
            <>
              <MessageSquarePlus className="h-4 w-4" />
              {kind === 'absence' ? 'Send absence notice' : 'Send issue report'}
            </>
          )}
        </button>
      </form>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Your reports</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Status updates after admin reviews them.
        </p>

        {loading ? (
          <p className="mt-4 flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading reports…
          </p>
        ) : messages.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            You have not sent a report yet.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {messages.map(message => (
              <li key={message.messageId} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {message.kind === 'absence' ? 'Absence' : 'System issue'} · {message.category}
                    </p>
                    {message.absenceDate ? (
                      <p className="mt-0.5 text-xs text-slate-400">
                        Away {formatDisplayDate(message.absenceDate)}
                      </p>
                    ) : null}
                  </div>
                  <StatusBadge status={message.status} />
                </div>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{message.details}</p>
                <p className="mt-2 text-xs text-slate-400">
                  Sent {formatDisplayDateTime(message.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatusBadge({status}: {status: EmployeeMessage['status']}) {
  const styles = {
    open: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
    seen: 'bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
    resolved: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  };
  const labels = {open: 'Open', seen: 'Seen', resolved: 'Resolved'};
  return <span className={`badge shrink-0 ${styles[status]}`}>{labels[status]}</span>;
}
