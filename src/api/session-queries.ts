import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './client';
import { useAccessToken } from './auth-storage';
import type { CreateSessionRequest, Page, SessionResponse } from './types';

export const sessionKeys = {
  all: ['session'] as const,
  openLobby: ['session', 'open-lobby'] as const,
};

/**
 * Открытые для присоединения партии: state=CREATED + openToConnect=true.
 * FINISHED и ABORTED — не показываем; они не годятся для «афиши».
 */
export function useOpenSessions() {
  const token = useAccessToken();
  return useQuery({
    queryKey: sessionKeys.openLobby,
    queryFn: () =>
      apiFetch<Page<SessionResponse>>(
        '/session?openToConnect=true&state=CREATED&page=0&pageSize=30',
      ),
    enabled: token !== null,
    // Лобби живое — обновляем чаще обычного.
    staleTime: 10_000,
  });
}

/** Учреждение партии — только для ADMIN. Backend возвращает SessionWithTeamsAndMembersResponse. */
export function useCreateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateSessionRequest) =>
      apiFetch<SessionResponse>('/session', { method: 'POST', body }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: sessionKeys.openLobby });
    },
  });
}
