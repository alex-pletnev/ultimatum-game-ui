import { useCallback } from 'react';
import { useStomp } from './stomp-context';

/**
 * Хук для отправки STOMP-команд.
 * Возвращает `send(destination, body?)`:
 *   - `body` object → JSON.stringify
 *   - `body` undefined → пустая строка (для fire-and-forget-команд типа /start)
 *
 * Throws при отсутствии connected client'а — вызывающий должен убедиться в подключении
 * (обычно — проверка `useSessionLiveSync().connected`).
 */
export function useStompSend(): (destination: string, body?: unknown) => void {
  const client = useStomp();
  return useCallback(
    (destination: string, body?: unknown) => {
      if (client === null || !client.connected) {
        throw new Error(`STOMP не подключен — cannot send to ${destination}`);
      }
      const payload =
        body === undefined
          ? ''
          : typeof body === 'string'
            ? body
            : JSON.stringify(body);
      client.publish({ destination, body: payload });
    },
    [client],
  );
}
