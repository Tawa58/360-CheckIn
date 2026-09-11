import {PermissionsAndroid, Platform} from 'react-native';
import Geolocation, {
  type GeolocationError,
  type GeolocationResponse,
} from '@react-native-community/geolocation';

Geolocation.setRNConfiguration({
  skipPermissionRequests: true,
  authorizationLevel: 'whenInUse',
  locationProvider: 'auto',
  enableBackgroundLocationUpdates: false,
});

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

export async function requestLocationPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }

  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    {
      title: 'Location required',
      message:
        'CompanyCheckIn must verify your GPS location before you can check in.',
      buttonPositive: 'Allow',
      buttonNegative: 'Deny',
    },
  );

  if (granted === PermissionsAndroid.RESULTS.GRANTED) {
    return true;
  }

  const coarse = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
    {
      title: 'Location required',
      message:
        'Precise GPS is required for attendance. Please allow location access.',
      buttonPositive: 'Allow',
      buttonNegative: 'Deny',
    },
  );

  return coarse === PermissionsAndroid.RESULTS.GRANTED;
}

function isValidCoordinate(value: number): boolean {
  return typeof value === 'number' && Number.isFinite(value);
}

function mapGeolocationError(error: GeolocationError): LocationResult {
  if (error.code === 1) {
    return {
      ok: false,
      reason: 'permission_denied',
      message:
        'Location permission was denied. Enable GPS permission to check in.',
    };
  }
  if (error.code === 2) {
    return {
      ok: false,
      reason: 'position_unavailable',
      message:
        'GPS is unavailable. Turn on location services and try again.',
    };
  }
  if (error.code === 3) {
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

function readPosition(position: GeolocationResponse): LocationResult {
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

export async function watchVerifiedLocation(
  onUpdate: (result: LocationResult) => void,
): Promise<() => void> {
  const permitted = await requestLocationPermission();
  if (!permitted) {
    onUpdate({
      ok: false,
      reason: 'permission_denied',
      message:
        'Location permission is required. Check-in is blocked without GPS.',
    });
    return () => {};
  }

  const watchId = Geolocation.watchPosition(
    (position: GeolocationResponse) => {
      onUpdate(readPosition(position));
    },
    (error: GeolocationError) => {
      onUpdate(mapGeolocationError(error));
    },
    {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 3000,
      distanceFilter: 5,
    },
  );

  return () => Geolocation.clearWatch(watchId);
}

export async function getVerifiedLocation(): Promise<LocationResult> {
  const permitted = await requestLocationPermission();
  if (!permitted) {
    return {
      ok: false,
      reason: 'permission_denied',
      message:
        'Location permission is required. Check-in is blocked without GPS.',
    };
  }

  return new Promise(resolve => {
    Geolocation.getCurrentPosition(
      (position: GeolocationResponse) => {
        resolve(readPosition(position));
      },
      (error: GeolocationError) => {
        resolve(mapGeolocationError(error));
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      },
    );
  });
}
