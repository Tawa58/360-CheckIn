import {collection, doc, getDocs, query, setDoc, updateDoc, where} from 'firebase/firestore';
import {requireFirebase} from './firebase';
import {
  COLLECTIONS,
  type BoundaryEvent,
  type Employee,
  type GeofenceSite,
} from '@shared/types';
import {localISODate} from '@shared/dates';
import {boundaryEventDocumentId} from '@shared/docIds';
import {elapsedSeconds, roundMeters, type GeofenceReading} from '@shared/geofence';
import type {VerifiedLocation} from './location';

function toEvent(id: string, data: BoundaryEvent): BoundaryEvent {
  return {...data, eventId: data.eventId || id};
}

export async function listEmployeeBoundaryEvents(
  employeeUid: string,
): Promise<BoundaryEvent[]> {
  const {db} = requireFirebase();
  const snapshot = await getDocs(
    query(collection(db, COLLECTIONS.boundaryEvents), where('employeeUid', '==', employeeUid)),
  );
  return snapshot.docs
    .map(item => toEvent(item.id, item.data() as BoundaryEvent))
    .sort((a, b) => b.exitTime.localeCompare(a.exitTime));
}

export async function listTodayBoundaryEvents(
  employeeUid: string,
  date = localISODate(),
): Promise<BoundaryEvent[]> {
  const events = await listEmployeeBoundaryEvents(employeeUid);
  return events.filter(event => event.eventDate === date);
}

export async function startBoundaryExit(
  employee: Employee,
  site: GeofenceSite,
  location: VerifiedLocation,
  reading: GeofenceReading,
): Promise<BoundaryEvent> {
  const {db} = requireFirebase();
  const now = new Date();
  const eventId = boundaryEventDocumentId(employee.employeeId, now);
  const fromBoundary = roundMeters(reading.fromBoundary);
  const fromCentre = roundMeters(reading.fromCentre);
  const event: BoundaryEvent = {
    eventId,
    employeeId: employee.employeeId,
    employeeUid: employee.authUid,
    fullName: employee.fullName,
    department: employee.department,
    geofenceId: site.id,
    eventDate: localISODate(now),
    status: 'open',
    eventType: 'EXIT',
    exitTime: now.toISOString(),
    latitude: location.latitude,
    longitude: location.longitude,
    distanceFromBoundary: fromBoundary,
    distanceFromCentre: fromCentre,
    maxDistanceFromBoundary: fromBoundary,
    maxDistanceFromCentre: fromCentre,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
  await setDoc(doc(db, COLLECTIONS.boundaryEvents, eventId), event);
  return event;
}

export async function updateBoundaryProgress(
  eventId: string,
  location: VerifiedLocation,
  reading: GeofenceReading,
  maxDistanceFromBoundary: number,
  maxDistanceFromCentre: number,
): Promise<void> {
  const {db} = requireFirebase();
  await updateDoc(doc(db, COLLECTIONS.boundaryEvents, eventId), {
    latitude: location.latitude,
    longitude: location.longitude,
    distanceFromBoundary: roundMeters(reading.fromBoundary),
    distanceFromCentre: roundMeters(reading.fromCentre),
    maxDistanceFromBoundary: roundMeters(maxDistanceFromBoundary),
    maxDistanceFromCentre: roundMeters(maxDistanceFromCentre),
    updatedAt: new Date().toISOString(),
  });
}

export async function saveBoundaryReason(
  eventId: string,
  reason: string,
  reasonNote?: string,
): Promise<void> {
  const {db} = requireFirebase();
  const payload: Record<string, string> = {
    reason,
    updatedAt: new Date().toISOString(),
  };
  if (reasonNote) {
    payload.reasonNote = reasonNote;
  }
  await updateDoc(doc(db, COLLECTIONS.boundaryEvents, eventId), payload);
}

export async function closeBoundaryExit(
  event: BoundaryEvent,
  location: VerifiedLocation,
  reading: GeofenceReading,
): Promise<BoundaryEvent> {
  const {db} = requireFirebase();
  const now = new Date();
  const closed: BoundaryEvent = {
    ...event,
    status: 'closed',
    returnTime: now.toISOString(),
    latitude: location.latitude,
    longitude: location.longitude,
    distanceFromBoundary: roundMeters(reading.fromBoundary),
    distanceFromCentre: roundMeters(reading.fromCentre),
    maxDistanceFromBoundary: roundMeters(
      Math.max(event.maxDistanceFromBoundary, reading.fromBoundary),
    ),
    maxDistanceFromCentre: roundMeters(
      Math.max(event.maxDistanceFromCentre, reading.fromCentre),
    ),
    durationOutside: elapsedSeconds(event.exitTime, now),
    updatedAt: now.toISOString(),
  };
  await updateDoc(doc(db, COLLECTIONS.boundaryEvents, event.eventId), {
    status: closed.status,
    returnTime: closed.returnTime,
    latitude: closed.latitude,
    longitude: closed.longitude,
    distanceFromBoundary: closed.distanceFromBoundary,
    distanceFromCentre: closed.distanceFromCentre,
    maxDistanceFromBoundary: closed.maxDistanceFromBoundary,
    maxDistanceFromCentre: closed.maxDistanceFromCentre,
    durationOutside: closed.durationOutside,
    updatedAt: closed.updatedAt,
  });
  return closed;
}
