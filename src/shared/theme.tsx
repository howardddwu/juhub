import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Theme = 'auto' | 'light' | 'dark';

const THEME_KEY = 'farely.theme';
const ORDER: Theme[] = ['auto', 'light', 'dark'];

interface ThemeCtx {
  theme: Theme;
  cycleTheme: () => void;
}

const ThemeContext = createContext<ThemeCtx>({ theme: 'auto', cycleTheme: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem(THEME_KEY);
    return saved === 'light' || saved === 'dark' ? saved : 'auto';
  });

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
    const media = matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'auto' && media.matches);
      document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [theme]);

  const cycleTheme = () => setTheme((prev) => ORDER[(ORDER.indexOf(prev) + 1) % ORDER.length]);
  return <ThemeContext.Provider value={{ theme, cycleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeCtx {
  return useContext(ThemeContext);
}
