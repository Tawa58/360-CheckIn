/**
 * Set USE_FIREBASE_EMULATOR to false and paste production credentials
 * when connecting to a real Firebase project.
 */
export const USE_FIREBASE_EMULATOR = true;

export const FIREBASE_EMULATOR = {
  host: '127.0.0.1',
  authPort: 9099,
  firestorePort: 8080,
};

export const firebaseConfig = USE_FIREBASE_EMULATOR
  ? {
      apiKey: 'demo-api-key',
      authDomain: 'demo-companycheckin.firebaseapp.com',
      projectId: 'demo-companycheckin',
      storageBucket: 'demo-companycheckin.appspot.com',
      messagingSenderId: '123456789',
      appId: '1:123456789:web:demo',
    }
  : {
      apiKey: 'YOUR_API_KEY',
      authDomain: 'YOUR_PROJECT.firebaseapp.com',
      projectId: 'YOUR_PROJECT_ID',
      storageBucket: 'YOUR_PROJECT.appspot.com',
      messagingSenderId: 'YOUR_SENDER_ID',
      appId: 'YOUR_APP_ID',
    };

export const AUTHORIZED_ADMIN_EMAILS: string[] = [
  // 'admin@your-company.com',
];

export function isFirebaseConfigured(): boolean {
  if (USE_FIREBASE_EMULATOR) {
    return true;
  }
  return (
    Boolean(firebaseConfig.apiKey) &&
    !firebaseConfig.apiKey.startsWith('YOUR_') &&
    Boolean(firebaseConfig.projectId) &&
    !firebaseConfig.projectId.startsWith('YOUR_')
  );
}

export const EMPLOYEE_AUTH_DOMAIN = 'companycheckin.internal';

export function employeeAuthEmail(username: string): string {
  return `${username.trim().toLowerCase()}@${EMPLOYEE_AUTH_DOMAIN}`;
}
