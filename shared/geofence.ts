import type {BoundaryEvent, GeoPoint, GeofenceSite} from './types';

const EARTH_RADIUS_M = 6_371_000;
const EXIT_BUFFER_M = 8;
const ENTER_BUFFER_M = 4;
const PROGRESS_STEP_M = 10;
const GPS_BOUNDARY_BUFFER_M = 15;

/** Surveyed corners from 17°52'42.40"S 30°40'32.91"E and 17°52'43.71"S 30°40'33.48"E. */
export const PREMISES_BOUNDARY: GeoPoint[] = [
  {latitude: -17.87844444, longitude: 30.67580833},
  {latitude: -17.87844444, longitude: 30.67596667},
  {latitude: -17.87880833, longitude: 30.67596667},
  {latitude: -17.87880833, longitude: 30.67580833},
];

export function siteFromVertices(
  vertices: GeoPoint[],
  id: string,
  name: string,
): GeofenceSite {
  const north = Math.max(...vertices.map(point => point.latitude));
  const south = Math.min(...vertices.map(point => point.latitude));
  const east = Math.max(...vertices.map(point => point.longitude));
  const west = Math.min(...vertices.map(point => point.longitude));
  const latitude = (north + south) / 2;
  const longitude = (west + east) / 2;
  const centre = {latitude, longitude};
  const cover = Math.max(...vertices.map(point => haversineMeters(centre, point)));
  return {
    id,
    name,
    latitude,
    longitude,
    radiusMeters: Math.max(120, Math.ceil(cover + GPS_BOUNDARY_BUFFER_M)),
    vertices,
  };
}

export const DEFAULT_GEOFENCE: GeofenceSite = siteFromVertices(
  PREMISES_BOUNDARY,
  'office',
  'Company premises',
);

export type PremisesZone = 'inside' | 'outside';

export type GeofenceReading = {
  inside: boolean;
  fromCentre: number;
  fromBoundary: number;
};

export type GeofenceTick = {
  kind: 'idle' | 'exit' | 'return' | 'progress';
  nextZone: PremisesZone;
  reading: GeofenceReading;
  maxDistanceFromCentre?: number;
  maxDistanceFromBoundary?: number;
};

function toFiniteNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function geofenceFromEnv(): GeofenceSite {
  const radius = Math.max(
    10,
    toFiniteNumber(process.env.VITE_GEOFENCE_RADIUS, DEFAULT_GEOFENCE.radiusMeters),
  );
  const latitude = toFiniteNumber(process.env.VITE_GEOFENCE_LAT, DEFAULT_GEOFENCE.latitude);
  const longitude = toFiniteNumber(process.env.VITE_GEOFENCE_LNG, DEFAULT_GEOFENCE.longitude);
  const matchesDefault =
    Math.abs(latitude - DEFAULT_GEOFENCE.latitude) < 0.0002 &&
    Math.abs(longitude - DEFAULT_GEOFENCE.longitude) < 0.0002;
  return {
    id: process.env.VITE_GEOFENCE_ID?.trim() || DEFAULT_GEOFENCE.id,
    name: process.env.VITE_GEOFENCE_NAME?.trim() || DEFAULT_GEOFENCE.name,
    latitude,
    longitude,
    radiusMeters: radius,
    vertices: matchesDefault ? DEFAULT_GEOFENCE.vertices : undefined,
  };
}

export function parseGeofenceSite(data: unknown): GeofenceSite | null {
  if (!data || typeof data !== 'object') {
    return null;
  }
  const record = data as Record<string, unknown>;
  const latitude = Number(record.latitude);
  const longitude = Number(record.longitude);
  const radiusMeters = Number(record.radiusMeters);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }
  if (!Number.isFinite(radiusMeters) || radiusMeters < 10) {
    return null;
  }
  const name = typeof record.name === 'string' && record.name.trim() ? record.name.trim() : 'Office';
  const id = typeof record.id === 'string' && record.id.trim() ? record.id.trim() : 'office';
  const vertices = parseVertices(record.vertices);
  return {id, name, latitude, longitude, radiusMeters, vertices};
}

function parseVertices(value: unknown): GeoPoint[] | undefined {
  if (!Array.isArray(value) || value.length < 3) {
    return undefined;
  }
  const vertices = value
    .map(item => {
      if (!item || typeof item !== 'object') {
        return null;
      }
      const record = item as Record<string, unknown>;
      const latitude = Number(record.latitude);
      const longitude = Number(record.longitude);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return null;
      }
      return {latitude, longitude};
    })
    .filter((item): item is GeoPoint => item !== null);
  return vertices.length >= 3 ? vertices : undefined;
}

export function isLegacyDefaultGeofence(site: GeofenceSite): boolean {
  return Math.abs(site.latitude - -17.8292) < 0.0003 && Math.abs(site.longitude - 31.0522) < 0.0003;
}

