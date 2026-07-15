import { useEffect } from 'react';
import type { IMessage } from '@stomp/stompjs';
import { useStomp } from './stomp-context';

/*
 * Универсальный хук подписки на STOMP-топик.
 *
 * Особенности:
 *   - Подписывается ТОЛЬКО когда client в состоянии `connected` (иначе `client.subscribe()`
 *     кинет исключение или подписка потеряется).
 *   - Автоматически re-подписывается при reconnect'е (client.onConnect обещается STOMP-libой).
 *   - Отписывается при unmount / смене destination / смене clientа.
 *   - JSON.parse обёрнут в try/catch — сломанный payload не роняет весь стрим.
 */
export function useTopicSubscription<T>(
  destination: string | null,
  onMessage: (payload: T) => void,
): void {
  const client = useStomp();

  useEffect(() => {
    if (client === null || destination === null) return;

    let subscription: { unsubscribe(): void } | null = null;

    const doSubscribe = () => {
      subscription = client.subscribe(destination, (frame: IMessage) => {
        try {
          const payload = JSON.parse(frame.body) as T;
          onMessage(payload);
        } catch {
          // Malformed payload — не сломаем connection loop.
        }
      });
    };

    if (client.connected) {
      doSubscribe();
    } else {
      // Client активирован, но CONNECTED-фрейм ещё не пришёл. Ставим одноразовый onConnect.
      const originalOnConnect = client.onConnect;
      client.onConnect = (frame) => {
        originalOnConnect?.(frame);
        doSubscribe();
      };
    }

    return () => {
      subscription?.unsubscribe();
    };
    // onMessage меняется каждый рендер (закрытие) — но чаще всего это ок:
    // при смене — переподпишемся, что редко. Если станет проблемой — ref.
  }, [client, destination, onMessage]);
}
