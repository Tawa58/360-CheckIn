import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import {initializeApp, getApps} from 'firebase/app';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from 'firebase/firestore';
import {
  AUTHORIZED_ADMIN_EMAILS,
  EMPLOYEE_AUTH_DOMAIN,
} from '@shared/firebaseConfig';
import {COLLECTIONS, type AdminProfile} from '@shared/types';
import {adminDocumentId} from '@shared/docIds';
import {
  FIREBASE_EMULATOR,
  USE_FIREBASE_EMULATOR,
  firebaseConfig,
  requireFirebase,
} from '../config/firebase';

function assertAdminEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  if (normalized.endsWith(`@${EMPLOYEE_AUTH_DOMAIN}`)) {
    throw new Error('Employee accounts cannot access the admin dashboard.');
  }
  const allowlist = AUTHORIZED_ADMIN_EMAILS.map(item => item.trim().toLowerCase());
  if (allowlist.length === 0 || !allowlist.includes(normalized)) {
    throw new Error('This account is not authorized for the admin dashboard.');
  }
}

export async function ensureAdminProfile(user: User): Promise<AdminProfile> {
  const {db} = requireFirebase();
  const email = user.email ?? '';
  assertAdminEmail(email);
  const ref = doc(db, COLLECTIONS.admins, adminDocumentId(email));
  const snapshot = await getDoc(ref);
  if (snapshot.exists()) {
    return snapshot.data() as AdminProfile;
  }
  const profile: AdminProfile = {
    uid: user.uid,
    email,
    displayName: user.displayName || email.split('@')[0] || 'Admin',
    createdAt: new Date().toISOString(),
  };
  await setDoc(ref, profile);
  return profile;
}

function mapAdminAuthError(error: unknown): Error {
  if (error instanceof Error && error.message && !error.message.startsWith('Firebase:')) {
    return error;
  }
  const code =
    typeof error === 'object' && error && 'code' in error
      ? String((error as {code?: string}).code)
      : '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-email':
      return new Error('Invalid email or password.');
    case 'auth/too-many-requests':
      return new Error('Too many attempts. Please wait and try again.');
    case 'auth/network-request-failed':
      return new Error('Network error. Check your connection and try again.');
    default:
      return error instanceof Error ? error : new Error('Unable to sign in.');
  }
}

export async function loginAdmin(email: string, password: string) {
  const {auth} = requireFirebase();
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    await ensureAdminProfile(credential.user);
  } catch (error) {
    await signOut(auth).catch(() => undefined);
    throw mapAdminAuthError(error);
  }
}

export async function createAdminAccount(
  email: string,
  password: string,
  displayName: string,
) {
  const trimmedEmail = email.trim().toLowerCase();
  assertAdminEmail(trimmedEmail);
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }

  const {db} = requireFirebase();
  const secondary =
    getApps().find(app => app.name === 'Secondary') ??
    initializeApp(firebaseConfig, 'Secondary');
  const secondaryAuth = getAuth(secondary);
  if (USE_FIREBASE_EMULATOR) {
    try {
      connectAuthEmulator(
        secondaryAuth,
        `http://${FIREBASE_EMULATOR.host}:${FIREBASE_EMULATOR.authPort}`,
        {disableWarnings: true},
      );
    } catch {
      // Secondary auth already pointed at the emulator.
    }
  }

  const credential = await createUserWithEmailAndPassword(
    secondaryAuth,
    trimmedEmail,
    password,
  );
  const profile: AdminProfile = {
    uid: credential.user.uid,
    email: trimmedEmail,
    displayName: displayName.trim() || trimmedEmail.split('@')[0],
    createdAt: new Date().toISOString(),
  };
  try {
    await setDoc(doc(db, COLLECTIONS.admins, adminDocumentId(trimmedEmail)), profile);
  } finally {
    await signOut(secondaryAuth);
  }
  return profile;
}

export async function listAdmins(): Promise<AdminProfile[]> {
  const {db} = requireFirebase();
  const snapshot = await getDocs(collection(db, COLLECTIONS.admins));
  return snapshot.docs
    .map(item => item.data() as AdminProfile)
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
}

export function subscribeToAdminAuth(callback: (user: User | null) => void) {
  const {auth} = requireFirebase();
  return onAuthStateChanged(auth, callback);
}

export async function logoutAdmin() {
  const {auth} = requireFirebase();
  await signOut(auth);
}
