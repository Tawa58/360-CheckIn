import AsyncStorage from '@react-native-async-storage/async-storage';
import {doc, getDoc, setDoc} from 'firebase/firestore';
import {requireFirebase} from '../config/firebase';
import {forgotLookupId, messageDocumentId} from '../../shared/docIds';
import {
  COLLECTIONS,
  FORGOT_ITEMS,
  type EmployeeMessage,
  type ForgotItem,
} from '../../shared/types';

const REQUEST_KEY = 'checkin360-forgot-request';
const EMAIL_KEY = 'checkin360-forgot-email';

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export async function submitForgotDetails(input: {
  forgotten: ForgotItem[];
  email: string;
  fullName: string;
  username: string;
  details: string;
}): Promise<EmployeeMessage> {
  const email = input.email.trim().toLowerCase();
  const fullName = input.fullName.trim();
  const username = input.username.trim().toLowerCase();
  const details = input.details.trim();
  const forgotten = FORGOT_ITEMS.filter(item => input.forgotten.includes(item));

  if (forgotten.length === 0) {
    throw new Error('Select what you forgot.');
  }
  if (!isEmail(email)) {
    throw new Error('Enter the email saved on your employee profile.');
  }
  if (!fullName && !username) {
    throw new Error('Enter your name or username so admin can find you.');
  }

  const {db} = requireFirebase();
  const ref = doc(db, COLLECTIONS.employeeMessages, messageDocumentId('FORGOT'));
  const message: EmployeeMessage = {
    messageId: ref.id,
    employeeUid: '',
    employeeId: 'FORGOT',
    fullName: fullName || username || 'Employee',
    department: 'Login help',
    kind: 'forgot',
    category: forgotten.join(', '),
    details:
      details ||
      `Forgot ${forgotten.join(', ').toLowerCase()}. Please send the missing login details.`,
    status: 'open',
    createdAt: new Date().toISOString(),
    email,
    forgotten,
    ...(username ? {username} : {}),
  };
  await setDoc(ref, message);
  await setDoc(doc(db, COLLECTIONS.forgotLookups, forgotLookupId(email)), {
    requestId: ref.id,
    email,
    createdAt: message.createdAt,
  });
  await AsyncStorage.setItem(REQUEST_KEY, ref.id);
  await AsyncStorage.setItem(EMAIL_KEY, email);
  return message;
}

export async function loadStoredForgotRequest(): Promise<EmployeeMessage | null> {
  const requestId = await AsyncStorage.getItem(REQUEST_KEY);
  if (!requestId) {
    return null;
  }
  return getForgotRequest(requestId);
}

export async function lookupForgotRequest(email: string): Promise<EmployeeMessage | null> {
  const normalized = email.trim().toLowerCase();
  if (!isEmail(normalized)) {
    throw new Error('Enter the email you used on the request.');
  }
  const {db} = requireFirebase();
  const lookup = await getDoc(doc(db, COLLECTIONS.forgotLookups, forgotLookupId(normalized)));
  const requestId = lookup.data()?.requestId as string | undefined;
  if (!requestId) {
    return null;
  }
  const message = await getForgotRequest(requestId);
  if (message) {
    await AsyncStorage.setItem(REQUEST_KEY, requestId);
    await AsyncStorage.setItem(EMAIL_KEY, normalized);
  }
  return message;
}

export async function getForgotRequest(requestId: string): Promise<EmployeeMessage | null> {
  const {db} = requireFirebase();
  const snapshot = await getDoc(doc(db, COLLECTIONS.employeeMessages, requestId));
  const message = snapshot.data() as EmployeeMessage | undefined;
  return message?.kind === 'forgot' ? message : null;
}

export async function storedForgotEmail(): Promise<string> {
  return (await AsyncStorage.getItem(EMAIL_KEY)) ?? '';
}
