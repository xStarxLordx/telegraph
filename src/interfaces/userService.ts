import type { User } from './user';

export interface UserService {
  getUserById(id: string): Promise<User | null>;
  /** Case-insensitive, leading "@" optional. */
  getUserByUsername(username: string): Promise<User | null>;
  isUsernameAvailable(username: string): Promise<boolean>;
}
