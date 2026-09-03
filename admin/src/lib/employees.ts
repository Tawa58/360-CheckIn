import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  signOut,
} from 'firebase/auth';
import {initializeApp, getApps} from 'firebase/app';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import {firebaseConfig, employeeAuthEmail, FIREBASE_EMULATOR, USE_FIREBASE_EMULATOR} from '@shared/firebaseConfig';
import {
  generateAccessCode,
  generateEmployeeId,
} from '@shared/accessCode';
import {accessCodeExpiryFrom} from '@shared/dates';
import {COLLECTIONS, type Employee} from '@shared/types';
import {requireFirebase} from './firebase';

async function createEmployeeAuthAccount(email: string, password: string) {
  const secondary =
    getApps().find(app => app.name === 'Secondary') ??
    initializeApp(firebaseConfig, 'Secondary');
  const secondaryAuth = getAuth(secondary);
  if (USE_FIREBASE_EMULATOR) {
    try {
      connectAuthEmulator(
        secondaryAuth,
        `http://${FIREBASE_EMULATOR.host}:${FIREBASE_EMULATOR.authPort}`,
        {disableWarnings: true},
      );
    } catch {
      // Secondary auth already pointed at the emulator.
    }
  }
  const credential = await createUserWithEmailAndPassword(
    secondaryAuth,
    email,
    password,
  );
  const uid = credential.user.uid;
  await signOut(secondaryAuth);
  return uid;
}

async function uniqueAccessCode() {
  const {db} = requireFirebase();
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const accessCode = generateAccessCode();
    const snapshot = await getDoc(doc(db, COLLECTIONS.accessCodes, accessCode));
    if (!snapshot.exists()) {
      return accessCode;
    }
  }
  throw new Error('Could not generate a unique access code. Try again.');
}

export async function listEmployees(): Promise<Employee[]> {
  const {db} = requireFirebase();
  const snapshot = await getDocs(collection(db, COLLECTIONS.employees));
  return snapshot.docs
    .map(item => item.data() as Employee)
    .sort((a, b) => a.fullName.localeCompare(b.fullName));
}

export async function registerEmployee(input: {
  fullName: string;
  department: string;
  username: string;
  password: string;
}): Promise<Employee> {
  const {db} = requireFirebase();
  const username = input.username.trim().toLowerCase();
  const fullName = input.fullName.trim();
  const department = input.department.trim();

  if (!fullName || !department) {
    throw new Error('Full name and department are required.');
  }
  if (!/^[a-z0-9._]{3,32}$/.test(username)) {
    throw new Error(
      'Username must be 3-32 characters using letters, numbers, dots, or underscores.',
    );
  }
  if (input.password.length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }

  const usernameRef = doc(db, COLLECTIONS.usernames, username);
  if ((await getDoc(usernameRef)).exists()) {
    throw new Error('That username is already registered.');
  }

  const accessCode = await uniqueAccessCode();
  const uid = await createEmployeeAuthAccount(
    employeeAuthEmail(username),
    input.password,
  );
  const now = new Date().toISOString();
  const employee: Employee = {
    employeeId: generateEmployeeId(),
    fullName,
    department,
    username,
    accessCode,
    codeExpiry: accessCodeExpiryFrom(),
    authUid: uid,
    createdAt: now,
    updatedAt: now,
  };

  const batch = writeBatch(db);
  batch.set(doc(db, COLLECTIONS.employees, uid), employee);
  batch.set(usernameRef, {uid, username});
  batch.set(doc(db, COLLECTIONS.accessCodes, accessCode), {uid, accessCode});
  await batch.commit();
  return employee;
}

export async function updateEmployeeDetails(
  employee: Employee,
  details: {fullName: string; department: string},
): Promise<void> {
  const {db} = requireFirebase();
  await updateDoc(doc(db, COLLECTIONS.employees, employee.authUid), {
    fullName: details.fullName.trim(),
    department: details.department.trim(),
    updatedAt: new Date().toISOString(),
  });
}

export async function renewAccessCode(employee: Employee): Promise<Employee> {
  const {db} = requireFirebase();
  const accessCode = await uniqueAccessCode();
  const codeExpiry = accessCodeExpiryFrom();
  const updatedAt = new Date().toISOString();
  const batch = writeBatch(db);
  batch.delete(doc(db, COLLECTIONS.accessCodes, employee.accessCode));
  batch.set(doc(db, COLLECTIONS.accessCodes, accessCode), {
    uid: employee.authUid,
    accessCode,
  });
  batch.update(doc(db, COLLECTIONS.employees, employee.authUid), {
    accessCode,
    codeExpiry,
    updatedAt,
  });
  await batch.commit();
  return {...employee, accessCode, codeExpiry, updatedAt};
}
