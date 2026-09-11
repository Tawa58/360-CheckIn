import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import {requireFirebase} from '../config/firebase';
import {
  COLLECTIONS,
  type AttendanceRecord,
  type Employee,
} from '../../shared/types';
import {localISODate, localTime} from '../../shared/dates';
import {attendanceDocumentId} from '../../shared/docIds';
import {type VerifiedLocation} from './locationService';

function toAttendance(id: string, data: AttendanceRecord): AttendanceRecord {
  return {...data, attendanceId: data.attendanceId || id};
}

export async function listEmployeeAttendance(
  employeeUid: string,
): Promise<AttendanceRecord[]> {
  const {db} = requireFirebase();
  const snapshot = await getDocs(
    query(
      collection(db, COLLECTIONS.attendance),
      where('employeeUid', '==', employeeUid),
    ),
  );

  return snapshot.docs
    .map(item => toAttendance(item.id, item.data() as AttendanceRecord))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getTodayAttendance(
  employeeUid: string,
  date = localISODate(),
): Promise<AttendanceRecord | null> {
  const records = await listEmployeeAttendance(employeeUid);
  return records.find(record => record.checkInDate === date) ?? null;
}

export async function getAttendanceHistory(
  employeeUid: string,
): Promise<AttendanceRecord[]> {
  return listEmployeeAttendance(employeeUid);
}

export async function submitCheckIn(
  employee: Employee,
  location: VerifiedLocation,
): Promise<AttendanceRecord> {
  if (
    !Number.isFinite(location.latitude) ||
    !Number.isFinite(location.longitude)
  ) {
    throw new Error('GPS coordinates could not be verified.');
  }

  const existing = await getTodayAttendance(employee.authUid);
  if (existing) {
    throw new Error('You have already checked in today.');
  }

  return saveVerifiedAttendance(employee, location);
}

async function saveVerifiedAttendance(
  employee: Employee,
  location: VerifiedLocation,
): Promise<AttendanceRecord> {
  const {db} = requireFirebase();
  const now = new Date();
  const checkInDate = localISODate(now);
  const attendanceId = attendanceDocumentId(employee.employeeId, checkInDate);
  const attendanceRef = doc(db, COLLECTIONS.attendance, attendanceId);
  const attendance: AttendanceRecord = {
    attendanceId,
    employeeId: employee.employeeId,
    employeeUid: employee.authUid,
    fullName: employee.fullName,
    department: employee.department,
    checkInDate,
    checkInTime: localTime(now),
    latitude: location.latitude,
    longitude: location.longitude,
    locationStatus: 'Verified',
    createdAt: now.toISOString(),
  };

  await setDoc(attendanceRef, attendance);
  return attendance;
}
