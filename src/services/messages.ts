import {collection, doc, getDocs, query, setDoc, where} from 'firebase/firestore';
import {requireFirebase} from '../config/firebase';
import {messageDocumentId} from '../../shared/docIds';
import {
  COLLECTIONS,
  type Employee,
  type EmployeeMessage,
  type EmployeeMessageKind,
} from '../../shared/types';

export const ABSENCE_CATEGORIES = [
  'Sick',
  'Family emergency',
  'Transport delay',
  'Approved leave',
  'Personal matter',
  'Other',
] as const;

export const ISSUE_CATEGORIES = [
  'App not loading',
  'Check-in failed',
  'GPS / location',
  'Access code',
  'Wrong details',
  'Other',
] as const;

export async function listMyMessages(employeeUid: string): Promise<EmployeeMessage[]> {
  const {db} = requireFirebase();
  const snapshot = await getDocs(
    query(
      collection(db, COLLECTIONS.employeeMessages),
      where('employeeUid', '==', employeeUid),
    ),
  );
  return snapshot.docs
    .map(item => item.data() as EmployeeMessage)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function submitEmployeeMessage(input: {
  employee: Employee;
  kind: EmployeeMessageKind;
  category: string;
  details: string;
  absenceDate?: string;
}): Promise<EmployeeMessage> {
  const details = input.details.trim();
  if (details.length < 8) {
    throw new Error('Please explain what happened in a bit more detail.');
  }
  if (input.kind === 'absence' && !input.absenceDate) {
    throw new Error('Choose the date you will be or were away.');
  }

  const {db} = requireFirebase();
  const ref = doc(
    db,
    COLLECTIONS.employeeMessages,
    messageDocumentId(input.employee.employeeId),
  );
  const message: EmployeeMessage = {
    messageId: ref.id,
    employeeUid: input.employee.authUid,
    employeeId: input.employee.employeeId,
    fullName: input.employee.fullName,
    department: input.employee.department,
    kind: input.kind,
    category: input.category,
    details,
    status: 'open',
    createdAt: new Date().toISOString(),
    ...(input.kind === 'absence' && input.absenceDate
      ? {absenceDate: input.absenceDate}
      : {}),
  };
  await setDoc(ref, message);
  return message;
}
