import { createContext, useContext } from 'react';
import type { Client } from '@stomp/stompjs';

export type StompContextValue = {
  client: Client | null;
  /**
   * Реактивный флаг подключения. `client.connected` из stompjs — mutable prop
   * и не триггерит re-render; провайдер держит отдельный useState и обновляет
   * его через onConnect/onDisconnect handlers.
   */
  connected: boolean;
};

export const StompContext = createContext<StompContextValue>({ client: null, connected: false });

/** Возвращает активный STOMP Client или null (если пользователь не залогинен). */
export function useStomp(): Client | null {
  return useContext(StompContext).client;
}

/** Реактивный `connected` — для UI-индикаторов и disabled-кнопок. */
export function useStompConnected(): boolean {
  return useContext(StompContext).connected;
}
