import { useEffect } from 'react';
import { useStomp, useStompConnected } from './stomp-context';

export function useTopicSubscription<T>(
  destination: string | null,
  onMessage: (payload: T) => void,
): void {
  const client = useStomp();
  const connected = useStompConnected();
  useEffect(() => {
    if (!client || !connected || !destination) return;
    const subscription = client.subscribe(destination, (frame) => {
      let payload: T;
      try {
        payload = JSON.parse(frame.body) as T;
      } catch {
        return;
      }
      onMessage(payload);
    });
    return () => {
      if (client.connected) subscription.unsubscribe();
    };
  }, [client, connected, destination, onMessage]);
}
