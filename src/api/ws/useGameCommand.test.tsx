import { act, renderHook } from '@testing-library/react';
import type { Client } from '@stomp/stompjs';
import { StompContext } from './stomp-context';
import { useGameCommand } from './useGameCommand';

it('waits for confirmation, reports a timeout and resets for a new round', () => {
  vi.useFakeTimers();
  const publish = vi.fn();
  const client = { connected: true, publish } as unknown as Client;
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <StompContext.Provider value={{ client, connected: true }}>{children}</StompContext.Provider>
  );
  const { result, rerender, unmount } = renderHook(({ round }) => useGameCommand(round), {
    wrapper,
    initialProps: { round: 'r1' },
  });
  act(() => result.current.send('/app/session/game/round.start'));
  expect(result.current.pending).toBe(true);
  act(() => vi.advanceTimersByTime(10000));
  expect(result.current.error).toMatch(/подтвердить/);
  expect(result.current.pending).toBe(true);
  rerender({ round: 'r2' });
  expect(result.current.pending).toBe(false);
  expect(result.current.error).toBeNull();
  unmount();
  vi.useRealTimers();
});

it('reports a synchronous send failure without leaving the action locked', () => {
  const { result } = renderHook(() => useGameCommand('r1'));
  act(() => result.current.send('/app/x'));
  expect(result.current.pending).toBe(false);
  expect(result.current.error).toMatch(/не подключен/);
});
