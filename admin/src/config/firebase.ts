import {getApp, getApps, initializeApp, type FirebaseApp} from 'firebase/app';
import {connectAuthEmulator, getAuth, type Auth} from 'firebase/auth';
import {
  connectFirestoreEmulator,
  getFirestore,
  type Firestore,
} from 'firebase/firestore';

function readEnv(value: string | undefined): string {
  return value?.trim() ?? '';
}

export const firebaseConfig = {
  apiKey: readEnv(import.meta.env.VITE_FIREBASE_API_KEY),
  authDomain: readEnv(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
  projectId: readEnv(import.meta.env.VITE_FIREBASE_PROJECT_ID),
  storageBucket: readEnv(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: readEnv(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
  appId: readEnv(import.meta.env.VITE_FIREBASE_APP_ID),
};

export const USE_FIREBASE_EMULATOR =
  readEnv(import.meta.env.VITE_USE_FIREBASE_EMULATOR) === 'true';

export const FIREBASE_EMULATOR = {
  host: '127.0.0.1',
  authPort: 9099,
  firestorePort: 8080,
};

export const firebaseReady = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId,
);

export const app: FirebaseApp | null = firebaseReady
  ? getApps().length
    ? getApp()
    : initializeApp(firebaseConfig)
  : null;

export const auth: Auth | null = app ? getAuth(app) : null;
export const db: Firestore | null = app ? getFirestore(app) : null;

if (USE_FIREBASE_EMULATOR && auth && db) {
  try {
    connectAuthEmulator(
      auth,
      `http://${FIREBASE_EMULATOR.host}:${FIREBASE_EMULATOR.authPort}`,
      {disableWarnings: true},
    );
  } catch {
    // Already connected during Vite HMR.
  }
  try {
    connectFirestoreEmulator(
      db,
      FIREBASE_EMULATOR.host,
      FIREBASE_EMULATOR.firestorePort,
    );
  } catch {
    // Already connected during Vite HMR.
  }
}

export function requireFirebase(): {app: FirebaseApp; auth: Auth; db: Firestore} {
  if (!app || !auth || !db) {
    throw new Error(
      'Firebase is not configured. Set VITE_FIREBASE_* values in the repo-root .env file.',
    );
  }
  return {app, auth, db};
}
