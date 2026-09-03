import {useEffect, useMemo, useState} from 'react';
import {
  AlertCircle,
  FileDown,
  FileSpreadsheet,
  FileText,
  Loader2,
  Search,
  Users,
  X,
} from 'lucide-react';
import {listAttendance} from '../lib/attendance';
import {listEmployees} from '../lib/employees';
import {
  buildMonthlyReport,
  currentMonthValue,
  type MonthlyAttendanceReport,
} from '../lib/monthlyReport';
import {exportMonthlyExcel, exportMonthlyPdf} from '../lib/reportExport';
import type {AttendanceRecord, Employee} from '@shared/types';

function statusClass(status: string) {
  if (status === 'Present') {
    return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300';
  }
  if (status === 'Rejected') {
    return 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300';
  }
  return 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300';
}

export function ReportsPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [month, setMonth] = useState(currentMonthValue());
  const [scope, setScope] = useState<'everyone' | 'individual'>('everyone');
  const [nameQuery, setNameQuery] = useState('');
  const [employeeUid, setEmployeeUid] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [error, setError] = useState('');
  const [exportError, setExportError] = useState('');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<'pdf' | 'xlsx' | null>(null);

  useEffect(() => {
    document.title = 'Reports · CheckIn360';
    Promise.all([listEmployees(), listAttendance()])
      .then(([nextEmployees, nextRecords]) => {
        setEmployees(nextEmployees);
        setRecords(nextRecords);
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Unable to load report data.');
      })
      .finally(() => setLoading(false));
  }, []);

  const matches = useMemo(() => {
    const value = nameQuery.trim().toLowerCase();
    const pool = value
      ? employees.filter(employee => {
          return (
            employee.fullName.toLowerCase().includes(value) ||
            employee.employeeId.toLowerCase().includes(value) ||
            employee.department.toLowerCase().includes(value)
          );
        })
      : employees;
    return pool.slice(0, 8);
  }, [employees, nameQuery]);

  const selectedEmployee = employees.find(employee => employee.authUid === employeeUid);

  const report = useMemo<MonthlyAttendanceReport | null>(() => {
    if (loading || error) {
      return null;
    }
    if (scope === 'individual' && !employeeUid) {
      return null;
    }
    return buildMonthlyReport({
      month,
      employees,
      records,
      employeeUid: scope === 'individual' ? employeeUid : undefined,
    });
  }, [employeeUid, employees, error, loading, month, records, scope]);

  function selectEmployee(employee: Employee) {
    setEmployeeUid(employee.authUid);
    setNameQuery(employee.fullName);
    setSearchOpen(false);
  }

  function clearEmployee() {
    setEmployeeUid('');
    setNameQuery('');
    setSearchOpen(true);
  }

  function runExport(kind: 'pdf' | 'xlsx') {
    if (!report || report.rows.length === 0) {
      return;
    }
    setExportError('');
    setExporting(kind);
    try {
      if (kind === 'pdf') {
        exportMonthlyPdf(report);
      } else {
        exportMonthlyExcel(report);
      }
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Unable to generate the report.');
    } finally {
      setExporting(null);
    }
  }

  const individual = report?.scope === 'individual' ? report.rows[0] : undefined;

  return (
    <div className="mx-auto w-full max-w-6xl animate-slide-up">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          Reports
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 sm:text-base">
          Monthly attendance as PDF or Excel, for everyone or one employee.
        </p>
      </header>

      {error ? (
        <div
          role="alert"
          className="mt-5 flex gap-3 rounded-2xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-100 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/30">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      ) : null}

      <section className="card mt-6 p-4 sm:p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
          <FileDown className="h-4 w-4 text-slate-400 dark:text-slate-500" />
          Prepare report
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <label className="block">
            <span className="field-label">Month</span>
            <input
              type="month"
              className="field-input mt-1.5"
              value={month}
              max={currentMonthValue()}
              onChange={event => setMonth(event.target.value)}
            />
          </label>
          <label className="block">
            <span className="field-label">Scope</span>
            <select
              className="field-input mt-1.5"
              value={scope}
              onChange={event => {
                const next = event.target.value === 'individual' ? 'individual' : 'everyone';
                setScope(next);
                if (next === 'everyone') {
                  setSearchOpen(false);
                } else {
                  setSearchOpen(true);
                }
              }}>
              <option value="everyone">Everyone</option>
              <option value="individual">Individual</option>
            </select>
          </label>
          <div
            className="relative block"
            onBlur={event => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                setSearchOpen(false);
              }
            }}>
            <span className="field-label">Employee</span>
            <div className="relative mt-1.5">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                className="field-input pl-11 pr-11"
                placeholder="Search by name"
                value={nameQuery}
                disabled={scope !== 'individual'}
                autoComplete="off"
                aria-autocomplete="list"
                aria-expanded={scope === 'individual' && searchOpen}
                onFocus={() => {
                  if (scope === 'individual') {
                    setSearchOpen(true);
                  }
                }}
                onChange={event => {
                  setNameQuery(event.target.value);
                  setEmployeeUid('');
                  setSearchOpen(true);
                }}
                onKeyDown={event => {
                  if (event.key === 'Enter' && matches.length === 1) {
                    event.preventDefault();
                    selectEmployee(matches[0]);
                  }
                  if (event.key === 'Escape') {
                    setSearchOpen(false);
                  }
                }}
              />
              {scope === 'individual' && nameQuery ? (
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  aria-label="Clear employee"
                  onClick={clearEmployee}>
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
            {scope === 'individual' && searchOpen ? (
              <ul
                role="listbox"
                className="absolute z-20 mt-2 max-h-64 w-full overflow-auto rounded-2xl border border-slate-200 bg-white py-1 shadow-card dark:border-slate-700 dark:bg-slate-900">
                {matches.length === 0 ? (
                  <li className="px-4 py-3 text-sm text-slate-500">No employees match that name.</li>
                ) : (
                  matches.map(employee => (
                    <li key={employee.authUid}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={employee.authUid === employeeUid}
                        className="flex w-full flex-col items-start px-4 py-2.5 text-left hover:bg-brand-50 dark:hover:bg-slate-800"
                        onMouseDown={event => event.preventDefault()}
                        onClick={() => selectEmployee(employee)}>
                        <span className="text-sm font-medium text-slate-900 dark:text-white">
                          {employee.fullName}
                        </span>
                        <span className="text-xs text-slate-400">
                          {employee.employeeId} · {employee.department}
                        </span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            ) : null}
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          Counts weekdays only. Future days in the current month are left out, so they are not
          marked absent.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            className="btn-primary flex-1 sm:flex-none"
            disabled={!report || report.rows.length === 0 || exporting !== null}
            onClick={() => runExport('pdf')}>
            {exporting === 'pdf' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            Download PDF
          </button>
          <button
            type="button"
            className="btn-outline flex-1 sm:flex-none"
            disabled={!report || report.rows.length === 0 || exporting !== null}
            onClick={() => runExport('xlsx')}>
            {exporting === 'xlsx' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4" />
            )}
            Download Excel
          </button>
        </div>
        {exportError ? (
          <p className="mt-3 text-sm text-red-600 dark:text-red-300">{exportError}</p>
        ) : null}
      </section>

      {loading ? (
        <p className="mt-8 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Building the monthly preview…
        </p>
      ) : null}

      {!loading && scope === 'individual' && !selectedEmployee ? (
        <p className="mt-8 text-sm text-slate-500 dark:text-slate-400">
          Search an employee by name to preview and download their report.
        </p>
      ) : null}

      {report ? (
        <>
          <section className="mt-6 grid gap-3 sm:grid-cols-3">
            <article className="card p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">People</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">
                {report.rows.length}
              </p>
            </article>
            <article className="card p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Weekdays counted
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">
                {report.workingDates.length}
              </p>
            </article>
            <article className="card p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Average attendance
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">
                {report.rows.length
                  ? `${Math.round(
                      report.rows.reduce((sum, row) => sum + row.attendanceRate, 0) /
                        report.rows.length,
                    )}%`
                  : '—'}
              </p>
            </article>
          </section>

          <section className="card mt-6 overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800 sm:px-5">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                {report.monthLabel}
              </h2>
              <span className="text-sm text-slate-500 dark:text-slate-400">{report.subjectName}</span>
            </div>

            {report.rows.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                <Users className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                No employees match this report.
              </div>
            ) : (
              <>
                <div className="space-y-3 p-4 lg:hidden">
                  {report.rows.map(row => (
                    <article
                      key={row.authUid}
                      className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800">
                      <p className="font-semibold text-slate-900 dark:text-white">{row.fullName}</p>
                      <p className="mt-0.5 text-sm text-slate-500">
                        {row.employeeId} · {row.department}
                      </p>
                      <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="rounded-xl bg-slate-50 px-2 py-2 dark:bg-slate-800/80">
                          <dt className="text-slate-400">Present</dt>
                          <dd className="mt-1 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                            {row.presentDays}
                          </dd>
                        </div>
                        <div className="rounded-xl bg-slate-50 px-2 py-2 dark:bg-slate-800/80">
                          <dt className="text-slate-400">Absent</dt>
                          <dd className="mt-1 text-sm font-semibold text-rose-700 dark:text-rose-300">
                            {row.absentDays}
                          </dd>
                        </div>
                        <div className="rounded-xl bg-slate-50 px-2 py-2 dark:bg-slate-800/80">
                          <dt className="text-slate-400">Rate</dt>
                          <dd className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                            {row.attendanceRate}%
                          </dd>
                        </div>
                      </dl>
                    </article>
                  ))}
                </div>

                <div className="hidden overflow-x-auto lg:block">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/70 dark:text-slate-400">
                      <tr>
                        <th className="px-5 py-3 font-medium">Employee</th>
                        <th className="px-5 py-3 font-medium">Department</th>
                        <th className="px-5 py-3 font-medium">Working</th>
                        <th className="px-5 py-3 font-medium">Present</th>
                        <th className="px-5 py-3 font-medium">Absent</th>
                        <th className="px-5 py-3 font-medium">Rejected</th>
                        <th className="px-5 py-3 font-medium">Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {report.rows.map(row => (
                        <tr key={row.authUid}>
                          <td className="px-5 py-3">
                            <p className="font-medium text-slate-900 dark:text-white">{row.fullName}</p>
                            <p className="text-xs text-slate-400">{row.employeeId}</p>
                          </td>
                          <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                            {row.department}
                          </td>
                          <td className="px-5 py-3">{row.workingDays}</td>
                          <td className="px-5 py-3 text-emerald-700 dark:text-emerald-300">
                            {row.presentDays}
                          </td>
                          <td className="px-5 py-3 text-rose-700 dark:text-rose-300">
                            {row.absentDays}
                          </td>
                          <td className="px-5 py-3 text-amber-700 dark:text-amber-300">
                            {row.rejectedDays}
                          </td>
                          <td className="px-5 py-3 font-medium">{row.attendanceRate}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>

          {individual ? (
            <section className="card mt-6 overflow-hidden">
              <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800 sm:px-5">
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  Daily breakdown
                </h2>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {individual.days.map(day => (
                  <div
                    key={day.date}
                    className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {day.weekday} {day.date}
                      </p>
                    </div>
                    <span className={`badge ${statusClass(day.status)}`}>{day.status}</span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
