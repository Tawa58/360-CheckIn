import React, {createContext, useCallback, useContext, useEffect, useState} from 'react';
import {Appearance, StatusBar} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {colorScheme} from 'nativewind';
import {THEME_STORAGE_KEY, type Theme} from '../lib/theme';

type ThemeContextValue = {
  theme: Theme;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function systemTheme(): Theme {
  return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
}

export function ThemeProvider({children}: {children: React.ReactNode}) {
  const [theme, setTheme] = useState<Theme>(systemTheme);

  const apply = useCallback((next: Theme) => {
    setTheme(next);
    colorScheme.set(next);
    AsyncStorage.setItem(THEME_STORAGE_KEY, next).catch(() => undefined);
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then(value => {
        if (value === 'light' || value === 'dark') {
          apply(value);
          return;
        }
        colorScheme.set(systemTheme());
      })
      .catch(() => {
        colorScheme.set(systemTheme());
      });
  }, [apply]);

  const toggle = useCallback(() => {
    apply(theme === 'dark' ? 'light' : 'dark');
  }, [apply, theme]);

  return (
    <ThemeContext.Provider value={{theme, toggle}}>
      <StatusBar
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={theme === 'dark' ? '#020617' : '#0F4C5C'}
      />
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }
  return value;
}
