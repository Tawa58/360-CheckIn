import {doc, getDoc, setDoc} from 'firebase/firestore';
import {requireFirebase} from './firebase';
import {
  COLLECTIONS,
  GEOFENCE_SETTINGS_ID,
  type GeofenceSite,
} from '@shared/types';
import {geofenceFromEnv, isLegacyDefaultGeofence, parseGeofenceSite} from '@shared/geofence';

export async function loadGeofenceSite(): Promise<GeofenceSite> {
  try {
    const {db} = requireFirebase();
    const snapshot = await getDoc(doc(db, COLLECTIONS.settings, GEOFENCE_SETTINGS_ID));
    const parsed = parseGeofenceSite(snapshot.data());
    if (parsed && !isLegacyDefaultGeofence(parsed)) {
      return parsed;
    }
  } catch {
    // Fall back to the configured default site.
  }
  return geofenceFromEnv();
}

export async function saveGeofenceSite(site: GeofenceSite): Promise<GeofenceSite> {
  const {db} = requireFirebase();
  const next: GeofenceSite = {
    id: site.id.trim() || 'office',
    name: site.name.trim() || 'Company premises',
    latitude: site.latitude,
    longitude: site.longitude,
    radiusMeters: Math.max(10, Math.round(site.radiusMeters)),
    vertices: site.vertices,
  };
  await setDoc(doc(db, COLLECTIONS.settings, GEOFENCE_SETTINGS_ID), {
    ...next,
    updatedAt: new Date().toISOString(),
  });
  return next;
}
