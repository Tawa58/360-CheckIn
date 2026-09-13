import React from 'react';
import {Pressable} from 'react-native';
import {Moon, Sun} from 'lucide-react-native';
import {useTheme} from '../context/ThemeContext';

export function ThemeToggle({lightOnDark}: {lightOnDark?: boolean}) {
  const {theme, toggle} = useTheme();
  const isDark = theme === 'dark';
  const icon = lightOnDark ? '#FFFFFF' : isDark ? '#E2E8F0' : '#0F4C5C';

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{checked: isDark}}
      accessibilityLabel={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onPress={toggle}
      className={`h-10 w-10 items-center justify-center rounded-xl border ${
        lightOnDark
          ? 'border-white/25 bg-white/10'
          : 'border-ink-200 bg-white dark:border-slate-700 dark:bg-slate-800'
      }`}>
      {isDark ? <Moon size={18} color={icon} /> : <Sun size={18} color={icon} />}
    </Pressable>
  );
}
