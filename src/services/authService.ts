import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
  type Unsubscribe,
} from 'firebase/auth';
import {doc, getDoc} from 'firebase/firestore';
import {requireFirebase} from '../config/firebase';
import {employeeAuthEmail} from '../../shared/firebaseConfig';
import {COLLECTIONS, type Employee} from '../../shared/types';
import {isExpired} from '../../shared/dates';
import {isAccessCodeFormat, normalizeAccessCode} from '../../shared/accessCode';

export function mapAuthError(error: unknown): string {
  const code =
    typeof error === 'object' && error && 'code' in error
      ? String((error as {code?: string}).code)
      : '';

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-email':
      return 'Invalid username, password, or access code.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait and try again.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    default:
      if (error instanceof Error && error.message) {
        return error.message;
      }
      return 'Unable to sign in. Please try again.';
  }
}

export async function fetchEmployeeProfile(uid: string): Promise<Employee> {
  const {db} = requireFirebase();
  const snapshot = await getDoc(doc(db, COLLECTIONS.employees, uid));
  if (!snapshot.exists()) {
    throw new Error('This account is not registered as an employee.');
  }
  return snapshot.data() as Employee;
}

export async function loginEmployee(
  username: string,
  password: string,
  accessCode: string,
): Promise<Employee> {
  const {auth} = requireFirebase();
  const trimmedUsername = username.trim().toLowerCase();
  const normalizedCode = normalizeAccessCode(accessCode);

  if (!trimmedUsername || !password || !normalizedCode) {
    throw new Error('Username, password, and access code are required.');
  }
  if (!isAccessCodeFormat(normalizedCode)) {
    throw new Error('Enter your access code in the format EMP-XXXXXX.');
  }

  const credential = await signInWithEmailAndPassword(
    auth,
    employeeAuthEmail(trimmedUsername),
    password,
  );

  try {
    const employee = await fetchEmployeeProfile(credential.user.uid);

    if (normalizeAccessCode(employee.accessCode) !== normalizedCode) {
      throw new Error('Invalid access code.');
    }
    if (isExpired(employee.codeExpiry)) {
      throw new Error(
        'Your access code has expired. Ask an administrator to renew it.',
      );
    }
    if (employee.username !== trimmedUsername) {
      throw new Error('This access code does not match the employee profile.');
    }

    return employee;
  } catch (error) {
    await signOut(auth);
    throw error;
  }
}

export async function logoutEmployee(): Promise<void> {
  const {auth} = requireFirebase();
  await signOut(auth);
}

export function subscribeToAuth(
  callback: (user: User | null) => void,
): Unsubscribe {
  const {auth} = requireFirebase();
  return onAuthStateChanged(auth, callback);
}
