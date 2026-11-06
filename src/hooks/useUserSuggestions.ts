import { useCallback } from 'react';
import { useCurrentUser } from '../auth/AuthContext';
import { SUGGESTION_COUNT } from '../domain/constants';
import { normalizeSearchTerm } from '../domain/search';
import type { AsyncDataState } from '../interfaces/hooks';
import type { User } from '../interfaces/user';
import { useServices } from '../services/ServicesContext';
import useAsyncData from './useAsyncData';

export default function useUserSuggestions(term: string, enabled: boolean): AsyncDataState<User[]> {
  const { userService, followService } = useServices();
  const me = useCurrentUser();
  const browsing = term.trim() === '';
  const wanted = browsing ? null : normalizeSearchTerm(term);

  const load = useCallback(async (): Promise<User[]> => {
    if (!enabled) return [];
    if (browsing) {
      const pool = (await userService.suggest()).filter((user) => user.id !== me.id);
      const status = await followService.getFollowingStatus(
        me.id,
        pool.map((user) => user.id),
      );
      return pool.filter((user) => !status[user.id]).slice(0, SUGGESTION_COUNT);
    }
    if (!wanted) return [];
    const { items } = await userService.search(term, { pageSize: SUGGESTION_COUNT });
    return items.filter((user) => user.id !== me.id);
  }, [enabled, browsing, wanted, term, userService, followService, me.id]);

  return useAsyncData(load);
}
