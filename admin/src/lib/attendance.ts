import {collection, getDocs} from 'firebase/firestore';
import {COLLECTIONS, type AttendanceRecord} from '@shared/types';
import {requireFirebase} from './firebase';

export async function listAttendance(): Promise<AttendanceRecord[]> {
  const {db} = requireFirebase();
  const snapshot = await getDocs(collection(db, COLLECTIONS.attendance));
  return snapshot.docs
    .map(item => {
      const data = item.data() as AttendanceRecord;
      return {...data, attendanceId: data.attendanceId || item.id};
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
