/*
 * Хранилище JWT'ов в localStorage + типизированный доступ + подписка для React.
 *
 * Почему localStorage:
 *   - Backend ожидает Bearer в HTTP-заголовке и в STOMP CONNECT-фрейме — httpOnly-cookie
 *     туда прокинуть нельзя.
 *   - XSS-минимизация — задача общего уровня (CSP, никакого dangerouslySetInnerHTML).
 *
 * Cross-tab sync — через 'storage'-событие window.
 */

import { useSyncExternalStore } from 'react';

const ACCESS_KEY = 'ug:accessToken';
const REFRESH_KEY = 'ug:refreshToken';

type Listener = () => void;
const listeners = new Set<Listener>();

function notify(): void {
  for (const l of listeners) l();
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === ACCESS_KEY || event.key === REFRESH_KEY) notify();
  });
}

export const authStorage = {
  getAccess(): string | null {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(ACCESS_KEY) : null;
  },
  getRefresh(): string | null {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(REFRESH_KEY) : null;
  },
  setTokens(accessToken: string, refreshToken: string | null): void {
    localStorage.setItem(ACCESS_KEY, accessToken);
    if (refreshToken !== null) localStorage.setItem(REFRESH_KEY, refreshToken);
    notify();
  },
  clear(): void {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    notify();
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

/** React-хук: реактивно возвращает access-токен (или null), включая cross-tab обновления. */
export function useAccessToken(): string | null {
  return useSyncExternalStore(
    authStorage.subscribe,
    () => authStorage.getAccess(),
    () => null,
  );
}
