export const DEPARTMENTS = [
  'Operations',
  'Engineering',
  'Field Services',
  'Administration',
] as const;

export type Department = (typeof DEPARTMENTS)[number];

export function isDepartment(value: string): value is Department {
  return (DEPARTMENTS as readonly string[]).includes(value);
}

export function requireDepartment(value: string): Department {
  const department = value.trim();
  if (!isDepartment(department)) {
    throw new Error('Select a department from the list.');
  }
  return department;
}

export function departmentOptions(current?: string): string[] {
  if (current && !isDepartment(current)) {
    return [current, ...DEPARTMENTS];
  }
  return [...DEPARTMENTS];
}
