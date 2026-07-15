import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { sessionKeys } from '../session-queries';
import { useTopicSubscription } from './useTopicSubscription';
import { useStompConnected } from './stomp-context';
import type {
  RoundResponse,
  SessionWithTeamsAndMembersResponse,
} from '../types';

/**
 * Подписывается на sessionStatus и roundStatus для сессии и обновляет react-query cache.
 * Возвращает `connected` — bool живого STOMP-соединения (для UI-индикатора).
 *
 * Nota bene: WS-broadcast RoundResponse приходит с `myRole=NONE, myPendingActions=[]`
 * (см. docs/07-types.md §4.4). Если UI нужны настоящие персональные hints — вызывать
 * `useCurrentRound()` дополнительно; тот получит их из REST-контекста.
 */
export function useSessionLiveSync(id: string | undefined): { connected: boolean } {
  const qc = useQueryClient();
  const connected = useStompConnected();

  const onSessionStatus = useCallback(
    (payload: SessionWithTeamsAndMembersResponse) => {
      if (id === undefined) return;
      qc.setQueryData(sessionKeys.details(id), payload);
      // При переходе в RUNNING — invalidate currentRound (до старта GET возвращал 404;
      // react-query cache 404 до пометки stale). Гарантирует свежий fetch раунда.
      if (payload.state === 'RUNNING') {
        void qc.invalidateQueries({ queryKey: sessionKeys.currentRound(id) });
      }
    },
    [qc, id],
  );

  const onRoundStatus = useCallback(
    (payload: RoundResponse) => {
      if (id === undefined) return;
      // Не перезаписываем myRole/myPendingActions из broadcast'а (там NONE/[]).
      qc.setQueryData<RoundResponse | undefined>(sessionKeys.currentRound(id), (prev) => ({
        ...payload,
        myRole: prev?.myRole ?? payload.myRole,
        myPendingActions: prev?.myPendingActions ?? payload.myPendingActions,
      }));
      // При смене фазы — invalidate details тоже (session.state мог поменяться).
      void qc.invalidateQueries({ queryKey: sessionKeys.details(id) });
    },
    [qc, id],
  );

  const dest = id !== undefined && id.length > 0 ? id : null;

  useTopicSubscription<SessionWithTeamsAndMembersResponse>(
    dest !== null ? `/topic/session/${dest}/sessionStatus` : null,
    onSessionStatus,
  );

  useTopicSubscription<RoundResponse>(
    dest !== null ? `/topic/session/${dest}/roundStatus` : null,
    onRoundStatus,
  );

  return { connected };
}
