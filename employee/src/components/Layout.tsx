import {useEffect, useState} from 'react';
import {NavLink, Outlet, useLocation, useNavigate} from 'react-router-dom';
import {
  CalendarCheck,
  ClipboardList,
  Clock3,
  LogOut,
  Menu,
  MessageSquarePlus,
  Settings,
  UserRound,
  X,
} from 'lucide-react';
import {useAuth} from '../context/AuthContext';
import {Avatar} from './Avatar';
import {Logo, LogoMark} from './Logo';
import {ThemeToggle} from './ThemeToggle';

const tabs = [
  {to: '/', label: 'Check in', icon: CalendarCheck, end: true},
  {to: '/history', label: 'History', icon: Clock3, end: false},
  {to: '/profile', label: 'Profile', icon: UserRound, end: false},
];

const drawerLinks = [
  {to: '/attendance', label: 'Attendance report', icon: ClipboardList, end: false},
  {to: '/report', label: 'Send a report', icon: MessageSquarePlus, end: false},
  {to: '/settings', label: 'Settings', icon: Settings, end: false},
];

function navClass(isActive: boolean) {
  return `flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-medium transition ${
    isActive
      ? 'bg-brand-50 text-brand-800 dark:bg-brand-500/15 dark:text-brand-200'
      : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
  }`;
}

export function Layout() {
  const navigate = useNavigate();
  const {pathname} = useLocation();
  const {employee, logout} = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!drawerOpen) {
      return;
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setDrawerOpen(false);
      }
    }
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [drawerOpen]);

  async function signOut() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/85">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            {employee ? (
              <NavLink to="/profile" aria-label="Open profile" className="shrink-0">
                <Avatar name={employee.fullName} photoUrl={employee.photoUrl} size="sm" />
              </NavLink>
            ) : null}
            <Logo variant="auto" className="h-9 w-auto" />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              aria-expanded={drawerOpen}
              className="icon-button">
              <Menu className="h-[18px] w-[18px]" />
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto min-w-0 max-w-lg px-4 pb-28 pt-5 sm:pt-7">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/80 bg-white/90 pb-safe backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mx-auto grid max-w-lg grid-cols-3">
          {tabs.map(tab => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({isActive}) =>
                `flex min-h-[58px] flex-col items-center justify-center gap-1 px-2 pt-2 text-[11px] font-medium transition ${
                  isActive
                    ? 'text-brand-800 dark:text-brand-300'
                    : 'text-slate-400 dark:text-slate-500'
                }`
              }>
              {({isActive}) => (
                <>
                  <span
                    className={`flex h-8 w-14 items-center justify-center rounded-full transition ${
                      isActive ? 'bg-brand-50 dark:bg-brand-500/15' : 'bg-transparent'
                    }`}>
                    <tab.icon className="h-[18px] w-[18px]" />
                  </span>
                  {tab.label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {drawerOpen ? (
        <div
          className="fixed inset-y-0 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 animate-fade-in bg-slate-950/50 backdrop-blur-sm"
          onMouseDown={event => {
            if (event.target === event.currentTarget) {
              setDrawerOpen(false);
            }
          }}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="ml-auto flex h-dvh w-[72%] max-w-[17rem] animate-drawer-in flex-col bg-white shadow-float dark:bg-slate-900">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-3 py-3 dark:border-slate-800">
              <LogoMark className="h-8 w-auto" />
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close menu"
                className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            {employee ? (
              <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3.5 dark:border-slate-800">
                <Avatar name={employee.fullName} photoUrl={employee.photoUrl} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                    {employee.fullName}
                  </p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {employee.department}
                  </p>
                </div>
              </div>
            ) : null}

            <nav className="flex-1 space-y-1 p-3">
              {drawerLinks.map(link => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({isActive}) => navClass(isActive)}>
                  <link.icon className="h-[18px] w-[18px] shrink-0" />
                  {link.label}
                </NavLink>
              ))}
            </nav>

            <div className="border-t border-slate-100 p-4 pb-safe dark:border-slate-800">
              <button type="button" onClick={signOut} className="btn-outline w-full">
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
