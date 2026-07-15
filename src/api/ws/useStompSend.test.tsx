import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { Client } from '@stomp/stompjs';
import { StompContext } from './stomp-context';
import { useStompSend } from './useStompSend';

function makeClient(connected = true) {
  const publish = vi.fn();
  const client = { connected, publish } as unknown as Client;
  return { client, publish };
}

function wrapWithClient(client: Client | null) {
  const connected = client !== null && (client as { connected?: boolean }).connected === true;
  return ({ children }: { children: React.ReactNode }) => (
    <StompContext.Provider value={{ client, connected }}>{children}</StompContext.Provider>
  );
}

describe('useStompSend', () => {
  it('publishes object body as JSON string', () => {
    const { client, publish } = makeClient(true);
    const { result } = renderHook(() => useStompSend(), { wrapper: wrapWithClient(client) });

    result.current('/app/session/1/offer.create', { amount: 42 });

    expect(publish).toHaveBeenCalledWith({
      destination: '/app/session/1/offer.create',
      body: '{"amount":42}',
    });
  });

  it('publishes empty string when body is undefined', () => {
    const { client, publish } = makeClient(true);
    const { result } = renderHook(() => useStompSend(), { wrapper: wrapWithClient(client) });

    result.current('/app/session/1/start');

    expect(publish).toHaveBeenCalledWith({
      destination: '/app/session/1/start',
      body: '',
    });
  });

  it('passes string body through unchanged', () => {
    const { client, publish } = makeClient(true);
    const { result } = renderHook(() => useStompSend(), { wrapper: wrapWithClient(client) });

    result.current('/app/x', 'raw text');

    expect(publish).toHaveBeenCalledWith({ destination: '/app/x', body: 'raw text' });
  });

  it('throws when client is null', () => {
    const { result } = renderHook(() => useStompSend(), { wrapper: wrapWithClient(null) });
    expect(() => result.current('/app/x')).toThrow(/не подключен/i);
  });

  it('throws when client is disconnected', () => {
    const { client } = makeClient(false);
    const { result } = renderHook(() => useStompSend(), { wrapper: wrapWithClient(client) });
    expect(() => result.current('/app/x')).toThrow(/не подключен/i);
  });
});
