import {useMemo, useState} from 'react';
import {Search, X} from 'lucide-react';
import type {Employee} from '@shared/types';
import {exactEmployeeMatch, searchEmployees} from '@shared/employeeSearch';
import {Avatar} from './Avatar';

export function EmployeeSearch({
  employees,
  query,
  selectedUid,
  disabled = false,
  placeholder = 'Search name, username, ID, or department',
  label = 'Employee',
  onQueryChange,
  onSelect,
  onClear,
}: {
  employees: Employee[];
  query: string;
  selectedUid: string;
  disabled?: boolean;
  placeholder?: string;
  label?: string;
  onQueryChange: (value: string) => void;
  onSelect: (employee: Employee) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const matches = useMemo(
    () => searchEmployees(employees, query, 20),
    [employees, query],
  );

  function choose(employee: Employee) {
    onSelect(employee);
    setOpen(false);
  }

  return (
    <div
      className="relative block"
      onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setOpen(false);
        }
      }}>
      <span className="field-label">{label}</span>
      <div className="relative mt-1.5">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          className="field-input pl-11 pr-11"
          placeholder={placeholder}
          value={query}
          disabled={disabled}
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={!disabled && open}
          onFocus={() => {
            if (!disabled) {
              setOpen(true);
            }
          }}
          onChange={event => {
            onQueryChange(event.target.value);
            setOpen(true);
          }}
          onKeyDown={event => {
            if (event.key === 'Escape') {
              setOpen(false);
              return;
            }
            if (event.key !== 'Enter' || disabled) {
              return;
            }
            event.preventDefault();
            const exact = exactEmployeeMatch(employees, query);
            if (exact) {
              choose(exact);
              return;
            }
            if (matches.length === 1) {
              choose(matches[0]);
            }
          }}
        />
        {query ? (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label="Clear employee"
            onClick={() => {
              onClear();
              setOpen(true);
            }}>
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
      {!disabled && open ? (
        <ul
          role="listbox"
          className="absolute z-20 mt-2 max-h-72 w-full overflow-auto rounded-2xl border border-slate-200 bg-white py-1 shadow-card dark:border-slate-700 dark:bg-slate-900">
          {matches.length === 0 ? (
            <li className="px-4 py-3 text-sm text-slate-500">
              No employees match that search.
            </li>
          ) : (
            matches.map(employee => (
              <li key={employee.authUid}>
                <button
                  type="button"
                  role="option"
                  aria-selected={employee.authUid === selectedUid}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-brand-50 dark:hover:bg-slate-800"
                  onMouseDown={event => event.preventDefault()}
                  onClick={() => choose(employee)}>
                  <Avatar name={employee.fullName} photoUrl={employee.photoUrl} size="sm" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-slate-900 dark:text-white">
                      {employee.fullName}
                    </span>
                    <span className="block truncate text-xs text-slate-400">
                      {employee.employeeId} · {employee.department}
                      {employee.username ? ` · @${employee.username}` : ''}
                    </span>
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
