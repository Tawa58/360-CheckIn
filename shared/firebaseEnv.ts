export const FIREBASE_ENV_KEYS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_FIREBASE_MEASUREMENT_ID',
  'VITE_USE_FIREBASE_EMULATOR',
] as const;

export const GEOFENCE_ENV_KEYS = [
  'VITE_GEOFENCE_ID',
  'VITE_GEOFENCE_NAME',
  'VITE_GEOFENCE_LAT',
  'VITE_GEOFENCE_LNG',
  'VITE_GEOFENCE_RADIUS',
] as const;

export function firebaseProcessEnvDefines(
  env: Record<string, string>,
): Record<string, string> {
  return Object.fromEntries(
    [...FIREBASE_ENV_KEYS, ...GEOFENCE_ENV_KEYS].map(key => [
      `process.env.${key}`,
      JSON.stringify(env[key] ?? ''),
    ]),
  );
}
