import {doc, updateDoc} from 'firebase/firestore';
import {requireFirebase} from '../config/firebase';
import {COLLECTIONS} from '../../shared/types';

export async function saveProfilePhoto(
  employeeId: string,
  photoUrl: string,
): Promise<void> {
  const {db} = requireFirebase();
  await updateDoc(doc(db, COLLECTIONS.employees, employeeId), {
    photoUrl,
    updatedAt: new Date().toISOString(),
  });
}

export async function clearProfilePhoto(employeeId: string): Promise<void> {
  const {db} = requireFirebase();
  await updateDoc(doc(db, COLLECTIONS.employees, employeeId), {
    photoUrl: '',
    updatedAt: new Date().toISOString(),
  });
}

export async function saveProfileEmail(employeeId: string, email: string): Promise<void> {
  const trimmed = email.trim().toLowerCase();
  if (trimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    throw new Error('Enter a valid email address.');
  }
  const {db} = requireFirebase();
  await updateDoc(doc(db, COLLECTIONS.employees, employeeId), {
    email: trimmed,
    updatedAt: new Date().toISOString(),
  });
}
