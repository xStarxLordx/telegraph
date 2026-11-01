import { createContext, useContext } from 'react';
import type { ToastContextValue } from '../../interfaces/contexts';

export const ToastContext = createContext<ToastContextValue | null>(null);

/** Returns `showToast(message)`: a short success message that survives navigation. */
export function useToast() {
  const value = useContext(ToastContext);
  if (!value) {
    throw new Error('useToast must be used inside <ToastProvider>.');
  }
  return value;
}
