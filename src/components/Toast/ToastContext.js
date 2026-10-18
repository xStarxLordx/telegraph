import { createContext, useContext } from 'react';

/** @type {import('react').Context<{ showToast: (message: string) => void }|null>} */
export const ToastContext = createContext(null);

/** Returns `showToast(message)`: a short success message that survives navigation. */
export function useToast() {
  const value = useContext(ToastContext);
  if (!value) {
    throw new Error('useToast must be used inside <ToastProvider>.');
  }
  return value;
}
