import {doc, updateDoc} from 'firebase/firestore';
import {requireFirebase} from './firebase';
import {COLLECTIONS} from '@shared/types';

const MAX_SOURCE_BYTES = 6 * 1024 * 1024;
const OUTPUT_SIZE = 320;

export function compressProfileImage(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    return Promise.reject(new Error('Choose a photo file (JPG, PNG, or WebP).'));
  }
  if (file.size > MAX_SOURCE_BYTES) {
    return Promise.reject(new Error('That photo is larger than 6 MB. Choose a smaller one.'));
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Unable to read that photo.'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('That file could not be opened as a photo.'));
      image.onload = () => {
        const scale = Math.min(OUTPUT_SIZE / image.width, OUTPUT_SIZE / image.height, 1);
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        if (!context) {
          reject(new Error('Unable to process that photo in this browser.'));
          return;
        }
        context.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.72));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export async function saveProfilePhoto(employeeId: string, photoUrl: string): Promise<void> {
  const {db} = requireFirebase();
  await updateDoc(doc(db, COLLECTIONS.employees, employeeId), {
    photoUrl,
    updatedAt: new Date().toISOString(),
  });
}

export async function clearProfilePhoto(employeeId: string): Promise<void> {
  const {db} = requireFirebase();
  await updateDoc(doc(db, COLLECTIONS.employees, employeeId), {
    photoUrl: '',
    updatedAt: new Date().toISOString(),
  });
}
