import {Navigate, Route, Routes} from 'react-router-dom';
import {Loader2} from 'lucide-react';
import {useAuth} from './context/AuthContext';
import {Layout} from './components/Layout';
import {Logo} from './components/Logo';
import {LoginPage} from './pages/LoginPage';
import {CheckInPage} from './pages/CheckInPage';
import {HistoryPage} from './pages/HistoryPage';
import {ProfilePage} from './pages/ProfilePage';
import {AttendancePage} from './pages/AttendancePage';
import {ReportPage} from './pages/ReportPage';
import {SettingsPage} from './pages/SettingsPage';

export default function App() {
  const {initializing, employee} = useAuth();

  if (initializing) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-brand-900 px-6 text-white">
        <Logo variant="light" className="h-11 w-auto" />
        <p className="flex items-center gap-2 text-sm text-white/70">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading CheckIn360…
        </p>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={employee ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/" element={employee ? <Layout /> : <Navigate to="/login" replace />}>
        <Route index element={<CheckInPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="report" element={<ReportPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}
