import {initializeApp, getApps, getApp} from 'firebase/app';
import {
  connectAuthEmulator,
  getAuth,
  initializeAuth,
  type Auth,
  type Persistence,
} from 'firebase/auth';
import {connectFirestoreEmulator, getFirestore, type Firestore} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  FIREBASE_EMULATOR,
  USE_FIREBASE_EMULATOR,
  firebaseConfig,
  isFirebaseConfigured,
} from '../../shared/firebaseConfig';

export const firebaseReady = isFirebaseConfigured();

const app = firebaseReady
  ? getApps().length
    ? getApp()
    : initializeApp(firebaseConfig)
  : null;

function createAuth(): Auth | null {
  if (!app) {
    return null;
  }
  try {
    const authModule = require('@firebase/auth') as {
      getReactNativePersistence: (storage: typeof AsyncStorage) => Persistence;
    };
    return initializeAuth(app, {
      persistence: authModule.getReactNativePersistence(AsyncStorage),
    });
  } catch {
    return getAuth(app);
  }
}

export const auth: Auth | null = createAuth();
export const db: Firestore | null = app ? getFirestore(app) : null;

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
      'Firebase is not configured. Add your project keys in the repo-root .env file.',
    );
  }
  return {auth, db};
}
