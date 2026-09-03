import {initializeApp, getApps, getApp} from 'firebase/app';
import {connectAuthEmulator, getAuth} from 'firebase/auth';
import {connectFirestoreEmulator, getFirestore} from 'firebase/firestore';
import {
  FIREBASE_EMULATOR,
  USE_FIREBASE_EMULATOR,
  firebaseConfig,
  isFirebaseConfigured,
} from '@shared/firebaseConfig';

export const firebaseReady = isFirebaseConfigured();

const app = firebaseReady
  ? getApps().length
    ? getApp()
    : initializeApp(firebaseConfig)
  : null;

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;

if (USE_FIREBASE_EMULATOR && auth && db) {
  try {
    connectAuthEmulator(
      auth,
      `http://${FIREBASE_EMULATOR.host}:${FIREBASE_EMULATOR.authPort}`,
      {disableWarnings: true},
    );
  } catch {
    // Already connected.
  }
  try {
    connectFirestoreEmulator(
      db,
      FIREBASE_EMULATOR.host,
      FIREBASE_EMULATOR.firestorePort,
    );
  } catch {
    // Already connected.
  }
}

export function requireFirebase() {
  if (!firebaseReady || !auth || !db) {
    throw new Error(
      'Firebase is not configured. Add your project keys in shared/firebaseConfig.ts.',
    );
  }
  return {auth, db};
}
