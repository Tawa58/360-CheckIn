import type {Employee} from './types';

function haystack(employee: Employee): string {
  return [
    employee.fullName,
    employee.username,
    employee.email,
    employee.employeeId,
    employee.department,
    employee.accessCode,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export function employeeSearchTokens(query: string): string[] {
  return query.trim().toLowerCase().split(/\s+/).filter(Boolean);
}

export function matchesEmployeeQuery(employee: Employee, query: string): boolean {
  const tokens = employeeSearchTokens(query);
  if (tokens.length === 0) {
    return true;
  }
  const text = haystack(employee);
  return tokens.every(token => text.includes(token));
}

export function searchEmployees(
  employees: Employee[],
  query: string,
  limit?: number,
): Employee[] {
  const matches = employees
    .filter(employee => matchesEmployeeQuery(employee, query))
    .sort((a, b) => a.fullName.localeCompare(b.fullName));
  return typeof limit === 'number' ? matches.slice(0, limit) : matches;
}

export function exactEmployeeMatch(
  employees: Employee[],
  query: string,
): Employee | undefined {
  const value = query.trim().toLowerCase();
  if (!value) {
    return undefined;
  }
  return employees.find(employee => {
    return (
      employee.fullName.toLowerCase() === value ||
      employee.username.toLowerCase() === value ||
      employee.employeeId.toLowerCase() === value ||
      (employee.email ?? '').toLowerCase() === value ||
      (employee.accessCode ?? '').toLowerCase() === value
    );
  });
}
