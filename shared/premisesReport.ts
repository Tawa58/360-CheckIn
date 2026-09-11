import {localTime} from './dates';
import {formatDurationHuman, formatMeters} from './geofence';
import type {AttendanceRecord, BoundaryEvent} from './types';

export type PremisesExitRow = {
  eventId: string;
  employeeId: string;
  fullName: string;
  date: string;
  checkInTime: string | null;
  exitClock: string;
  returnClock: string | null;
  durationOutside: number;
  distanceFromBoundary: number;
  distanceFromCentre: number;
  reason: string;
  open: boolean;
};

export type PremisesReport = {
  rows: PremisesExitRow[];
  exitCount: number;
  totalSecondsOutside: number;
  maxDistanceFromCentre: number;
};

function clock(iso?: string): string | null {
  if (!iso) {
    return null;
  }
  return localTime(new Date(iso));
}

export function buildPremisesReport(
  events: BoundaryEvent[],
  records: AttendanceRecord[],
  month: string,
  employeeUid?: string,
): PremisesReport {
  const attendanceByKey = new Map(
    records.map(record => [`${record.employeeId}_${record.checkInDate}`, record.checkInTime]),
  );

  const rows = events
    .filter(event => event.eventDate.startsWith(month))
    .filter(event => (employeeUid ? event.employeeUid === employeeUid : true))
    .sort((a, b) => a.exitTime.localeCompare(b.exitTime))
    .map(event => {
      const duration =
        event.durationOutside ??
        (event.status === 'open'
          ? Math.max(0, Math.floor((Date.now() - Date.parse(event.exitTime)) / 1000))
          : 0);
      return {
        eventId: event.eventId,
        employeeId: event.employeeId,
        fullName: event.fullName,
        date: event.eventDate,
        checkInTime: attendanceByKey.get(`${event.employeeId}_${event.eventDate}`) ?? null,
        exitClock: clock(event.exitTime) ?? '—',
        returnClock: clock(event.returnTime),
        durationOutside: duration,
        distanceFromBoundary: event.maxDistanceFromBoundary,
        distanceFromCentre: event.maxDistanceFromCentre,
        reason: event.reasonNote
          ? `${event.reason ?? ''} · ${event.reasonNote}`
          : event.reason ?? '—',
        open: event.status === 'open',
      };
    });

  return {
    rows,
    exitCount: rows.length,
    totalSecondsOutside: rows.reduce((sum, row) => sum + row.durationOutside, 0),
    maxDistanceFromCentre: rows.reduce(
      (max, row) => Math.max(max, row.distanceFromCentre),
      0,
    ),
  };
}

export function premisesSummaryLine(report: PremisesReport): string {
  if (report.exitCount === 0) {
    return 'No premises exits in this month.';
  }
  return `Total time outside: ${formatDurationHuman(report.totalSecondsOutside)} · Exits: ${report.exitCount} · Maximum distance from premises: ${formatMeters(report.maxDistanceFromCentre)}`;
}
