import { Client, type IMessage } from '@stomp/stompjs';
import { authStorage } from '../auth-storage';
import { refreshAccessToken } from '../client';
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
    onWebSocketClose: () => handlers.onDisconnect?.(),
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
  client.beforeConnect = async () => {
    let token = authStorage.getAccess();
    if (!token) {
      void client.deactivate();
      return;
    }
    try {
      const payload = JSON.parse(
        atob(token.split('.')[1]!.replace(/-/g, '+').replace(/_/g, '/')),
      ) as { exp?: number };
      if (payload.exp && payload.exp * 1000 < Date.now() + 60_000) {
        token = await refreshAccessToken();
      }
    } catch {
      // A temporary refresh failure keeps credentials; reconnect will retry.
    }
    if (token) client.connectHeaders = { Authorization: `Bearer ${token}` };
    else void client.deactivate();
  };
  return client;
}
