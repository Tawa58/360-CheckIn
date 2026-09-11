import {collection, getDocs} from 'firebase/firestore';
import {COLLECTIONS, type BoundaryEvent} from '@shared/types';
import {requireFirebase} from './firebase';

export async function listBoundaryEvents(): Promise<BoundaryEvent[]> {
  const {db} = requireFirebase();
  const snapshot = await getDocs(collection(db, COLLECTIONS.boundaryEvents));
  return snapshot.docs
    .map(item => {
      const data = item.data() as BoundaryEvent;
      return {...data, eventId: data.eventId || item.id};
    })
    .sort((a, b) => b.exitTime.localeCompare(a.exitTime));
}