export function haversineMeters(
  from: {latitude: number; longitude: number},
  to: {latitude: number; longitude: number},
): number {
  const lat1 = (from.latitude * Math.PI) / 180;
  const lat2 = (to.latitude * Math.PI) / 180;
  const dLat = lat2 - lat1;
  const dLng = ((to.longitude - from.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function metersOffset(
  site: GeofenceSite,
  latitude: number,
  longitude: number,
): {east: number; north: number} {
  const metersPerDegLat = 111_320;
  const metersPerDegLng = 111_320 * Math.cos((site.latitude * Math.PI) / 180);
  return {
    east: (longitude - site.longitude) * metersPerDegLng,
    north: (latitude - site.latitude) * metersPerDegLat,
  };
}

export function gpsAccuracyAllowance(accuracy: number | null | undefined): number {
  if (accuracy == null || !Number.isFinite(accuracy) || accuracy <= 0) {
    return 0;
  }
  return Math.min(accuracy, 40);
}

export function evaluatePosition(
  site: GeofenceSite,
  location: {latitude: number; longitude: number; accuracy?: number | null},
): GeofenceReading {
  const fromCentre = haversineMeters(site, location);
  const radius = site.radiusMeters + gpsAccuracyAllowance(location.accuracy);
  return {
    inside: fromCentre <= radius,
    fromCentre,
    fromBoundary: Math.max(0, fromCentre - site.radiusMeters),
  };
}

export function resolveZone(
  current: PremisesZone | null,
  fromCentre: number,
  radiusMeters: number,
): PremisesZone {
  if (current === null) {
    return fromCentre <= radiusMeters ? 'inside' : 'outside';
  }
  if (current === 'inside') {
    return fromCentre > radiusMeters + EXIT_BUFFER_M ? 'outside' : 'inside';
  }
  return fromCentre <= Math.max(0, radiusMeters - ENTER_BUFFER_M) ? 'inside' : 'outside';
}

export function runGeofenceTick(input: {
  zone: PremisesZone | null;
  site: GeofenceSite;
  location: {latitude: number; longitude: number; accuracy?: number | null};
  openEvent: BoundaryEvent | null;
}): GeofenceTick {
  const reading = evaluatePosition(input.site, input.location);
  const nextZone = resolveZone(
    input.zone,
    reading.fromCentre,
    input.site.radiusMeters + gpsAccuracyAllowance(input.location.accuracy),
  );

  if (!input.openEvent && nextZone === 'outside') {
    return {kind: 'exit', nextZone, reading};
  }
  if (input.openEvent && nextZone === 'inside') {
    return {kind: 'return', nextZone, reading};
  }
  if (input.openEvent && nextZone === 'outside') {
    const maxDistanceFromCentre = Math.max(
      input.openEvent.maxDistanceFromCentre,
      reading.fromCentre,
    );
    const maxDistanceFromBoundary = Math.max(
      input.openEvent.maxDistanceFromBoundary,
      reading.fromBoundary,
    );
    const grew = maxDistanceFromCentre >= input.openEvent.maxDistanceFromCentre + PROGRESS_STEP_M;
    return {
      kind: grew ? 'progress' : 'idle',
      nextZone,
      reading,
      maxDistanceFromCentre,
      maxDistanceFromBoundary,
    };
  }
  return {kind: 'idle', nextZone, reading};
}

export function roundMeters(value: number): number {
  return Math.round(value * 10) / 10;
}

export function elapsedSeconds(fromIso: string, to = new Date()): number {
  const started = Date.parse(fromIso);
  if (!Number.isFinite(started)) {
    return 0;
  }
  return Math.max(0, Math.floor((to.getTime() - started) / 1000));
}

export function formatMeters(value: number): string {
  return `${Math.round(value)} m`;
}

export function formatDurationClock(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  return [hours, minutes, secs].map(part => String(part).padStart(2, '0')).join(':');
}

export function formatDurationHuman(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  }
  if (minutes > 0) {
    return `${minutes} min ${secs} sec`;
  }
  return `${secs} sec`;
}

export function formatDurationShort(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return `${total}s`;
}

export function metersFromBoundaryLine(reading: GeofenceReading, radiusMeters: number): number {
  return reading.inside
    ? Math.max(0, radiusMeters - reading.fromCentre)
    : reading.fromBoundary;
}

export type VicinityLayout = {
  width: number;
  height: number;
  cx: number;
  cy: number;
  radiusPx: number;
  userX: number;
  userY: number;
  hasUser: boolean;
};

export function hexagonPoints(cx: number, cy: number, radius: number): string {
  return Array.from({length: 6}, (_, index) => {
    const angle = (Math.PI / 180) * (60 * index - 30);
    return `${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`;
  }).join(' ');
}

export function vicinityLayout(
  site: GeofenceSite,
  user: {latitude: number; longitude: number} | null,
  width = 320,
  height = 220,
): VicinityLayout {
  const cx = width / 2;
  const cy = height / 2 + 6;
  const offset = user
    ? metersOffset(site, user.latitude, user.longitude)
    : {east: 0, north: 0};
  const userDist = Math.hypot(offset.east, offset.north);
  const span = Math.max(site.radiusMeters * 1.35, userDist * 1.28, 50);
  const scale = (Math.min(width, height) * 0.38) / span;
  return {
    width,
    height,
    cx,
    cy,
    radiusPx: site.radiusMeters * scale,
    userX: cx + offset.east * scale,
    userY: cy - offset.north * scale,
    hasUser: Boolean(user),
  };
}
