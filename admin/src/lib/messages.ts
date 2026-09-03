import {collection, doc, getDocs, updateDoc} from 'firebase/firestore';
import {requireFirebase} from './firebase';
import {
  COLLECTIONS,
  type EmployeeMessage,
  type EmployeeMessageStatus,
} from '@shared/types';

export async function listEmployeeMessages(): Promise<EmployeeMessage[]> {
  const {db} = requireFirebase();
  const snapshot = await getDocs(collection(db, COLLECTIONS.employeeMessages));
  return snapshot.docs
    .map(item => item.data() as EmployeeMessage)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function updateMessageStatus(
  messageId: string,
  status: EmployeeMessageStatus,
): Promise<void> {
  const {db} = requireFirebase();
  await updateDoc(doc(db, COLLECTIONS.employeeMessages, messageId), {status});
}
