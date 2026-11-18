import {useEffect, useState} from 'react';
import {Navigate, Route, Routes} from 'react-router-dom';
import type {User} from 'firebase/auth';
import {Layout} from './components/Layout';
import {BrandLoader} from './components/BrandLoader';
import {LoginPage} from './pages/LoginPage';
import {DashboardPage} from './pages/DashboardPage';
import {EmployeesPage} from './pages/EmployeesPage';
import {AttendancePage} from './pages/AttendancePage';
import {SettingsPage} from './pages/SettingsPage';
import {ReportsPage} from './pages/ReportsPage';
import {MessagesPage} from './pages/MessagesPage';
import {GetAppPage} from './pages/GetAppPage';
import {firebaseReady} from './lib/firebase';
import {ensureAdminProfile, logoutAdmin, subscribeToAdminAuth} from './lib/adminAuth';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(!firebaseReady);

  useEffect(() => {
    if (!firebaseReady) {
      setReady(true);
      return;
    }

    const timeout = window.setTimeout(() => setReady(true), 4000);

    try {
      const unsubscribe = subscribeToAdminAuth(async nextUser => {
        try {
          if (nextUser) {
            await ensureAdminProfile(nextUser);
            setUser(nextUser);
          } else {
            setUser(null);
          }
        } catch {
          await logoutAdmin().catch(() => undefined);
          setUser(null);
        } finally {
          window.clearTimeout(timeout);
          setReady(true);
        }
      });
      return () => {
        window.clearTimeout(timeout);
        unsubscribe();
      };
    } catch {
      window.clearTimeout(timeout);
      setReady(true);
      return undefined;
    }
  }, []);

  if (!ready) {
    return (
      <div className="min-h-dvh bg-brand-900">
        <BrandLoader label="Loading dashboard…" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/get-app" element={<GetAppPage />} />
      <Route
        path="/"
        element={user ? <Layout /> : <Navigate to="/login" replace />}>
        <Route index element={<DashboardPage />} />
        <Route path="employees" element={<EmployeesPage />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
    </Routes>
  );
}
