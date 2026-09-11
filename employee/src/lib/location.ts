export type LocationFailureReason =
  | 'permission_denied'
  | 'unavailable'
  | 'timeout'
  | 'position_unavailable'
  | 'unknown';

export type VerifiedLocation = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
};

export type LocationResult =
  | {ok: true; location: VerifiedLocation}
  | {ok: false; reason: LocationFailureReason; message: string};

function isValidCoordinate(value: number): boolean {
  return typeof value === 'number' && Number.isFinite(value);
}

function mapGeolocationError(error: GeolocationPositionError): LocationResult {
  if (error.code === error.PERMISSION_DENIED) {
    return {
      ok: false,
      reason: 'permission_denied',
      message: 'Location permission was denied. Allow location access to check in.',
    };
  }
  if (error.code === error.POSITION_UNAVAILABLE) {
    return {
      ok: false,
      reason: 'position_unavailable',
      message: 'GPS is unavailable. Turn on location services and try again.',
    };
  }
  if (error.code === error.TIMEOUT) {
    return {
      ok: false,
      reason: 'timeout',
      message: 'GPS timed out. Move to an open area and try again.',
    };
  }
  return {
    ok: false,
    reason: 'unknown',
    message: error.message || 'Unable to verify GPS location.',
  };
}

const GPS_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 20000,
  maximumAge: 0,
};

const WATCH_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 20000,
  maximumAge: 3000,
};

function readPosition(position: GeolocationPosition): LocationResult {
  const {latitude, longitude, accuracy} = position.coords;
  if (!isValidCoordinate(latitude) || !isValidCoordinate(longitude)) {
    return {
      ok: false,
      reason: 'unavailable',
      message: 'GPS coordinates could not be verified.',
    };
  }
  return {
    ok: true,
    location: {
      latitude,
      longitude,
      accuracy: Number.isFinite(accuracy) ? accuracy : null,
    },
  };
}

export function watchVerifiedLocation(
  onUpdate: (result: LocationResult) => void,
): () => void {
  if (!('geolocation' in navigator)) {
    onUpdate({
      ok: false,
      reason: 'unavailable',
      message: 'This browser does not support GPS location.',
    });
    return () => {};
  }

  const watchId = navigator.geolocation.watchPosition(
    position => onUpdate(readPosition(position)),
    error => onUpdate(mapGeolocationError(error)),
    WATCH_OPTIONS,
  );

  return () => navigator.geolocation.clearWatch(watchId);
}

export async function getVerifiedLocation(): Promise<LocationResult> {
  if (!('geolocation' in navigator)) {
    return {
      ok: false,
      reason: 'unavailable',
      message: 'This browser does not support GPS location.',
    };
  }

  return new Promise(resolve => {
    navigator.geolocation.getCurrentPosition(
      position => resolve(readPosition(position)),
      error => resolve(mapGeolocationError(error)),
      GPS_OPTIONS,
    );
  });
}
