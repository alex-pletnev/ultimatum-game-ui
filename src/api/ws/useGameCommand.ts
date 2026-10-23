import { useContext, useEffect, useRef, useState } from 'react';
import { StompContext } from './stomp-context';
import { useStompSend } from './useStompSend';

export function useGameCommand(scope: string) {
  const publish = useStompSend();
  const { error: serverError } = useContext(StompContext);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const errorAtSend = useRef(serverError);
  const locked = useRef(false);
  useEffect(() => {
    locked.current = false;
    setPending(false);
    setError(null);
  }, [scope]);
  useEffect(() => {
    if (!pending) return;
    // Never resend a possibly completed command until the authoritative state is reloaded.
    const timer = setTimeout(
      () => setError('Не удалось подтвердить действие. Обновите игру, чтобы проверить результат.'),
      10000,
    );
    return () => clearTimeout(timer);
  }, [pending]);
  useEffect(() => {
    if (pending && serverError && serverError !== errorAtSend.current)
      setError(serverError.message);
  }, [serverError, pending]);
  const send = (destination: string, body?: unknown) => {
    if (locked.current) return;
    locked.current = true;
    setError(null);
    errorAtSend.current = serverError;
    try {
      publish(destination, body);
      setPending(true);
    } catch (e) {
      locked.current = false;
      setPending(false);
      setError(e instanceof Error ? e.message : 'Не удалось отправить действие.');
    }
  };
  return { send, pending, error };
}
