import type {AttendanceRecord, Employee} from '@shared/types';
import {localISODate} from '@shared/dates';

export type DayStatus = 'Present' | 'Absent' | 'Rejected';

export interface PersonalDay {
  date: string;
  weekday: string;
  status: DayStatus;
}

export interface PersonalMonthReport {
  month: string;
  monthLabel: string;
  workingDays: number;
  presentDays: number;
  absentDays: number;
  rejectedDays: number;
  attendanceRate: number;
  days: PersonalDay[];
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

function weekdayDatesInMonth(month: string, through = new Date()): string[] {
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
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {weekday: 'short'});
}

export function buildPersonalMonthReport(
  employee: Employee,
  records: AttendanceRecord[],
  month: string,
): PersonalMonthReport {
  const start = localISODate(new Date(employee.createdAt));
  const workingDates = weekdayDatesInMonth(month).filter(date => date >= start);
  const byDate = new Map<string, 'Verified' | 'Rejected'>();
  for (const record of records.filter(item => item.checkInDate.startsWith(month))) {
    const previous = byDate.get(record.checkInDate);
    if (previous === 'Verified') {
      continue;
    }
    byDate.set(record.checkInDate, record.locationStatus);
  }

  const days = workingDates.map(date => {
    const status = byDate.get(date);
    return {
      date,
      weekday: weekdayName(date),
      status: status === 'Rejected' ? 'Rejected' : status ? 'Present' : 'Absent',
    } satisfies PersonalDay;
  });

  const presentDays = days.filter(day => day.status !== 'Absent').length;
  const rejectedDays = days.filter(day => day.status === 'Rejected').length;
  const absentDays = days.filter(day => day.status === 'Absent').length;

  return {
    month,
    monthLabel: formatMonthLabel(month),
    workingDays: days.length,
    presentDays,
    absentDays,
    rejectedDays,
    attendanceRate: days.length === 0 ? 0 : Math.round((presentDays / days.length) * 100),
    days,
  };
}
