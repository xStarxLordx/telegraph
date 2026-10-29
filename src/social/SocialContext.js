import { createContext, useContext } from 'react';

/**
 * @type {import('react').Context<{ followVersion: number,
 *   follow: (userId: string) => Promise<void> }|null>}
 */
export const SocialContext = createContext(null);

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
