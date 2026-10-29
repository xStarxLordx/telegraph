import { useCallback } from 'react';
import { useServices } from '../services/ServicesContext';
import useAsyncAction from './useAsyncAction';

/** Logs out; the route guards then show /login (see src/routes/guards.jsx). */
export default function useLogout() {
  const { authService } = useServices();
  const logout = useCallback(() => authService.logout(), [authService]);
  return useAsyncAction(logout);
}
