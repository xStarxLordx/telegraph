// Values the React contexts share (each one has a `use…` hook that returns it).
import type { AuthStatus } from '../auth/AuthContext';
import type { ThemeName } from './theme';
import type { CurrentUser } from './user';

export type AuthStatusValue = (typeof AuthStatus)[keyof typeof AuthStatus];

export interface AuthContextValue {
  status: AuthStatusValue;
  user: CurrentUser | null;
  /** True after a logout in this tab, until someone logs in again. */
  signedOut: boolean;
}

export interface SocialContextValue {
  /** Changes after every follow: hooks that show follow data reload when it does. */
  followVersion: number;
  follow(userId: string): Promise<void>;
}

export interface ThemeContextValue {
  theme: ThemeName;
  toggleTheme(): void;
}

export interface ToastContextValue {
  /** A short success message that survives navigation. */
  showToast(message: string): void;
}
