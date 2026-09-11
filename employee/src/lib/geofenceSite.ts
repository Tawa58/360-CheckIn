import {doc, getDoc} from 'firebase/firestore';
import {requireFirebase} from './firebase';
import {COLLECTIONS, GEOFENCE_SETTINGS_ID, type GeofenceSite} from '@shared/types';
import {geofenceFromEnv, isLegacyDefaultGeofence, parseGeofenceSite} from '@shared/geofence';

export async function loadGeofenceSite(): Promise<GeofenceSite> {
  try {
    const {db} = requireFirebase();
    const snapshot = await getDoc(doc(db, COLLECTIONS.settings, GEOFENCE_SETTINGS_ID));
    const parsed = snapshot.exists() ? parseGeofenceSite(snapshot.data()) : null;
    if (parsed && !isLegacyDefaultGeofence(parsed)) {
      return parsed;
    }
  } catch {
    // Fall back to the configured default site.
  }
  return geofenceFromEnv();
}
