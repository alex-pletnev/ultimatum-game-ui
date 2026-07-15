import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { sessionKeys } from '../session-queries';
import { useTopicSubscription } from './useTopicSubscription';
import { useStomp } from './stomp-context';
import type { SessionWithTeamsAndMembersResponse } from '../types';

/**
 * Подписывается на `/topic/session/{id}/sessionStatus` и обновляет react-query cache.
 * Возвращает `connected` — bool живого STOMP-соединения (для UI-индикатора).
 */
export function useSessionLiveSync(id: string | undefined): { connected: boolean } {
  const qc = useQueryClient();
  const client = useStomp();

  const onMessage = useCallback(
    (payload: SessionWithTeamsAndMembersResponse) => {
      if (id === undefined) return;
      qc.setQueryData(sessionKeys.details(id), payload);
    },
    [qc, id],
  );

  useTopicSubscription<SessionWithTeamsAndMembersResponse>(
    id !== undefined && id.length > 0 ? `/topic/session/${id}/sessionStatus` : null,
    onMessage,
  );

  return { connected: client?.connected ?? false };
}
