import { createContext, useContext } from 'react';
import type { SocialContextValue } from '../interfaces/contexts';

export const SocialContext = createContext<SocialContextValue | null>(null);

/**
 * Returns `follow(userId)` and `followVersion`, a number that changes after every follow.
 * Hooks that show follow data (counters, Follow buttons) reload when it changes, so the whole
 * screen stays consistent without a page reload.
 */
export function useSocial() {
  const value = useContext(SocialContext);
  if (!value) {
    throw new Error('useSocial must be used inside <SocialProvider>.');
  }
  return value;
}
