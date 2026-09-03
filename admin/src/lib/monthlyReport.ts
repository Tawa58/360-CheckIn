import type {AttendanceRecord, Employee} from '@shared/types';
import {localISODate} from '@shared/dates';

export type DayStatus = 'Present' | 'Absent' | 'Rejected';

export interface EmployeeDay {
  date: string;
  weekday: string;
  status: DayStatus;
}

export interface EmployeeMonthRow {
  employeeId: string;
  authUid: string;
  fullName: string;
  department: string;
  workingDays: number;
  presentDays: number;
  absentDays: number;
  rejectedDays: number;
  attendanceRate: number;
  days: EmployeeDay[];
}

export interface MonthlyAttendanceReport {
  month: string;
  monthLabel: string;
  generatedAt: string;
  scope: 'everyone' | 'individual';
  subjectName: string;
  workingDates: string[];
  rows: EmployeeMonthRow[];
}

export function currentMonthValue(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function formatMonthLabel(month: string): string {
  const [year, monthNumber] = month.split('-').map(Number);
  return new Date(year, monthNumber - 1, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
}

export function weekdayDatesInMonth(month: string, through = new Date()): string[] {
  const [year, monthNumber] = month.split('-').map(Number);
  const lastDay = new Date(year, monthNumber, 0).getDate();
  const throughIso = localISODate(through);
  const dates: string[] = [];

  for (let day = 1; day <= lastDay; day += 1) {
    const date = new Date(year, monthNumber - 1, day);
    const iso = localISODate(date);
    if (iso > throughIso) {
      break;
    }
    const weekday = date.getDay();
    if (weekday === 0 || weekday === 6) {
      continue;
    }
    dates.push(iso);
  }

  return dates;
}

function weekdayName(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    weekday: 'short',
  });
}

function startDateFor(employee: Employee): string {
  return localISODate(new Date(employee.createdAt));
}

function presentMap(records: AttendanceRecord[]): Map<string, LocationStatusOrPresent> {
  const map = new Map<string, LocationStatusOrPresent>();
  for (const record of records) {
    const key = `${record.employeeUid}:${record.checkInDate}`;
    const previous = map.get(key);
    if (previous === 'Verified') {
      continue;
    }
    map.set(key, record.locationStatus);
  }
  return map;
}

type LocationStatusOrPresent = 'Verified' | 'Rejected';

function buildRow(
  employee: Employee,
  workingDates: string[],
  attendance: Map<string, LocationStatusOrPresent>,
): EmployeeMonthRow {
  const start = startDateFor(employee);
  const dates = workingDates.filter(date => date >= start);
  const days = dates.map(date => {
    const status = attendance.get(`${employee.authUid}:${date}`);
    return {
      date,
      weekday: weekdayName(date),
      status: status === 'Rejected' ? 'Rejected' : status ? 'Present' : 'Absent',
    } satisfies EmployeeDay;
  });

  const presentDays = days.filter(day => day.status !== 'Absent').length;
  const rejectedDays = days.filter(day => day.status === 'Rejected').length;
  const absentDays = days.filter(day => day.status === 'Absent').length;

  return {
    employeeId: employee.employeeId,
    authUid: employee.authUid,
    fullName: employee.fullName,
    department: employee.department,
    workingDays: days.length,
    presentDays,
    absentDays,
    rejectedDays,
    attendanceRate: days.length === 0 ? 0 : Math.round((presentDays / days.length) * 100),
    days,
  };
}

export function buildMonthlyReport(input: {
  month: string;
  employees: Employee[];
  records: AttendanceRecord[];
  employeeUid?: string;
}): MonthlyAttendanceReport {
  const workingDates = weekdayDatesInMonth(input.month);
  const attendance = presentMap(
    input.records.filter(record => record.checkInDate.startsWith(input.month)),
  );
  const selected = input.employeeUid
    ? input.employees.filter(employee => employee.authUid === input.employeeUid)
    : input.employees;
  const rows = selected
    .map(employee => buildRow(employee, workingDates, attendance))
    .sort((a, b) => a.fullName.localeCompare(b.fullName));

  return {
    month: input.month,
    monthLabel: formatMonthLabel(input.month),
    generatedAt: new Date().toISOString(),
    scope: input.employeeUid ? 'individual' : 'everyone',
    subjectName: input.employeeUid
      ? (rows[0]?.fullName ?? 'Employee')
      : 'All employees',
    workingDates,
    rows,
  };
}

export function reportFilename(report: MonthlyAttendanceReport, extension: 'pdf' | 'xlsx'): string {
  const month = report.monthLabel.replace(/\s+/g, '-');
  const subject =
    report.scope === 'individual'
      ? report.subjectName.replace(/[^\w]+/g, '-')
      : 'All-employees';
  return `CheckIn360-Attendance-${subject}-${month}.${extension}`;
}
