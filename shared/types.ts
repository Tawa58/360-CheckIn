export type LocationStatus = 'Verified' | 'Rejected';

export interface Employee {
  employeeId: string;
  fullName: string;
  department: string;
  username: string;
  email?: string;
  accessCode: string;
  codeExpiry: string;
  authUid: string;
  photoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type EmployeeMessageKind = 'absence' | 'issue';
export type EmployeeMessageStatus = 'open' | 'seen' | 'resolved';

export interface EmployeeMessage {
  messageId: string;
  employeeUid: string;
  employeeId: string;
  fullName: string;
  department: string;
  kind: EmployeeMessageKind;
  category: string;
  details: string;
  absenceDate?: string;
  status: EmployeeMessageStatus;
  createdAt: string;
}

export interface AttendanceRecord {
  attendanceId: string;
  employeeId: string;
  employeeUid: string;
  fullName: string;
  department: string;
  checkInDate: string;
  checkInTime: string;
  latitude: number;
  longitude: number;
  locationStatus: LocationStatus;
  createdAt: string;
}

export interface AdminProfile {
  uid: string;
  email: string;
  displayName: string;
  createdAt: string;
}

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface GeofenceSite {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  vertices?: GeoPoint[];
}

export type BoundaryEventStatus = 'open' | 'closed';

export interface BoundaryEvent {
  eventId: string;
  employeeId: string;
  employeeUid: string;
  fullName: string;
  department: string;
  geofenceId: string;
  eventDate: string;
  status: BoundaryEventStatus;
  eventType: 'EXIT';
  exitTime: string;
  returnTime?: string;
  latitude: number;
  longitude: number;
  distanceFromBoundary: number;
  distanceFromCentre: number;
  maxDistanceFromBoundary: number;
  maxDistanceFromCentre: number;
  durationOutside?: number;
  reason?: string;
  reasonNote?: string;
  createdAt: string;
  updatedAt: string;
}

export const EXIT_REASONS = [
  'Work assignment',
  'Lunch',
  'Meeting',
  'Personal',
  'Emergency',
  'Other',
] as const;

export type ExitReason = (typeof EXIT_REASONS)[number];

export const COLLECTIONS = {
  employees: 'employees',
  attendance: 'attendance',
  admins: 'admins',
  usernames: 'usernames',
  accessCodes: 'accessCodes',
  employeeMessages: 'employeeMessages',
  boundaryEvents: 'boundaryEvents',
  settings: 'settings',
} as const;

export const GEOFENCE_SETTINGS_ID = 'geofence';

export const ACCESS_CODE_VALIDITY_MONTHS = 4;
