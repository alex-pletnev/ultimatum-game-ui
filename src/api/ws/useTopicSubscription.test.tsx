import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import type { Client, IMessage, StompHeaders } from '@stomp/stompjs';
import { StompContext } from './stomp-context';
import { useTopicSubscription } from './useTopicSubscription';

/*
 * Мок STOMP Client — минимальный: connected-флаг + subscribe с ручным push'ем.
 */
type SubscribeCallback = (frame: IMessage) => void;

function makeMockClient(connected = true) {
  const subscribers: Record<string, SubscribeCallback> = {};
  const unsubscribeSpy = vi.fn();

  const client: Partial<Client> = {
    connected,
    subscribe: vi.fn((destination: string, cb: SubscribeCallback) => {
      subscribers[destination] = cb;
      return { id: destination, unsubscribe: unsubscribeSpy };
    }) as unknown as Client['subscribe'],
  };

  const push = (destination: string, body: unknown) => {
    subscribers[destination]?.({
      body: JSON.stringify(body),
      headers: {} as StompHeaders,
      ack: () => {},
      nack: () => {},
    } as unknown as IMessage);
  };

  return { client: client as Client, push, unsubscribeSpy };
}

function Harness({
  destination,
  onMessage,
}: {
  destination: string | null;
  onMessage: (p: unknown) => void;
}) {
  useTopicSubscription(destination, onMessage);
  return null;
}

describe('useTopicSubscription', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('subscribes to destination when client is connected', () => {
    const { client } = makeMockClient(true);
    const onMessage = vi.fn();

    render(
      <StompContext.Provider value={{ client }}>
        <Harness destination="/topic/session/abc/sessionStatus" onMessage={onMessage} />
      </StompContext.Provider>,
    );

    expect(client.subscribe).toHaveBeenCalledWith(
      '/topic/session/abc/sessionStatus',
      expect.any(Function),
    );
  });

  it('does nothing when client is null', () => {
    const onMessage = vi.fn();
    render(
      <StompContext.Provider value={{ client: null }}>
        <Harness destination="/topic/session/abc/sessionStatus" onMessage={onMessage} />
      </StompContext.Provider>,
    );
    expect(onMessage).not.toHaveBeenCalled();
  });

  it('does nothing when destination is null', () => {
    const { client } = makeMockClient(true);
    const onMessage = vi.fn();
    render(
      <StompContext.Provider value={{ client }}>
        <Harness destination={null} onMessage={onMessage} />
      </StompContext.Provider>,
    );
    expect(client.subscribe).not.toHaveBeenCalled();
  });

  it('parses JSON payload and forwards to onMessage', () => {
    const { client, push } = makeMockClient(true);
    const onMessage = vi.fn();

    render(
      <StompContext.Provider value={{ client }}>
        <Harness destination="/topic/x" onMessage={onMessage} />
      </StompContext.Provider>,
    );

    push('/topic/x', { hello: 'world' });
    expect(onMessage).toHaveBeenCalledWith({ hello: 'world' });
  });

  it('does not crash on malformed JSON', () => {
    const { client } = makeMockClient(true);
    const onMessage = vi.fn();

    render(
      <StompContext.Provider value={{ client }}>
        <Harness destination="/topic/x" onMessage={onMessage} />
      </StompContext.Provider>,
    );

    // Симулируем невалидный JSON — subscribe callback получает frame с "not-json".
    const cb = vi.mocked(client.subscribe).mock.calls[0]![1];
    expect(() =>
      cb({
        body: 'not-json',
        headers: {} as StompHeaders,
        ack: () => {},
        nack: () => {},
      } as unknown as IMessage),
    ).not.toThrow();
    expect(onMessage).not.toHaveBeenCalled();
  });

  it('unsubscribes on unmount', () => {
    const { client, unsubscribeSpy } = makeMockClient(true);
    const onMessage = vi.fn();

    const { unmount } = render(
      <StompContext.Provider value={{ client }}>
        <Harness destination="/topic/x" onMessage={onMessage} />
      </StompContext.Provider>,
    );

    unmount();
    expect(unsubscribeSpy).toHaveBeenCalled();
  });
});
