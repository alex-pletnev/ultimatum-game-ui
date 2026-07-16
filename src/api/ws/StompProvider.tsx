import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { StompContext } from './stomp-context';
import { createStompClient, type StompError } from './stomp-client';
import { authStorage, useAccessToken } from '../auth-storage';

/*
 * Provider для STOMP-клиента. Соединение поднимается синхронно с наличием
 * access-токена и опускается при logout'е. `connected` — реактивный флаг:
 * `client.connected` из stompjs — mutable prop, React о нём не знает, поэтому
 * держим отдельный `useState` и обновляем через onConnect/onDisconnect handlers.
 */
export function StompProvider({ children }: { children: ReactNode }) {
  const token = useAccessToken();
  const [connected, setConnected] = useState(false);

  const client = useMemo(() => {
    if (token === null) return null;
    return createStompClient(token, {
      onError: (err: StompError) => {
        console.warn('[stomp] error:', err);
        // Backend отклонил CONNECT (обычно expired JWT). Очищаем storage —
        // useMemo пересоздаст client'а как null, reconnect-loop прекратится.
        if (err.status === 401 || err.status === 403) {
          authStorage.clear();
        }
      },
      onConnect: () => setConnected(true),
      onDisconnect: () => setConnected(false),
    });
  }, [token]);

  useEffect(() => {
    if (client === null) {
      setConnected(false);
      return;
    }
    client.activate();
    return () => {
      setConnected(false);
      void client.deactivate();
    };
  }, [client]);

  return (
    <StompContext.Provider value={{ client, connected }}>{children}</StompContext.Provider>
  );
}
