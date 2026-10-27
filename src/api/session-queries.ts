import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './client';
import { useAccessToken } from './auth-storage';
import type {
  CreateSessionRequest,
  NpcStrategy,
  SessionType,
  Page,
  RoundResponse,
  SessionResponse,
  SessionScoreDto,
  SessionWithTeamsAndMembersResponse,
} from './types';

export const sessionKeys = {
  all: ['session'] as const,
  openLobby: (page: number, size: number) => ['session', 'open-lobby', page, size] as const,
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
    refetchInterval: 10_000,
  });
}

/** Create a game owned by the current player. */
export function useCreateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateSessionRequest) =>
      apiFetch<SessionWithTeamsAndMembersResponse>('/session', { method: 'POST', body }),
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
      ),
    enabled: id !== undefined && id.length > 0,
    staleTime: 5_000,
    refetchInterval: 10_000,
  });
}

/** REST restores scores after refresh; WebSocket updates the same cache between requests. */
export function useSessionScore(id: string | undefined) {
  const token = useAccessToken();
  return useQuery<SessionScoreDto>({
    queryKey: sessionKeys.score(id ?? ''),
    queryFn: () => apiFetch<SessionScoreDto>(`/statistics/${encodeURIComponent(id ?? '')}/score`),
    enabled: token !== null && Boolean(id),
    staleTime: 5_000,
    refetchInterval: 10_000,
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
      apiFetch<RoundResponse>(`/session/${encodeURIComponent(id ?? '')}/current-round`),
    enabled: enabled && token !== null && id !== undefined && id.length > 0,
    staleTime: 5_000,
    refetchInterval: 10_000,
  });
}

export function useMySessions(page = 0) {
  const token = useAccessToken();
  return useQuery({
    queryKey: ['session', 'mine', page],
    queryFn: () => apiFetch<Page<SessionResponse>>(`/session/mine?page=${page}&pageSize=12`),
    enabled: token !== null,
    refetchOnMount: 'always',
  });
}

export function useSoloSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { strategy: NpcStrategy; sessionType: SessionType; numRounds: number }) =>
      apiFetch<SessionWithTeamsAndMembersResponse>('/session/solo', { method: 'POST', body }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: sessionKeys.all });
    },
  });
}

export function useRematch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<SessionWithTeamsAndMembersResponse>(`/session/${encodeURIComponent(id)}/rematch`, {
        method: 'POST',
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: sessionKeys.all });
    },
  });
}

export function useSetAutopilot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      sessionId,
      playerId,
      enabled,
    }: {
      sessionId: string;
      playerId: string;
      enabled: boolean;
    }) =>
      apiFetch<SessionWithTeamsAndMembersResponse>(
        `/session/${sessionId}/autopilot/${playerId}?enabled=${enabled}`,
        { method: 'POST' },
      ),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: sessionKeys.all });
    },
  });
}
