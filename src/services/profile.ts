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
