import { useEffect, useMemo, type ReactNode } from 'react';
import { StompContext } from './stomp-context';
import { createStompClient, type StompError } from './stomp-client';
import { useAccessToken } from '../auth-storage';

/*
 * Provider для STOMP-клиента. Соединение поднимается синхронно с наличием
 * access-токена и опускается при logout'е. Ошибки backend'а из /user/queue/errors
 * пробрасываются в консоль (в MVP), позже — в toast'ы / глобальный store.
 */
export function StompProvider({ children }: { children: ReactNode }) {
  const token = useAccessToken();

  const client = useMemo(() => {
    if (token === null) return null;
    return createStompClient(token, {
      onError: (err: StompError) => {
        console.warn('[stomp] error:', err);
      },
    });
  }, [token]);

  useEffect(() => {
    if (client === null) return;
    client.activate();
    return () => {
      void client.deactivate();
    };
  }, [client]);

  return <StompContext.Provider value={{ client }}>{children}</StompContext.Provider>;
}
