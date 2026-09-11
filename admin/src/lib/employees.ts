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
import {employeeAuthEmail} from '@shared/firebaseConfig';
import {
  generateAccessCode,
  generateEmployeeId,
} from '@shared/accessCode';
import {accessCodeExpiryFrom} from '@shared/dates';
import {requireDepartment} from '@shared/departments';
import {COLLECTIONS, type Employee} from '@shared/types';
import {
  FIREBASE_EMULATOR,
  USE_FIREBASE_EMULATOR,
  firebaseConfig,
  requireFirebase,
} from '../config/firebase';

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

async function uniqueEmployeeId() {
  const {db} = requireFirebase();
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const employeeId = generateEmployeeId();
    const snapshot = await getDoc(doc(db, COLLECTIONS.employees, employeeId));
    if (!snapshot.exists()) {
      return employeeId;
    }
  }
  throw new Error('Could not generate a unique employee ID. Try again.');
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

function toEmployee(data: Employee): Employee {
  return {
    ...data,
    accessCode: data.accessCode ?? '',
    codeExpiry: data.codeExpiry ?? '',
  };
}

export async function listEmployees(): Promise<Employee[]> {
  const {db} = requireFirebase();
  const snapshot = await getDocs(collection(db, COLLECTIONS.employees));
  return snapshot.docs
    .map(item => toEmployee(item.data() as Employee))
    .sort((a, b) => a.fullName.localeCompare(b.fullName));
}

export async function registerEmployee(input: {
  fullName: string;
  department: string;
  username: string;
  password: string;
  email?: string;
}): Promise<Employee> {
  const {db} = requireFirebase();
  const username = input.username.trim().toLowerCase();
  const fullName = input.fullName.trim();
  const department = requireDepartment(input.department);

  if (!fullName) {
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
  const codeExpiry = accessCodeExpiryFrom();
  const employeeId = await uniqueEmployeeId();
  const uid = await createEmployeeAuthAccount(
    employeeAuthEmail(username),
    input.password,
  );
  const now = new Date().toISOString();
  const employee: Employee = {
    employeeId,
    fullName,
    department,
    username,
    ...(input.email?.trim()
      ? {email: input.email.trim().toLowerCase()}
      : {}),
    accessCode,
    codeExpiry,
    authUid: uid,
    createdAt: now,
    updatedAt: now,
  };

  const employeeRef = doc(db, COLLECTIONS.employees, employeeId);
  const batch = writeBatch(db);
  batch.set(employeeRef, employee);
  batch.set(usernameRef, {uid, username, employeeId, accessCode});
  batch.set(doc(db, COLLECTIONS.accessCodes, accessCode), {
    uid,
    employeeId,
    accessCode,
  });
  await batch.commit();

  const saved = await getDoc(employeeRef);
  const profile = saved.data() as Employee | undefined;
  if (!profile?.accessCode || profile.accessCode !== accessCode) {
    await updateDoc(employeeRef, {
      accessCode,
      codeExpiry,
      updatedAt: new Date().toISOString(),
    });
  }

  return {
    ...employee,
    ...profile,
    accessCode,
    codeExpiry,
  };
}

export async function updateEmployeeDetails(
  employee: Employee,
  details: {fullName: string; department: string},
): Promise<void> {
  const {db} = requireFirebase();
  await updateDoc(doc(db, COLLECTIONS.employees, employee.employeeId), {
    fullName: details.fullName.trim(),
    department: requireDepartment(details.department),
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
    employeeId: employee.employeeId,
    accessCode,
  });
  batch.update(doc(db, COLLECTIONS.employees, employee.employeeId), {
    accessCode,
    codeExpiry,
    updatedAt,
  });
  batch.set(doc(db, COLLECTIONS.usernames, employee.username), {
    uid: employee.authUid,
    username: employee.username,
    employeeId: employee.employeeId,
    accessCode,
  });
  await batch.commit();
  return {...employee, accessCode, codeExpiry, updatedAt};
}
