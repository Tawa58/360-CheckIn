import {useEffect, useState} from 'react';
import {NavLink, Outlet, useLocation, useNavigate} from 'react-router-dom';
import {ClipboardList, FileBarChart, Home, Inbox, LayoutDashboard, LogOut, Menu, Settings, Users, X} from 'lucide-react';
import {logoutAdmin} from '../lib/adminAuth';
import {Logo, LogoMark} from './Logo';
import {ThemeToggle} from './ThemeToggle';

const links = [
  {to: '/', label: 'Overview', icon: LayoutDashboard, end: true},
  {to: '/employees', label: 'Employees', icon: Users, end: false},
  {to: '/attendance', label: 'Attendance', icon: ClipboardList, end: false},
  {to: '/reports', label: 'Reports', icon: FileBarChart, end: false},
  {to: '/messages', label: 'Inbox', icon: Inbox, end: false},
];

const drawerLinks = [
  {to: '/', label: 'Home', icon: Home, end: true},
  {to: '/employees', label: 'Employees', icon: Users, end: false},
  {to: '/attendance', label: 'Attendance', icon: ClipboardList, end: false},
  {to: '/reports', label: 'Reports', icon: FileBarChart, end: false},
  {to: '/messages', label: 'Inbox', icon: Inbox, end: false},
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
    await logoutAdmin();
    navigate('/login');
  }

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-950 lg:grid lg:grid-cols-[272px_1fr]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:flex">
        <div className="px-6 py-7">
          <Logo variant="auto" className="h-10 w-auto" />
        </div>

        <nav className="flex-1 space-y-1 px-4">
          {links.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({isActive}) => navClass(isActive)}>
              <link.icon className="h-[18px] w-[18px]" />
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 pb-6">
          <button
            type="button"
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800">
            <LogOut className="h-[18px] w-[18px]" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/85">
          <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-10">
            {/* Hidden on the wrapper: `dark:block` on the image itself would
                out-specify `lg:hidden` and duplicate the sidebar logo. */}
            <div className="lg:hidden">
              <Logo variant="auto" className="h-9 w-auto" />
            </div>
            <div className="ml-auto flex items-center gap-2">
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

        <main className="min-w-0 flex-1 px-4 pb-28 pt-5 sm:px-6 sm:pt-7 lg:px-10 lg:pb-12 lg:pt-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom tabs */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/80 bg-white/90 pb-safe backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90 lg:hidden">
        <div className="grid grid-cols-5">
          {links.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
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
                    <link.icon className="h-[18px] w-[18px]" />
                  </span>
                  {link.label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Mobile drawer */}
      {drawerOpen ? (
        <div
          className="fixed inset-0 z-50 animate-fade-in bg-slate-950/50 backdrop-blur-sm"
          onMouseDown={event => {
            if (event.target === event.currentTarget) {
              setDrawerOpen(false);
            }
          }}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="ml-auto flex h-dvh w-[49%] max-w-[12rem] animate-drawer-in flex-col bg-white shadow-float dark:bg-slate-900">
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

            <nav className="flex-1 space-y-1 p-3">
              {drawerLinks.map(link => (
                <NavLink
                  key={`${link.label}-${link.to}`}
                  to={link.to}
                  end={link.end}
                  className={({isActive}) => navClass(isActive)}>
                  <link.icon className="h-[18px] w-[18px]" />
                  {link.label}
                </NavLink>
              ))}
            </nav>

            <div className="border-t border-slate-100 p-4 pb-safe dark:border-slate-800">
              <button type="button" onClick={signOut} className="btn-outline w-full">
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
