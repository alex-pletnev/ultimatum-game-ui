import { createContext, useContext } from 'react';
import type { Client } from '@stomp/stompjs';

export type StompContextValue = {
  client: Client | null;
};

export const StompContext = createContext<StompContextValue>({ client: null });

/** Возвращает активный STOMP Client или null (если пользователь не залогинен). */
export function useStomp(): Client | null {
  return useContext(StompContext).client;
}
