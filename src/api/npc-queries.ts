import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './client';
import { useAccessToken } from './auth-storage';
import { sessionKeys } from './session-queries';
import type {
  BulkNpcsRequest,
  BulkNpcsResponse,
  CreateNpcRequest,
  JoinNpcRequest,
  NpcProfileResponse,
  SessionWithTeamsAndMembersResponse,
} from './types';

export const npcKeys = {
  all: ['npc'] as const,
  list: ['npc', 'list'] as const,
};

/** GET /npc — только для ADMIN'а; без токена запрос не отправляем. */
export function useNpcList() {
  const token = useAccessToken();
  return useQuery({
    queryKey: npcKeys.list,
    queryFn: () => apiFetch<NpcProfileResponse[]>('/npc'),
    enabled: token !== null,
    staleTime: 15_000,
  });
}

export function useCreateNpc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateNpcRequest) =>
      apiFetch<NpcProfileResponse>('/npc', { method: 'POST', body }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: npcKeys.list });
    },
  });
}

export function useDeleteNpc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (npcId: string) =>
      apiFetch<void>(`/npc/${encodeURIComponent(npcId)}`, { method: 'DELETE' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: npcKeys.list });
    },
  });
}

/** POST /session/{id}/join-npc — приаттачить существующего NPC. */
export function useJoinNpc(sessionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: JoinNpcRequest) =>
      apiFetch<SessionWithTeamsAndMembersResponse>(
        `/session/${encodeURIComponent(sessionId)}/join-npc`,
        { method: 'POST', body },
      ),
    onSuccess: (data) => {
      qc.setQueryData(sessionKeys.details(data.id), data);
    },
  });
}

/** POST /session/{id}/npcs — bulk-создать и сразу приаттачить. */
export function useBulkAttachNpcs(sessionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: BulkNpcsRequest) =>
      apiFetch<BulkNpcsResponse>(
        `/session/${encodeURIComponent(sessionId)}/npcs`,
        { method: 'POST', body },
      ),
    onSuccess: (data) => {
      qc.setQueryData(sessionKeys.details(data.session.id), data.session);
      void qc.invalidateQueries({ queryKey: npcKeys.list });
    },
  });
}
