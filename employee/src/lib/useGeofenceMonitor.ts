import {useCallback, useEffect, useRef, useState} from 'react';
import type {BoundaryEvent, Employee, GeofenceSite} from '@shared/types';
import {
  elapsedSeconds,
  runGeofenceTick,
  type GeofenceReading,
  type PremisesZone,
} from '@shared/geofence';
import {
  closeBoundaryExit,
  listTodayBoundaryEvents,
  saveBoundaryReason,
  startBoundaryExit,
  updateBoundaryProgress,
} from './boundaryEvents';
import {loadGeofenceSite} from './geofenceSite';
import {
  getVerifiedLocation,
  watchVerifiedLocation,
  type LocationResult,
  type VerifiedLocation,
} from './location';

export function useGeofenceMonitor(employee: Employee | null) {
  const [site, setSite] = useState<GeofenceSite | null>(null);
  const [gps, setGps] = useState<LocationResult | null>(null);
  const [gpsLoading, setGpsLoading] = useState(true);
  const [reading, setReading] = useState<GeofenceReading | null>(null);
  const [zone, setZone] = useState<PremisesZone | null>(null);
  const [openEvent, setOpenEvent] = useState<BoundaryEvent | null>(null);
  const [lastClosed, setLastClosed] = useState<BoundaryEvent | null>(null);
  const [todayEvents, setTodayEvents] = useState<BoundaryEvent[]>([]);
  const [reasonSaving, setReasonSaving] = useState(false);
  const [reasonError, setReasonError] = useState('');
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [syncError, setSyncError] = useState('');

  const siteRef = useRef(site);
  const employeeRef = useRef(employee);
  const zoneRef = useRef(zone);
  const openRef = useRef(openEvent);
  const processingRef = useRef(false);

  siteRef.current = site;
  employeeRef.current = employee;
  zoneRef.current = zone;
  openRef.current = openEvent;

  const applyFix = useCallback(async (location: VerifiedLocation) => {
    const currentSite = siteRef.current;
    const currentEmployee = employeeRef.current;
    if (!currentSite || !currentEmployee || processingRef.current) {
      return;
    }
    processingRef.current = true;
    try {
      const tick = runGeofenceTick({
        zone: zoneRef.current,
        site: currentSite,
        location,
        openEvent: openRef.current,
      });
      setReading(tick.reading);
      setZone(tick.nextZone);

      if (tick.kind === 'exit') {
        const event = await startBoundaryExit(
          currentEmployee,
          currentSite,
          location,
          tick.reading,
        );
        setOpenEvent(event);
        setLastClosed(null);
        setTodayEvents(prev => [event, ...prev.filter(item => item.eventId !== event.eventId)]);
        setSyncError('');
      } else if (tick.kind === 'return' && openRef.current) {
        const closed = await closeBoundaryExit(openRef.current, location, tick.reading);
        setOpenEvent(null);
        setLastClosed(closed);
        setTodayEvents(prev =>
          prev.map(item => (item.eventId === closed.eventId ? closed : item)),
        );
        setSyncError('');
      } else if (
        tick.kind === 'progress' &&
        openRef.current &&
        tick.maxDistanceFromBoundary != null &&
        tick.maxDistanceFromCentre != null
      ) {
        await updateBoundaryProgress(
          openRef.current.eventId,
          location,
          tick.reading,
          tick.maxDistanceFromBoundary,
          tick.maxDistanceFromCentre,
        );
        const next: BoundaryEvent = {
          ...openRef.current,
          latitude: location.latitude,
          longitude: location.longitude,
          distanceFromBoundary: tick.reading.fromBoundary,
          distanceFromCentre: tick.reading.fromCentre,
          maxDistanceFromBoundary: tick.maxDistanceFromBoundary,
          maxDistanceFromCentre: tick.maxDistanceFromCentre,
          updatedAt: new Date().toISOString(),
        };
        setOpenEvent(next);
        setTodayEvents(prev =>
          prev.map(item => (item.eventId === next.eventId ? next : item)),
        );
      }
    } catch (err) {
      setSyncError(
        err instanceof Error ? err.message : 'Unable to save the premises event.',
      );
    } finally {
      processingRef.current = false;
    }
  }, []);

  const handleGps = useCallback(
    (result: LocationResult) => {
      setGps(result);
      setGpsLoading(false);
      if (result.ok) {
        void applyFix(result.location);
      }
    },
    [applyFix],
  );

  const refreshGps = useCallback(async () => {
    setGpsLoading(true);
    const result = await getVerifiedLocation();
    handleGps(result);
    return result;
  }, [handleGps]);

  useEffect(() => {
    let cancelled = false;
    loadGeofenceSite()
      .then(next => {
        if (!cancelled) {
          setSite(next);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSyncError('Unable to load the company geofence.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!employee) {
      return;
    }
    let cancelled = false;
    listTodayBoundaryEvents(employee.authUid)
      .then(events => {
        if (cancelled) {
          return;
        }
        setTodayEvents(events);
        const open = events.find(event => event.status === 'open') ?? null;
        setOpenEvent(open);
        setLastClosed(events.find(event => event.status === 'closed') ?? null);
        if (open) {
          setZone('outside');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSyncError('Unable to load today’s premises events.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [employee]);

  useEffect(() => {
    if (!site || !employee) {
      return;
    }
    const stop = watchVerifiedLocation(handleGps);
    return stop;
  }, [employee, handleGps, site]);

  useEffect(() => {
    if (!openEvent) {
      return;
    }
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [openEvent]);

  const submitReason = useCallback(
    async (reason: string, reasonNote?: string) => {
      if (!openEvent) {
        return;
      }
      setReasonError('');
      setReasonSaving(true);
      try {
        await saveBoundaryReason(openEvent.eventId, reason, reasonNote);
        const next = {...openEvent, reason, reasonNote, updatedAt: new Date().toISOString()};
        setOpenEvent(next);
        setTodayEvents(prev =>
          prev.map(item => (item.eventId === next.eventId ? next : item)),
        );
      } catch (err) {
        setReasonError(err instanceof Error ? err.message : 'Unable to save the reason.');
        throw err;
      } finally {
        setReasonSaving(false);
      }
    },
    [openEvent],
  );

  const secondsOutside = openEvent ? elapsedSeconds(openEvent.exitTime, new Date(nowMs)) : 0;

  return {
    site,
    gps,
    gpsLoading,
    reading,
    zone,
    openEvent,
    lastClosed,
    todayEvents,
    secondsOutside,
    reasonSaving,
    reasonError,
    syncError,
    refreshGps,
    submitReason,
  };
}
