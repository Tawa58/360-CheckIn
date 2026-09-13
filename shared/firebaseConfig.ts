/**
 * Firebase settings come from the repo-root .env file.
 * Copy .env.example to .env and fill in the project values.
 */
function trimEnv(value: string | undefined): string {
  return (value ?? '').trim();
}

export const USE_FIREBASE_EMULATOR =
  trimEnv(process.env.VITE_USE_FIREBASE_EMULATOR) === 'true';

export const FIREBASE_EMULATOR = {
  host: '127.0.0.1',
  authPort: 9099,
  firestorePort: 8080,
};

type FirebaseWebConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
};

export const firebaseConfig: FirebaseWebConfig = USE_FIREBASE_EMULATOR
  ? {
      apiKey: 'demo-api-key',
      authDomain: 'demo-companycheckin.firebaseapp.com',
      projectId: 'demo-companycheckin',
      storageBucket: 'demo-companycheckin.appspot.com',
      messagingSenderId: '123456789',
      appId: '1:123456789:web:demo',
    }
  : {
      apiKey: trimEnv(process.env.VITE_FIREBASE_API_KEY),
      authDomain: trimEnv(process.env.VITE_FIREBASE_AUTH_DOMAIN),
      projectId: trimEnv(process.env.VITE_FIREBASE_PROJECT_ID),
      storageBucket: trimEnv(process.env.VITE_FIREBASE_STORAGE_BUCKET),
      messagingSenderId: trimEnv(process.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
      appId: trimEnv(process.env.VITE_FIREBASE_APP_ID),
      measurementId: trimEnv(process.env.VITE_FIREBASE_MEASUREMENT_ID) || undefined,
    };

export const AUTHORIZED_ADMIN_EMAILS: string[] = [
  'test@gmail.com',
];

export function isFirebaseConfigured(): boolean {
  if (USE_FIREBASE_EMULATOR) {
    return true;
  }
  return (
    Boolean(firebaseConfig.apiKey) &&
    Boolean(firebaseConfig.projectId) &&
    Boolean(firebaseConfig.appId)
  );
}

export const EMPLOYEE_AUTH_DOMAIN = 'companycheckin.internal';

export function employeeAuthEmail(username: string): string {
  return `${username.trim().toLowerCase()}@${EMPLOYEE_AUTH_DOMAIN}`;
}
