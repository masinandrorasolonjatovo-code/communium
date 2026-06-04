'use client';

import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { AppTheme, THEME_STORAGE_KEY } from '@/components/theme-config';

interface ThemeContextValue {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    if (typeof document !== 'undefined') {
      const rootTheme = document.documentElement.dataset.theme;
      if (rootTheme === 'dark' || rootTheme === 'light') {
        return rootTheme;
      }
    }

    return 'light';
  });

  useEffect(() => {
    function handleNativeThemeChange(event: Event) {
      const nextTheme = (event as CustomEvent<AppTheme>).detail;
      if (nextTheme === 'dark' || nextTheme === 'light') {
        setThemeState(nextTheme);
      }
    }

    window.addEventListener('communium-theme-change', handleNativeThemeChange);

    const rootTheme = document.documentElement.dataset.theme;

    if (rootTheme === 'dark' || rootTheme === 'light') {
      setThemeState(rootTheme);
      document.documentElement.style.colorScheme = rootTheme;
      return () => {
        window.removeEventListener('communium-theme-change', handleNativeThemeChange);
      };
    }

    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    const nextTheme =
      storedTheme === 'dark' || storedTheme === 'light'
        ? storedTheme
        : window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';

    applyTheme(nextTheme);

    return () => {
      window.removeEventListener('communium-theme-change', handleNativeThemeChange);
    };
  }, []);

  function applyTheme(nextTheme: AppTheme) {
    setThemeState(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.style.colorScheme = nextTheme;
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  }

  function setTheme(nextTheme: AppTheme) {
    applyTheme(nextTheme);
  }

  function toggleTheme() {
    applyTheme(theme === 'dark' ? 'light' : 'dark');
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }

  return context;
}
