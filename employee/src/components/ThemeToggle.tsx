import {useCallback, useEffect, useState} from 'react';
import {Moon, Sun} from 'lucide-react';
import {applyTheme, initialTheme, storedTheme, systemTheme, type Theme} from '../lib/theme';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => initialTheme());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    function onChange() {
      if (!storedTheme()) {
        setTheme(systemTheme());
      }
    }
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const toggle = useCallback(() => {
    setTheme(current => (current === 'dark' ? 'light' : 'dark'));
  }, []);

  return {theme, toggle};
}

export function ThemeToggle({className = ''}: {className?: string}) {
  const {theme, toggle} = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggle}
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white ${className}`}>
      <Sun
        className={`absolute h-[18px] w-[18px] transition-all duration-300 ${
          isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
        }`}
      />
      <Moon
        className={`absolute h-[18px] w-[18px] transition-all duration-300 ${
          isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
        }`}
      />
    </button>
  );
}
