import {useEffect, useMemo, useState, type FormEvent} from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Users,
} from 'lucide-react';
import {
  listEmployees,
  registerEmployee,
  renewAccessCode,
  updateEmployeeDetails,
} from '../lib/employees';
import type {Employee} from '@shared/types';
import {daysUntil, formatExpiry, isExpired} from '@shared/dates';
import {Modal} from '../components/Modal';
import {Avatar} from '../components/Avatar';

export function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [showRegister, setShowRegister] = useState(false);
  const [issued, setIssued] = useState<Employee | null>(null);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [renewing, setRenewing] = useState<string | null>(null);

  async function refresh() {
    const rows = await listEmployees();
    setEmployees(rows);
  }

  useEffect(() => {
    document.title = 'Employees · CheckIn360';
    refresh()
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Unable to load employees.');
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) {
      return employees;
    }
    return employees.filter(employee =>
      [employee.fullName, employee.department, employee.username, employee.accessCode]
        .join(' ')
        .toLowerCase()
        .includes(value),
    );
  }, [employees, query]);

  async function onRenew(employee: Employee) {
    if (
      !confirm(
        `Renew access code for ${employee.fullName}? The current code will become invalid.`,
      )
    ) {
      return;
    }
    setRenewing(employee.authUid);
    setError('');
    try {
      const updated = await renewAccessCode(employee);
      setIssued(updated);
      setNotice('Access code renewed. The previous code is now invalid.');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to renew code.');
    } finally {
      setRenewing(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Employees
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 sm:text-base">
            Register staff, manage details, and renew access codes.
          </p>
        </div>
        <button
          type="button"
          className="btn-primary w-full sm:w-auto"
          onClick={() => setShowRegister(true)}>
          <Plus className="h-4 w-4" />
          Register employee
        </button>
      </header>

      <div className="relative mt-5 sm:max-w-md">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          className="field-input pl-11"
          placeholder="Search name, department, username, code"
          value={query}
          onChange={event => setQuery(event.target.value)}
        />
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

      {loading ? (
        <div className="mt-6 space-y-3">
          {Array.from({length: 3}).map((_, index) => (
            <div
              key={index}
              className="card h-28 animate-pulse bg-white/70 dark:bg-slate-900/70"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card mt-6 px-6 py-14 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
            <Users className="h-6 w-6" />
          </div>
          <p className="mt-3 font-semibold text-slate-900 dark:text-white">
            No employees found
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {query
              ? 'Try a different search term.'
              : 'Register your first employee to get started.'}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="mt-6 space-y-3 lg:hidden">
            {filtered.map(employee => (
              <article key={employee.authUid} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <Avatar name={employee.fullName} photoUrl={employee.photoUrl} />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900 dark:text-white">
                        {employee.fullName}
                      </p>
                      <p className="mt-0.5 truncate text-sm text-slate-500 dark:text-slate-400">
                        {employee.employeeId} · {employee.department}
                      </p>
                      <p className="mt-0.5 truncate text-sm text-slate-500 dark:text-slate-400">
                        @{employee.username}
                      </p>
                    </div>
                  </div>
                  <ExpiryBadge codeExpiry={employee.codeExpiry} />
                </div>

                <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3.5 py-2.5 dark:bg-slate-800/60">
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                      Access code
                    </p>
                    <p className="truncate font-mono text-base font-semibold tracking-wider text-brand-800 dark:text-brand-300">
                      {employee.accessCode}
                    </p>
                  </div>
                  <CopyButton value={employee.accessCode} />
                </div>

                <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                  Expires {formatExpiry(employee.codeExpiry)}
                </p>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className="btn-outline"
                    onClick={() => setEditing(employee)}>
                    <Pencil className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={renewing === employee.authUid}
                    className="btn bg-accent-50 text-accent-600 hover:bg-accent-100 dark:bg-accent-500/15 dark:text-accent-200 dark:hover:bg-accent-500/25"
                    onClick={() => onRenew(employee)}>
                    {renewing === employee.authUid ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    Renew
                  </button>
                </div>
              </article>
            ))}
          </div>

          {/* Desktop table */}
          <div className="card mt-6 hidden overflow-hidden lg:block">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Employee</th>
                  <th className="px-5 py-3.5 font-semibold">Username</th>
                  <th className="px-5 py-3.5 font-semibold">Access code</th>
                  <th className="px-5 py-3.5 font-semibold">Expiry</th>
                  <th className="px-5 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map(employee => (
                  <tr
                    key={employee.authUid}
                    className="transition hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={employee.fullName} photoUrl={employee.photoUrl} />
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {employee.fullName}
                          </p>
                          <p className="text-slate-500 dark:text-slate-400">
                            {employee.employeeId} · {employee.department}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                      @{employee.username}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold tracking-wider text-brand-800 dark:text-brand-300">
                          {employee.accessCode}
                        </span>
                        <CopyButton value={employee.accessCode} />
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <ExpiryBadge codeExpiry={employee.codeExpiry} />
                      <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                        {formatExpiry(employee.codeExpiry)}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-slate-800"
                          onClick={() => setEditing(employee)}>
                          <Pencil className="h-4 w-4" />
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={renewing === employee.authUid}
                          className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-accent-600 transition hover:bg-accent-50 disabled:opacity-50 dark:text-accent-200 dark:hover:bg-accent-500/15"
                          onClick={() => onRenew(employee)}>
                          {renewing === employee.authUid ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                          Renew
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showRegister ? (
        <RegisterModal
          onClose={() => setShowRegister(false)}
          onCreated={async employee => {
            setShowRegister(false);
            setIssued(employee);
            await refresh();
          }}
        />
      ) : null}

      {editing ? (
        <EditModal
          employee={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            setNotice('Employee details updated.');
            await refresh();
          }}
        />
      ) : null}

      {issued ? (
        <IssuedCodeModal employee={issued} onClose={() => setIssued(null)} />
      ) : null}
    </div>
  );
}

function ExpiryBadge({codeExpiry}: {codeExpiry: string}) {
  const expired = isExpired(codeExpiry);
  return (
    <span
      className={`badge shrink-0 ${
        expired
          ? 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300'
          : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
      }`}>
      {expired ? 'Expired' : `${daysUntil(codeExpiry)}d left`}
    </span>
  );
}

function CopyButton({value}: {value: string}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return;
    }
    const timer = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timer);
  }, [copied]);

  return (
    <button
      type="button"
      aria-label={copied ? 'Copied' : 'Copy access code'}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
        } catch {
          // Clipboard permission denied; leave the code visible for manual copy.
        }
      }}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-brand-300">
      {copied ? (
        <Check className="h-4 w-4 text-emerald-600" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </button>
  );
}

function RegisterModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (employee: Employee) => Promise<void>;
}) {
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const employee = await registerEmployee({
        fullName,
        department,
        username,
        password,
      });
      await onCreated(employee);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to register employee.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      title="Register employee"
      description="They will receive an access code valid for 4 months."
      onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4">
        <Field
          label="Full name"
          value={fullName}
          onChange={setFullName}
          placeholder="Jane Doe"
        />
        <Field
          label="Department"
          value={department}
          onChange={setDepartment}
          placeholder="Operations"
        />
        <Field
          label="Username"
          value={username}
          onChange={setUsername}
          placeholder="jane.doe"
          hint="3–32 characters: letters, numbers, dots, or underscores."
        />
        <Field
          label="Password"
          value={password}
          onChange={setPassword}
          type="password"
          placeholder="At least 6 characters"
        />
        {error ? (
          <div
            role="alert"
            className="flex gap-3 rounded-2xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-100 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/30">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <p>{error}</p>
          </div>
        ) : null}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating…
            </>
          ) : (
            'Create employee'
          )}
        </button>
      </form>
    </Modal>
  );
}

