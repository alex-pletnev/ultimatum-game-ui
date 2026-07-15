import { Client, type IMessage } from '@stomp/stompjs';
import { config } from '../config';
import type { ApiErrorResponse } from '../types';

/*
 * Фабрика STOMP-клиента для backend'а ultimatum-game.
 *
 * Особенности:
 *   - JWT прокидывается в CONNECT-фрейме как `Authorization: Bearer <token>`.
 *   - При успешном CONNECT автоматически подписываемся на /user/queue/errors —
 *     иначе SEND-ошибки будут молчать (см. docs/05-api.md → раздел 6.3).
 *   - reconnectDelay: 5000ms — стандартный компромисс, без экспоненциального backoff'а.
 */

export type StompError = ApiErrorResponse;

export function createStompClient(
  accessToken: string,
  handlers: {
    onError?: (err: StompError) => void;
    onConnect?: () => void;
    onDisconnect?: () => void;
  } = {},
): Client {
  const client = new Client({
    brokerURL: config.wsUrl,
    connectHeaders: { Authorization: `Bearer ${accessToken}` },
    reconnectDelay: 5000,
    onConnect: () => {
      client.subscribe('/user/queue/errors', (frame: IMessage) => {
        try {
          const err = JSON.parse(frame.body) as StompError;
          handlers.onError?.(err);
        } catch {
          // Malformed error frame — игнорируем, чтобы не сломать connection loop.
        }
      });
      handlers.onConnect?.();
    },
    onDisconnect: () => {
      handlers.onDisconnect?.();
    },
    onStompError: (frame) => {
      // ERROR-фрейм (обычно — плохой JWT в CONNECT). Пробрасываем в onError.
      handlers.onError?.({
        timestamp: new Date().toISOString(),
        status: 401,
        error: frame.headers['message'] ?? 'STOMP error',
        message: frame.body || 'STOMP connection error',
        path: 'stomp',
      });
    },
  });
  return client;
}
