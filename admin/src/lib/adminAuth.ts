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
  connectFirestoreEmulator,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  setDoc,
} from 'firebase/firestore';
import {
  AUTHORIZED_ADMIN_EMAILS,
  EMPLOYEE_AUTH_DOMAIN,
  FIREBASE_EMULATOR,
  USE_FIREBASE_EMULATOR,
  firebaseConfig,
} from '@shared/firebaseConfig';
import {COLLECTIONS, type AdminProfile} from '@shared/types';
import {requireFirebase} from './firebase';

function assertAdminEmail(email: string) {
  if (email.toLowerCase().endsWith(`@${EMPLOYEE_AUTH_DOMAIN}`)) {
    throw new Error('Employee accounts cannot access the admin dashboard.');
  }
  if (
    AUTHORIZED_ADMIN_EMAILS.length > 0 &&
    !AUTHORIZED_ADMIN_EMAILS.includes(email)
  ) {
    throw new Error('This account is not authorized for the admin dashboard.');
  }
}

export async function ensureAdminProfile(user: User): Promise<AdminProfile> {
  const {db} = requireFirebase();
  const email = user.email ?? '';
  assertAdminEmail(email);
  const ref = doc(db, COLLECTIONS.admins, user.uid);
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

export async function loginAdmin(email: string, password: string) {
  const {auth} = requireFirebase();
  const credential = await signInWithEmailAndPassword(auth, email, password);
  try {
    await ensureAdminProfile(credential.user);
  } catch (error) {
    await signOut(auth);
    throw error;
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

  const secondary =
    getApps().find(app => app.name === 'Secondary') ??
    initializeApp(firebaseConfig, 'Secondary');
  const secondaryAuth = getAuth(secondary);
  const secondaryDb = getFirestore(secondary);
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
    try {
      connectFirestoreEmulator(
        secondaryDb,
        FIREBASE_EMULATOR.host,
        FIREBASE_EMULATOR.firestorePort,
      );
    } catch {
      // Already connected.
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
    await setDoc(doc(secondaryDb, COLLECTIONS.admins, profile.uid), profile);
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
