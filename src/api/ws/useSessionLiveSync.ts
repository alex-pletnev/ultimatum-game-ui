import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { sessionKeys } from '../session-queries';
import { useTopicSubscription } from './useTopicSubscription';
import { useStompConnected } from './stomp-context';
import type {
  DecisionMadeResponse,
  OfferCreatedResponse,
  OffersShuffledResponse,
  RoundResponse,
  SessionScoreDto,
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

  const onRoundStatus = useCallback(() => {
    if (id === undefined) return;
    // WS-payload содержит myRole=NONE и myPendingActions=[] — эти поля нужны UI'ю
    // персонально, поэтому инвалидируем и триггерим REST-refetch вместо setQueryData.
    // Плюс — session.state мог поменяться, инвалидируем details тоже.
    void qc.invalidateQueries({ queryKey: sessionKeys.currentRound(id) });
    void qc.invalidateQueries({ queryKey: sessionKeys.details(id) });
  }, [qc, id]);

  // Любое per-round событие (offerCreated / decisionMade / offersShuffled) —
  // инвалидируем currentRound, чтобы REST-refetch подтянул свежие
  // offers/decisions/myPendingActions/responder-shuffle.
  const invalidateRound = useCallback(() => {
    if (id === undefined) return;
    void qc.invalidateQueries({ queryKey: sessionKeys.currentRound(id) });
  }, [qc, id]);

  const dest = id !== undefined && id.length > 0 ? id : null;

  useTopicSubscription<SessionWithTeamsAndMembersResponse>(
    dest !== null ? `/topic/session/${dest}/sessionStatus` : null,
    onSessionStatus,
  );

  useTopicSubscription<RoundResponse>(
    dest !== null ? `/topic/session/${dest}/roundStatus` : null,
    onRoundStatus,
  );

  useTopicSubscription<OfferCreatedResponse>(
    dest !== null ? `/topic/session/${dest}/offerCreated` : null,
    invalidateRound,
  );

  useTopicSubscription<OffersShuffledResponse>(
    dest !== null ? `/topic/session/${dest}/offersShuffled` : null,
    invalidateRound,
  );

  useTopicSubscription<DecisionMadeResponse>(
    dest !== null ? `/topic/session/${dest}/decisionMade` : null,
    invalidateRound,
  );

  // Кумулятивный счёт после закрытия раунда — кладём напрямую в cache;
  // REST-fallback'а нет, поэтому setQueryData — единственный источник.
  const onScoreUpdated = useCallback(
    (payload: SessionScoreDto) => {
      if (id === undefined) return;
      qc.setQueryData(sessionKeys.score(id), payload);
    },
    [qc, id],
  );

  useTopicSubscription<SessionScoreDto>(
    dest !== null ? `/topic/session/${dest}/scoreUpdated` : null,
    onScoreUpdated,
  );

  return { connected };
}
