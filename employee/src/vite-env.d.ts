/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USE_FIREBASE_EMULATOR?: string;
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
  readonly VITE_FIREBASE_MEASUREMENT_ID?: string;
  readonly VITE_GEOFENCE_ID?: string;
  readonly VITE_GEOFENCE_NAME?: string;
  readonly VITE_GEOFENCE_LAT?: string;
  readonly VITE_GEOFENCE_LNG?: string;
  readonly VITE_GEOFENCE_RADIUS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
