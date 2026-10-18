import { createContext, useContext } from 'react';

/** @type {import('react').Context<{ theme: string, toggleTheme: () => void }|null>} */
export const ThemeContext = createContext(null);

/** Returns the active theme (`dark` | `light`) and `toggleTheme`, from <ThemeProvider>. */
export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error('useTheme must be used inside <ThemeProvider>.');
  }
  return value;
}