function EditModal({
  employee,
  onClose,
  onSaved,
}: {
  employee: Employee;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [fullName, setFullName] = useState(employee.fullName);
  const [department, setDepartment] = useState(employee.department);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await updateEmployeeDetails(employee, {fullName, department});
      await onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save changes.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      title="Edit employee"
      description={`@${employee.username} · ${employee.employeeId}`}
      onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Full name" value={fullName} onChange={setFullName} />
        <Field label="Department" value={department} onChange={setDepartment} />
        {error ? (
          <div
            role="alert"
            className="flex gap-3 rounded-2xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-100 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/30">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <p>{error}</p>
          </div>
        ) : null}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            'Save details'
          )}
        </button>
      </form>
    </Modal>
  );
}

function IssuedCodeModal({
  employee,
  onClose,
}: {
  employee: Employee;
  onClose: () => void;
}) {
  return (
    <Modal title="Employee access code" onClose={onClose}>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Share this code with {employee.fullName}. It is valid for 4 months and is not
        regenerated during daily check-in.
      </p>
      <div className="mt-4 rounded-3xl bg-brand-50 px-4 py-6 text-center ring-1 ring-brand-100 dark:bg-brand-500/10 dark:ring-brand-500/25">
        <p className="font-mono text-3xl font-bold tracking-[0.18em] text-brand-800 dark:text-brand-200 sm:text-4xl">
          {employee.accessCode}
        </p>
        <p className="mt-2 text-sm text-brand-700/70 dark:text-brand-300/80">
          Expires {formatExpiry(employee.codeExpiry)}
        </p>
      </div>
      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <CopyCodeButton value={employee.accessCode} />
        <button type="button" className="btn-primary w-full" onClick={onClose}>
          Done
        </button>
      </div>
    </Modal>
  );
}

function CopyCodeButton({value}: {value: string}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return;
    }
    const timer = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timer);
  }, [copied]);

  return (
    <button
      type="button"
      className="btn-outline w-full"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
        } catch {
          // Clipboard permission denied; the code stays visible for manual copy.
        }
      }}>
      {copied ? (
        <>
          <Check className="h-4 w-4 text-emerald-600" />
          Copied
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          Copy code
        </>
      )}
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      <input
        type={type}
        required
        placeholder={placeholder}
        className="field-input mt-1.5"
        value={value}
        onChange={event => onChange(event.target.value)}
      />
      {hint ? (
        <span className="mt-1.5 block text-xs text-slate-400 dark:text-slate-500">
          {hint}
        </span>
      ) : null}
    </label>
  );
}
