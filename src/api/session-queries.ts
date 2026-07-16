import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './client';
import { useAccessToken } from './auth-storage';
import type {
  CreateSessionRequest,
  Page,
  RoundResponse,
  SessionResponse,
  SessionScoreDto,
  SessionWithTeamsAndMembersResponse,
} from './types';

export const sessionKeys = {
  all: ['session'] as const,
  openLobby: (page: number, size: number) =>
    ['session', 'open-lobby', page, size] as const,
  openLobbyAll: ['session', 'open-lobby'] as const,
  details: (id: string) => ['session', 'details', id] as const,
  currentRound: (id: string) => ['session', 'current-round', id] as const,
  score: (id: string) => ['session', 'score', id] as const,
};

/**
 * Открытые для присоединения партии: state=CREATED + openToConnect=true.
 * FINISHED и ABORTED — не показываем; они не годятся для «афиши».
 * Page-параметры соответствуют Spring Data (page 0-based).
 */
export function useOpenSessions(page = 0, size = 8) {
  const token = useAccessToken();
  return useQuery({
    queryKey: sessionKeys.openLobby(page, size),
    queryFn: () =>
      apiFetch<Page<SessionResponse>>(
        `/session?openToConnect=true&state=CREATED&page=${page}&pageSize=${size}`,
      ),
    enabled: token !== null,
    // Лобби живое — обновляем чаще обычного.
    staleTime: 10_000,
    refetchOnMount: 'always',
  });
}

/** Учреждение партии — только для ADMIN. Backend возвращает SessionWithTeamsAndMembersResponse. */
export function useCreateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateSessionRequest) =>
      apiFetch<SessionResponse>('/session', { method: 'POST', body }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: sessionKeys.openLobbyAll });
    },
  });
}

/**
 * Присоединиться к партии как player (для TEAM_BATTLE — с teamId).
 * Backend: POST /session/{id}/join[?teamId=<uuid>]
 */
export function useJoinSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, teamId }: { sessionId: string; teamId?: string }) => {
      const qs = teamId !== undefined ? `?teamId=${encodeURIComponent(teamId)}` : '';
      return apiFetch<SessionWithTeamsAndMembersResponse>(
        `/session/${encodeURIComponent(sessionId)}/join${qs}`,
        { method: 'POST' },
      );
    },
    onSuccess: (data) => {
      qc.setQueryData(sessionKeys.details(data.id), data);
      void qc.invalidateQueries({ queryKey: sessionKeys.openLobbyAll });
    },
  });
}

/**
 * Детали партии — для экрана /session/:id + для публичной /stats.
 * Не блокируем `enabled` токеном: backend отдаёт `with-teams-and-members`
 * анонимно для read-only просмотра (см. BACKEND-FIX-public-stats-endpoint.md).
 * Для гейплей-экрана авторизация проверяется отдельно (Navigate в Session).
 */
export function useSessionDetails(id: string | undefined) {
  return useQuery({
    queryKey: sessionKeys.details(id ?? ''),
    queryFn: () =>
      apiFetch<SessionWithTeamsAndMembersResponse>(
        `/session/${encodeURIComponent(id ?? '')}/with-teams-and-members`,
        // withAuth: false, чтобы stale-токен в localStorage не давал 403
        // (endpoint публичный — см. BACKEND-FIX-public-stats-endpoint.md).
        { withAuth: false },
      ),
    enabled: id !== undefined && id.length > 0,
    staleTime: 5_000,
  });
}

/**
 * Кумулятивный счёт сессии. Данные приходят только через WS
 * (`/topic/session/{id}/scoreUpdated`); REST-endpoint'а нет — если
 * mount произошёл до первого `scoreUpdated`, `data` будет undefined.
 * MVP-компромисс: refresh страницы посреди партии обнуляет счёт.
 */
export function useSessionScore(id: string | undefined) {
  const token = useAccessToken();
  return useQuery<SessionScoreDto | undefined>({
    queryKey: sessionKeys.score(id ?? ''),
    queryFn: () => Promise.resolve(undefined),
    enabled: token !== null && id !== undefined && id.length > 0,
    staleTime: Infinity,
  });
}

/**
 * Текущий раунд — включает `myRole` и `myPendingActions` для authenticated user'а.
 * Enabled только если сессия существует и в state RUNNING (проверяет вызывающий).
 */
export function useCurrentRound(id: string | undefined, enabled = true) {
  const token = useAccessToken();
  return useQuery({
    queryKey: sessionKeys.currentRound(id ?? ''),
    queryFn: () =>
      apiFetch<RoundResponse>(
        `/session/${encodeURIComponent(id ?? '')}/current-round`,
      ),
    enabled: enabled && token !== null && id !== undefined && id.length > 0,
    staleTime: 5_000,
  });
}
