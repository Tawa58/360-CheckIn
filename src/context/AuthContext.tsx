import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type {User} from 'firebase/auth';
import {firebaseReady} from '../config/firebase';
import {
  fetchEmployeeProfile,
  loginEmployee,
  logoutEmployee,
  mapAuthError,
  subscribeToAuth,
} from '../services/authService';
import {isExpired} from '../../shared/dates';
import type {Employee} from '../../shared/types';

type AuthContextValue = {
  initializing: boolean;
  user: User | null;
  employee: Employee | null;
  login: (
    username: string,
    password: string,
    accessCode: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshEmployee: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({children}: {children: React.ReactNode}) {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    if (!firebaseReady) {
      setInitializing(false);
      return;
    }

    const unsubscribe = subscribeToAuth(async nextUser => {
      try {
        if (!nextUser) {
          setUser(null);
          setEmployee(null);
          return;
        }
        const profile = await fetchEmployeeProfile(nextUser.uid);
        if (isExpired(profile.codeExpiry)) {
          await logoutEmployee();
          setUser(null);
          setEmployee(null);
          return;
        }
        setUser(nextUser);
        setEmployee(profile);
      } catch {
        await logoutEmployee().catch(() => undefined);
        setUser(null);
        setEmployee(null);
      } finally {
        setInitializing(false);
      }
    });

    return unsubscribe;
  }, []);

  const login = useCallback(
    async (username: string, password: string, accessCode: string) => {
      try {
        const profile = await loginEmployee(username, password, accessCode);
        setEmployee(profile);
      } catch (error) {
        throw new Error(mapAuthError(error));
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    await logoutEmployee();
    setUser(null);
    setEmployee(null);
  }, []);

  const refreshEmployee = useCallback(async () => {
    if (!user) {
      return;
    }
    const profile = await fetchEmployeeProfile(user.uid);
    setEmployee(profile);
  }, [user]);

  const value = useMemo(
    () => ({initializing, user, employee, login, logout, refreshEmployee}),
    [initializing, user, employee, login, logout, refreshEmployee],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
