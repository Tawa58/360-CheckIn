export type LocationStatus = 'Verified' | 'Rejected';

export interface Employee {
  employeeId: string;
  fullName: string;
  department: string;
  username: string;
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

export const COLLECTIONS = {
  employees: 'employees',
  attendance: 'attendance',
  admins: 'admins',
  usernames: 'usernames',
  accessCodes: 'accessCodes',
  employeeMessages: 'employeeMessages',
} as const;

export const ACCESS_CODE_VALIDITY_MONTHS = 4;
