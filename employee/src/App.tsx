import {Navigate, Route, Routes} from 'react-router-dom';
import {useAuth} from './context/AuthContext';
import {Layout} from './components/Layout';
import {BrandLoader} from './components/BrandLoader';
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
      <div className="min-h-dvh bg-brand-900">
        <BrandLoader label="Loading CheckIn360…" />
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
