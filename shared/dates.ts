import {ACCESS_CODE_VALIDITY_MONTHS} from './types';

export function localISODate(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function localTime(date = new Date()): string {
  return [date.getHours(), date.getMinutes(), date.getSeconds()]
    .map(value => String(value).padStart(2, '0'))
    .join(':');
}

export function addMonths(date: Date, months: number): Date {
  const next = new Date(date.getTime());
  next.setMonth(next.getMonth() + months);
  return next;
}

export function accessCodeExpiryFrom(date = new Date()): string {
  return addMonths(date, ACCESS_CODE_VALIDITY_MONTHS).toISOString();
}

export function isExpired(isoDate: string, now = new Date()): boolean {
  return new Date(isoDate).getTime() <= now.getTime();
}

export function daysUntil(isoDate: string, now = new Date()): number {
  const diff = new Date(isoDate).getTime() - now.getTime();
  return Math.ceil(diff / 86_400_000);
}

export function formatDisplayDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDisplayDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatExpiry(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
