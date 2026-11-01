import { createContext, useContext } from 'react';
import type { ThemeContextValue } from '../interfaces/contexts';

export const ThemeContext = createContext<ThemeContextValue | null>(null);

/** Returns the active theme (`dark` | `light`) and `toggleTheme`, from <ThemeProvider>. */
export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error('useTheme must be used inside <ThemeProvider>.');
  }
  return value;
}
